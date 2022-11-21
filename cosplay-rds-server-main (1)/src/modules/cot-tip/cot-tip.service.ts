import configs from '@config';
import { OnDistributeInput } from '@modules/cot-tip/dto/input/on-distribute';
import { OnTipInput } from '@modules/cot-tip/dto/input/on-tip';
import { OnDistributeResponse } from '@modules/cot-tip/dto/response/on-distribute';
import { OnTipResponse } from '@modules/cot-tip/dto/response/on-tip';
import { Photo } from '@modules/photo/photo.model';
import { DisclosureRange } from '@modules/post/enum/disclosure-range';
import { Post } from '@modules/post/post.model';
import { UserRepository } from '@modules/user/user.repository';
import { COTTipNFTDistributionState } from '@prisma/client';
import { SqsService } from '@providers/sqs.provider';
import { BigNumber } from 'bignumber.js';
import { Service } from 'typedi';
import { OnDistributeResult, OnTipResult } from './cot-tip.model';
import { COTTipRepository } from './cot-tip.repository';

const { sqsDistributeNFTQueueUrl, sqsUploadDistributedNFTMetadataQueueUrl } = configs.aws;

@Service()
export class COTTipService {
  constructor(
    private readonly cotTipRepository: COTTipRepository,
    private readonly userRepository: UserRepository,
    private readonly sqsService: SqsService,
  ) {}

  async onTip(input: OnTipInput): Promise<OnTipResponse> {
    const existTxHash = await this.cotTipRepository.findTxHash({
      where: {
        txHash: input.txHash,
      },
    });

    if (existTxHash != null) {
      return {
        result: OnTipResult.TX_HASH_ALREADY_TRIGGERED,
        message: `Transaction hash: ${input.txHash} is already triggered`,
      };
    }

    if (input.tipFrom.toLowerCase() === input.targetCosplayer.toLowerCase()) {
      // セルフ投げ銭は禁止
      await this.cotTipRepository.registerTxHash(input.txHash, false);

      return {
        result: OnTipResult.SELF_TIPPING_FORBIDDEN,
        message: `Target cosplayer: ${input.targetCosplayer} is same as tip from (txHash: ${input.txHash})`,
      };
    }

    const targetCosplayerPosts = await this.userRepository.findOne({
      select: {
        posts: {
          select: {
            id: true,
            photos: true,
            disclosureRange: true,
          },
        },
      },
      where: {
        userPrivate: {
          publicAddress: {
            equals: input.targetCosplayer,
            mode: 'insensitive',
          },
        },
      },
    });
    if (
      !targetCosplayerPosts ||
      (targetCosplayerPosts.posts?.length || 0) === 0 ||
      !targetCosplayerPosts.posts?.find(
        (post) =>
          post.disclosureRange === DisclosureRange.ALL &&
          post.photos &&
          (post.photos?.length || 0) > 0,
      )
    ) {
      // 対象レイヤーが1つも投稿していない
      await this.cotTipRepository.registerTxHash(input.txHash, false);

      return {
        result: OnTipResult.TARGET_COSPLAYER_HAS_NO_POST,
        message: `Target cosplayer: ${input.targetCosplayer} has no post (txHash: ${input.txHash})`,
      };
    }

    const nftDistributionState = await this.findNftDistributionStateFromPublicAddress(
      input.targetCosplayer,
    );
    if (!nftDistributionState) {
      // 対象レイヤーがNFT配布ステートに未登録
      await this.cotTipRepository.registerTxHash(input.txHash, false);

      return {
        result: OnTipResult.TARGET_COSPLAYER_NOT_REGISTERED,
        message: `Target cosplayer: ${input.targetCosplayer} is not registered (txHash: ${input.txHash})`,
      };
    }

    const canDistribute = new BigNumber(input.cotAmount).gte(
      new BigNumber(nftDistributionState.lowerCOT),
    );
    if (canDistribute) {
      await this.sendQueue(input, nftDistributionState.targetERC721);
    }

    await this.cotTipRepository.registerTxHash(input.txHash, canDistribute);

    if (canDistribute) {
      return {
        result: OnTipResult.OK,
        message: `Enqueued NFT distribution queue (txHash: ${input.txHash})`,
      };
    }

    return {
      result: OnTipResult.INSUFFICIENT_COT,
      message: `Insufficient COT amount (required: ${nftDistributionState.lowerCOT}, tipped: ${input.cotAmount}) (txHash: ${input.txHash})`,
    };
  }

