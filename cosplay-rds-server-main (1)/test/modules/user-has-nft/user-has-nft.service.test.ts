import 'reflect-metadata';
import { NFTCampaign } from '../../../src/modules/nft-campaign/nft-campaign.model';
import { NFT } from '../../../src/modules/nft/nft.model';
import { UserHasNFT } from '../../../src/modules/user-has-nft/user-has-nft.model';
import { UserHasNftService } from '../../../src/modules/user-has-nft/user-has-nft.service';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';
import { sqsService, generatorService, userHasNftRepository } from '../../service-instance';

describe('UserHasNftService', () => {
  let userHasNftService: UserHasNftService;
  let issuerUser: User;
  let hasUser: User;
  let newNft: NFT;
  let newCampaign: NFTCampaign;
  let newUserHasNFT: UserHasNFT;

  beforeAll(async () => {
    userHasNftService = new UserHasNftService(userHasNftRepository, sqsService, generatorService);
    issuerUser = ((await prisma.user.findMany()) as User[])[0];
    hasUser = ((await prisma.user.findMany()) as User[])[1];

    newCampaign = await prisma.nFTCampaign.create({
      data: {
        title: 'nftcampaign_user_has_nft_title',
        description: 'nftcampaign_user_has_nft_description',
        userId: issuerUser.id,
        start: new Date(),
        end: new Date(),
        contract: '0xAAA',
        emissionRateTable: { rarity1: 60, rarity2: 20, rarity3: 10, rarity4: 8, rarity5: 2 },
      },
    });

    newNft = await prisma.nFT.create({
      data: {
        address: 'user-has-nft-01-address',
        tokenID: '1000',
        totalSupply: 1000,
        name: 'testNftName',
        description: 'testNftDescription',
        image: 'testNftImage',
        rarity: 1,
        campaignId: newCampaign.id,
      },
    });

    newUserHasNFT = await prisma.userHasNFT.create({
      data: {
        nftId: newNft.id,
        amount: 100,
        shipped: 10,
        userId: hasUser.id,
      },
    });
  });

  const setup = () => {
    const mockedFunctions = {
      mockThrow: jest.fn().mockImplementationOnce(() => {
        throw new Error('error');
      }),
      sendQueue: jest.fn().mockResolvedValue(null),
    };

    sqsService.sendQueue = mockedFunctions.sendQueue;

    return mockedFunctions;
  };

  describe('findOwnedNFTs', () => {
    it('returns userHasNfts', async () => {
      const result = await userHasNftService.findOwnedNFTs(hasUser.id);
      const nft = result[0].nft;

      expect(nft).toHaveProperty('id');
      expect(nft).toHaveProperty('name');
      expect(nft).toHaveProperty('description');
      expect(nft).toHaveProperty('image');
      expect(nft).toHaveProperty('amount');
      expect(nft).toHaveProperty('shipped');
    });
  });

  describe('getUserCampaignNfts', () => {
    it('returns userHasNft', async () => {
      const result = await userHasNftService.getUserCampaignNfts(hasUser.id, newCampaign.id);
      const userHasNft = result[0];

      expect(userHasNft).toHaveProperty('id');
      expect(userHasNft).toHaveProperty('userId');
      expect(userHasNft).toHaveProperty('nftId');
      expect(userHasNft).toHaveProperty('amount');
      expect(userHasNft).toHaveProperty('shipped');
    });
  });

  describe('shipNFT', () => {
    it('throw invalid nftId', async () => {
      const input = {
        nftId: 1000,
        amount: 1,
        targetAddress: 'test-target-address',
      };

      await expect(userHasNftService.shipNFT(hasUser.id, input)).rejects.toThrow(
        'user does not have this nft. nftId 1000',
      );
    });

    it('throw amount is not enough', async () => {
      setup();
      await prisma.userHasNFT.update({
        where: {
          id: newUserHasNFT.id,
        },
        data: {
          amount: 0,
        },
      });
      const input = {
        nftId: newNft.id,
        amount: 100,
        targetAddress: 'test-target-address',
      };

      await expect(userHasNftService.shipNFT(hasUser.id, input)).rejects.toThrow(
        'nft amount is not enough',
      );
    });

    it('shipped nft', async () => {
      setup();
      await prisma.userHasNFT.update({
        where: {
          id: newUserHasNFT.id,
        },
        data: {
          amount: 10,
        },
      });
      const input = {
        nftId: newNft.id,
        amount: 1,
        targetAddress: 'test-target-address',
      };

      const result = await userHasNftService.shipNFT(hasUser.id, input);

      expect(result.amount).toBe(10 - 1);
    });
  });
});
