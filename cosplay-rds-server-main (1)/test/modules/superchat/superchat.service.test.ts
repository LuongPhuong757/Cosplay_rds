import 'reflect-metadata';
import { NftCampaignRepository } from '../../../src/modules/nft-campaign/nft-campaign.repository';
import { NftCampaignService } from '../../../src/modules/nft-campaign/nft-campaign.service';
import { NFTGachaRepository } from '../../../src/modules/nft-gacha/nft-gacha.repository';
import { NFTGachaService } from '../../../src/modules/nft-gacha/nft-gacha.service';
import { NftRepository } from '../../../src/modules/nft/nft.repository';
import { NotificationService } from '../../../src/modules/notification/notification.service';
import { ScoreLogRepository } from '../../../src/modules/score-log/score-log.repository';
import { ScoreLogService } from '../../../src/modules/score-log/score-log.service';
import { Superchat } from '../../../src/modules/superchat/superchat.model';
import { SuperchatRepository } from '../../../src/modules/superchat/superchat.repository';
import { SuperchatService } from '../../../src/modules/superchat/superchat.service';
import { UserHasNftRepository } from '../../../src/modules/user-has-nft/user-has-nft.repository';
import { GachaService } from '../../../src/services/gacha.service';
import { firstUser } from '../../data';
import {
  fetchFirstTestPost,
  fetchSuperChat,
  mockMessageAttributes,
  fetchTestComment,
} from '../../helper';
import { prisma } from '../../prisma-instance';

describe('SuperchatService', () => {
  let notificationService: NotificationService;
  let scoreLogService: ScoreLogService;
  let superchatService: SuperchatService;
  let scoreLogRepository: ScoreLogRepository;
  let nftCampaignRepository: NftCampaignRepository;
  let userHasNftRepository: UserHasNftRepository;
  let nftCampaignService: NftCampaignService;
  let nftGachaRepository: NFTGachaRepository;
  let superchatRepository: SuperchatRepository;
  let gachaService: GachaService;
  let nftGachaService: NFTGachaService;
  let nftRepository: NftRepository;

  // data
  let createdSuperchat: Superchat;

  const setup = () => {
    const mockedFunctions = {
      mockCreateNotification: jest.fn().mockResolvedValue(true),
    };

    return mockedFunctions;
  };

  beforeAll(() => {
    notificationService = new NotificationService(prisma);
    scoreLogRepository = new ScoreLogRepository(prisma);
    gachaService = new GachaService();
    scoreLogService = new ScoreLogService(scoreLogRepository);
    nftCampaignRepository = new NftCampaignRepository(prisma);
    nftGachaRepository = new NFTGachaRepository(prisma);
    nftRepository = new NftRepository(prisma);
    superchatRepository = new SuperchatRepository(prisma);
    nftCampaignService = new NftCampaignService(
      nftCampaignRepository,
      nftRepository,
      userHasNftRepository,
    );
    nftGachaService = new NFTGachaService(
      nftGachaRepository,
      superchatRepository,
      nftRepository,
      userHasNftRepository,
      gachaService,
    );

    // superchat
    superchatService = new SuperchatService(
      prisma,
      notificationService,
      scoreLogService,
      nftGachaService,
      nftCampaignService,
      superchatRepository,
    );
  });

  describe('createSuperchat', () => {
    it('create superchat', async () => {
      const { mockCreateNotification } = setup();
      notificationService.createNotification = mockCreateNotification;

      const testPost = await fetchFirstTestPost();
      const testComment = await fetchTestComment('testComment');

      const input = mockMessageAttributes();
      input.payload.StringValue = JSON.stringify({
        auth0Id: firstUser.auth0Id,
        postId: String(testPost.id),
        replyId: String(testComment.id),
        currency: 'jpy',
        amount: 400,
        paymentIntentId: 'testPaymentIntentId1',
      });

      const result = await superchatService.createSuperchat(input);
      createdSuperchat = await fetchSuperChat({
        where: {
          paymentIntentId: 'testPaymentIntentId1',
        },
        include: {
          comment: true,
        },
      });

      expect(createdSuperchat).toHaveProperty('id');
      expect(createdSuperchat).toHaveProperty('userId');
      expect(createdSuperchat).toHaveProperty('comment');

      expect(mockCreateNotification).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('no exists superchat user.', async () => {
      const input = mockMessageAttributes();
      input.payload.StringValue = JSON.stringify({
        auth0Id: 'auth0superchat',
        postId: String(1),
        replyId: String(1),
        currency: 'jpy',
        amount: 400,
        paymentIntentId: 'testPaymentIntentId2',
      });
      const result = await superchatService.createSuperchat(input);

      expect(result).toBe(false);
    });

    it('no exists superchat post.', async () => {
      const input = mockMessageAttributes();
      input.payload.StringValue = JSON.stringify({
        auth0Id: firstUser.auth0Id,
        postId: String(1000),
        replyId: String(1),
        currency: 'jpy',
        amount: 400,
        paymentIntentId: 'testPaymentIntentId3',
      });
      const result = await superchatService.createSuperchat(input);

      expect(result).toBe(false);
    });
  });

  describe('refundSuperchat', () => {
    it('not found superchat', async () => {
      const input = mockMessageAttributes();
      input.payload.StringValue = JSON.stringify({
        paymentIntentId: 'notFoundPaymentIntentId',
      });
      const result = await superchatService.refundSuperchat(input);

      expect(result).toBe(false);
    });

    it('refund superchat', async () => {
      const input = mockMessageAttributes();
      input.payload.StringValue = JSON.stringify({
        paymentIntentId: createdSuperchat.paymentIntentId,
      });
      const result = await superchatService.refundSuperchat(input);

      const score = await prisma.scoreLog.findFirst({
        where: {
          paymentIntentId: createdSuperchat.paymentIntentId,
        },
      });

      expect(result).toBe(true);
      expect(score).toBe(null);
    });
  });
});