  private async sendQueue(input: OnTipInput, targetNFT: string): Promise<void> {
    try {
      await this.sqsService.sendQueue({
        QueueUrl: sqsDistributeNFTQueueUrl,
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: 'DistributeNFT',
          },
          payload: {
            DataType: 'String',
            StringValue: JSON.stringify({
              tipFrom: input.tipFrom,
              targetNFT: targetNFT,
              tipTarget: input.targetCosplayer,
            }),
          },
        },
        MessageGroupId: `distribute_nft_${input.txHash}`,
        MessageDeduplicationId: input.txHash,
        MessageBody: `Distribute NFT. TxHash(COT): ${input.txHash}, TipFrom: ${input.tipFrom} -> ${input.cotAmount} COT -> TargetCosplayer: ${input.targetCosplayer}, TargetNFT: ${targetNFT}`,
      });
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw new Error(`fail to send queue: ${message} (txHash: ${input.txHash})`);
    }
  }

  async onDistribute(input: OnDistributeInput): Promise<OnDistributeResponse> {
    const existTxHash = await this.cotTipRepository.findDistributionTxHash({
      where: {
        txHash: input.txHash,
      },
    });

    if (existTxHash != null) {
      return {
        result: OnDistributeResult.TX_HASH_ALREADY_TRIGGERED,
        message: `Transaction hash: ${input.txHash} is already triggered`,
      };
    }

    const user = await this.userRepository.findOne({
      select: {
        id: true,
        name: true,
        posts: {
          select: {
            id: true,
            caption: true,
            photos: true,
            disclosureRange: true,
          },
        },
      },
      where: {
        userPrivate: {
          publicAddress: {
            equals: input.tipTarget,
            mode: 'insensitive',
          },
        },
      },
    });
    if (!user) {
      throw new Error(
        `failed to process on distribute. user not found (tipTarget: ${input.tipTarget}, txHash: ${input.tipTarget})`,
      );
    } else if (!user.posts || user.posts.length === 0) {
      throw new Error(
        `failed to process on distribute. no user posts (tipTarget: ${input.tipTarget}, tipTargetUserId: ${user.id}, txHash: ${input.tipTarget})`,
      );
    }

    const nftDistributionState = await this.findNftDistributionStateFromPublicAddress(
      input.tipTarget,
    );
    if (!nftDistributionState) {
      throw new Error(
        `failed to process on distribute. Tip target: ${input.tipTarget} is not registered (txHash: ${input.txHash})`,
      );
    } else if (
      input.contractAddress.toLowerCase() != nftDistributionState.targetERC721.toLowerCase()
    ) {
      throw new Error(
        `failed to process on distribute. contract address mismatch (input: ${input.contractAddress} - registered: ${nftDistributionState.targetERC721}) (tipTarget: ${input.tipTarget}, txHash: ${input.txHash})`,
      );
    }

    try {
      const [pickedPost, pickedPhoto] = this.pickPost(user.posts);
      await this.sendQueueNFTMetadata(
        input,
        pickedPost.id,
        pickedPhoto.id,
        user.name,
        pickedPost.caption || '',
        pickedPhoto.image,
      );

      await this.cotTipRepository.registerDistributionTxHash(
        input.txHash,
        pickedPost.id,
        pickedPhoto.id,
      );

      return {
        result: OnDistributeResult.OK,
        message: `Enqueued upload NFT metadata queue (txHash: ${input.txHash})`,
      };
    } catch (e) {
      const { message } = <Error>e;
      throw new Error(
        `failed to process on distribute: ${message} (tipTarget: ${input.tipTarget}, tipTargetUserId: ${user.id}, txHash: ${input.tipTarget})`,
      );
    }
  }

  private pickPost(posts: Post[]): [Post, Photo] {
    const targetPosts = posts.filter(
      (post) =>
        post.disclosureRange === DisclosureRange.ALL && post.photos && post.photos.length > 0,
    );
    if (targetPosts.length === 0) {
      throw new Error('failed to pick post.');
    }
    const pickPostIndex = Math.floor(Math.random() * targetPosts.length);
    const pickedPost = posts[pickPostIndex];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pickPhotoIndex = Math.floor(Math.random() * pickedPost.photos!.length);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return [pickedPost, pickedPost.photos![pickPhotoIndex]];
  }

  private async sendQueueNFTMetadata(
    input: OnDistributeInput,
    postId: number,
    photoId: number,
    name: string,
    description: string,
    image: string,
  ): Promise<void> {
    try {
      await this.sqsService.sendQueue({
        QueueUrl: sqsUploadDistributedNFTMetadataQueueUrl,
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: 'UploadDistributedNFTMetadata',
          },
          payload: {
            DataType: 'String',
            StringValue: JSON.stringify({
              contractAddress: input.contractAddress,
              tokenId: input.tokenId,
              name,
              description,
              image: `${configs.file.photoDomain}${image}`,
            }),
          },
        },
        MessageGroupId: `upload_distributed_nft_metadata_${input.txHash}`,
        MessageDeduplicationId: input.txHash,
        MessageBody: `Upload distributed NFT metadata. TxHash(Distribute): ${input.txHash}, Target: ${input.tipTarget}, Contract: ${input.contractAddress}, TokenId: ${input.tokenId}, PostId: ${postId}, PhotoId: ${photoId}`,
      });
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw new Error(`fail to send queue NFT metadata: ${message} (txHash: ${input.txHash})`);
    }
  }

  // TODO: publicAddressはUniqueでなく複数存在する場合がある、今の所1つの想定でコードを書く
  private async findNftDistributionStateFromPublicAddress(
    targetCosplayerPublicAddress: string,
  ): Promise<COTTipNFTDistributionState | null> {
    const user = await this.userRepository.findOne({
      where: {
        userPrivate: {
          publicAddress: {
            equals: targetCosplayerPublicAddress,
            mode: 'insensitive',
          },
        },
      },
      include: {
        cOTTipNFTDistributionState: true,
      },
    });

    return user?.cOTTipNFTDistributionState ?? null;
  }
}
