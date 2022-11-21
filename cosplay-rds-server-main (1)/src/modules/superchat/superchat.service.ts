import { getSqsMessageAttribute } from '@common/util/get-sqs-message-attribute-map';
import { jsonParseSqsBody } from '@common/util/json-parse-sqs-body';
import { CreateSuperchatPayloadType, RefundSuperchatPayloadType } from '@interfaces';
import { NftCampaignService } from '@modules/nft-campaign/nft-campaign.service';
import { NFTGachaService } from '@modules/nft-gacha/nft-gacha.service';
import { InfoType } from '@modules/notification/enum/info-type';
import { NotificationService } from '@modules/notification/notification.service';
import { ScoreLogService } from '@modules/score-log/score-log.service';
import { PrismaService } from '@services/prisma.service';
import SQS from 'aws-sdk/clients/sqs';
import { Service } from 'typedi';
import { SuperchatRepository } from './superchat.repository';

@Service()
export class SuperchatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly scoreLogService: ScoreLogService,
    private readonly nftGachaService: NFTGachaService,
    private readonly nftCampaignService: NftCampaignService,
    private readonly superchatRepository: SuperchatRepository,
  ) {}

  // TODO: Transaction
  // await this.prisma.$transaction(async (tx) => {})
  async createSuperchat(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    const { objStr } = getSqsMessageAttribute(messageAttributes);
    const { payload } = objStr;
    const {
      auth0Id,
      postId,
      comment,
      replyId,
      currency,
      amount,
      paymentIntentId,
    } = jsonParseSqsBody<CreateSuperchatPayloadType>(payload, [
      'auth0Id',
      'postId',
      'amount',
      'currency',
      'paymentIntentId',
    ]);

    try {
      const superchatUser = await this.prisma.user.findFirst({
        where: {
          auth0Id,
        },
      });
      if (!superchatUser) {
        throw Error(`user does not exist. auth0Id: ${auth0Id}.`);
      }

      const post = await this.prisma.post.findFirst({
        select: {
          userId: true,
        },
        where: {
          id: postId,
        },
      });
      if (!post) {
        throw Error(`post does not exist. postId: ${postId}.`);
      }

      const newComment = await this.prisma.comment.create({
        data: {
          userId: superchatUser.id,
          postId: postId,
          comment: comment ?? null,
          replyId: replyId ?? null,
        },
      });

      // TODO: 全部amountはjpyに統一する。(4月30日)
      const newPrice = await this.prisma.price.create({
        data: {
          currency,
          amount,
          jpy: amount,
        },
      });

      const superchat = await this.prisma.superchat.create({
        data: {
          userId: superchatUser.id,
          priceId: newPrice.id,
          commentId: newComment.id,
          paymentIntentId,
        },
      });

      // timelineのsuperchat not nullフィルターで必要。
      await this.prisma.comment.update({
        where: {
          id: newComment.id,
        },
        data: {
          superchatId: superchat.id,
        },
      });

      const activeNftCampaign = await this.nftCampaignService.getUserActiveCampaign(post.userId);
      if (activeNftCampaign) {
        // NFT Gachaを行う
        // Errorが起きたら潰す
        try {
          await this.nftGachaService.createGacha(
            activeNftCampaign,
            amount,
            superchat.id,
            superchatUser.id,
          );
        } catch (error) {
          const { message } = <Error>error;

          console.error(`FATAL: nft gacha happed error ${message}`);
        }
      }

      await this.scoreLogService.superchat(postId, superchatUser.id, amount, paymentIntentId);
      await this.notificationService.createNotification(
        superchatUser.id,
        post.userId,
        InfoType.SUPERCHAT,
        postId,
      );

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`created superchat successfully. superchatId: ${superchat.id}.`);

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot create superchat. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  async refundSuperchat(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    const { objStr } = getSqsMessageAttribute(messageAttributes);
    const { payload } = objStr;
    const { paymentIntentId } = jsonParseSqsBody<RefundSuperchatPayloadType>(payload, [
      'paymentIntentId',
    ]);

    try {
      const superchat = await this.superchatRepository.findFirst({
        where: {
          paymentIntentId,
        },
        include: {
          price: true,
        },
      });
      if (!superchat) {
        throw new Error(`superchat is not found. paymentIntentId: ${paymentIntentId}`);
      }
      const score = await this.scoreLogService.findFirst({
        where: {
          paymentIntentId,
        },
      });
      if (!score) {
        throw new Error('not found score');
      }

      await this.prisma.$transaction([
        this.prisma.superchat.delete({
          where: {
            id: superchat.id,
          },
        }),
        this.prisma.scoreLog.delete({
          where: {
            id: score.id,
          },
        }),
      ]);

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot refund superchat. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }
}
