import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import 'reflect-metadata';
import { NFTCampaign } from '../../../src/modules/nft-campaign/nft-campaign.model';
import { NftCampaignRepository } from '../../../src/modules/nft-campaign/nft-campaign.repository';
import { NftCampaignService } from '../../../src/modules/nft-campaign/nft-campaign.service';
import { NFT } from '../../../src/modules/nft/nft.model';
import { NftRepository } from '../../../src/modules/nft/nft.repository';
import { UserHasNFT } from '../../../src/modules/user-has-nft/user-has-nft.model';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';

describe('NftCampaignService', () => {
  let userHasNftRepository: UserHasNftRepository;
  const nftCampaignRepository = new NftCampaignRepository(prisma);
  const nftRepository = new NftRepository(prisma);
  let nftCampaignService: NftCampaignService;
  let issuerUser: User;
  let hasUser: User;
  let newNft: NFT;
  let newCampaign: NFTCampaign;
  let userHasNft: UserHasNFT;

  beforeAll(async () => {
    userHasNftRepository = new UserHasNftRepository(prisma);
    nftCampaignService = new NftCampaignService(
      nftCampaignRepository,
      nftRepository,
      userHasNftRepository,
    );
    issuerUser = ((await prisma.user.findMany()) as User[])[0];
    hasUser = ((await prisma.user.findMany()) as User[])[1];

    // active campaign
    newCampaign = await prisma.nFTCampaign.create({
      data: {
        title: 'nft_campaign_title_',
        description: 'nft_campaign_description_1',
        userId: issuerUser.id,
        start: new Date(new Date().setDate(new Date().getDate() - 1)),
        end: new Date(new Date().setDate(new Date().getDate() + 1)),
        contract: '0xAAA',
        emissionRateTable: { rarity1: 60, rarity2: 20, rarity3: 10, rarity4: 8, rarity5: 2 },
      },
    });

    // inactive Campaign
    await prisma.nFTCampaign.create({
      data: {
        title: 'nft_campaign_title_2',
        description: 'nft_campaign_description_2',
        userId: hasUser.id,
        start: new Date(new Date().setDate(new Date().getDate() - 10)),
        end: new Date(new Date().setDate(new Date().getDate() - 5)),
        contract: '0xAAA',
        emissionRateTable: { rarity1: 60, rarity2: 20, rarity3: 10, rarity4: 8, rarity5: 2 },
      },
    });

    newNft = await prisma.nFT.create({
      data: {
        address: 'campaign-nft-address',
        tokenID: '1000',
        totalSupply: 1000,
        name: 'testNftName',
        description: 'testNftDescription',
        image: 'testNftImage',
        rarity: 1,
        campaignId: newCampaign.id,
      },
    });

    userHasNft = await prisma.userHasNFT.create({
      data: {
        nftId: newNft.id,
        amount: 100,
        shipped: 10,
        userId: hasUser.id,
      },
    });
  });

  describe('getUserNftCampaign', () => {
    it('throw invalid nftCampaignId', async () => {
      await expect(nftCampaignService.getUserNftCampaign(1000, hasUser)).rejects.toThrow(
        'invalid nftCampaignId',
      );
    });

    it('returns nft that has amount and shipped', async () => {
      const result = await nftCampaignService.getUserNftCampaign(newCampaign.id, hasUser);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('contract');
      expect(result).toHaveProperty('emissionRateTable');

      result?.nfts?.map((nft) => expect(nft).toHaveProperty('amount'));
      result?.nfts?.map((nft) => expect(nft).toHaveProperty('shipped'));

      expect(
        (result?.nfts?.find((nft) => nft.id === userHasNft.nftId) as NFT & { amount: number })
          .amount,
      ).toBe(userHasNft.amount);
      expect(
        (result?.nfts?.find((nft) => nft.id === userHasNft.nftId) as NFT & { shipped: number })
          .shipped,
      ).toBe(userHasNft.shipped);
    });

    it('the number of amount and shipped are 0 when passing no user', async () => {
      const result = await nftCampaignService.getUserNftCampaign(newCampaign.id);

      result?.nfts?.map((nft) => expect((nft as NFT & { amount: number }).amount).toBe(0));
      result?.nfts?.map((nft) => expect((nft as NFT & { shipped: number }).shipped).toBe(0));
    });
  });

  describe('getUserNftCampaignByNftId', () => {
    it('throw invalid nftId', async () => {
      await expect(nftCampaignService.getUserNftCampaignByNftId(1000, hasUser)).rejects.toThrow(
        'invalid nftId',
      );
    });

    it('returns nft that has amount and shipped', async () => {
      const result = await nftCampaignService.getUserNftCampaignByNftId(newNft.id, hasUser);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('contract');
      expect(result).toHaveProperty('emissionRateTable');

      result?.nfts?.map((nft) => expect(nft).toHaveProperty('amount'));
      result?.nfts?.map((nft) => expect(nft).toHaveProperty('shipped'));

      expect(
        (result?.nfts?.find((nft) => nft.id === userHasNft.nftId) as NFT & { amount: number })
          .amount,
      ).toBe(userHasNft.amount);
      expect(
        (result?.nfts?.find((nft) => nft.id === userHasNft.nftId) as NFT & { shipped: number })
          .shipped,
      ).toBe(userHasNft.shipped);
    });

    it('the number of amount and shipped are 0 when passing no user', async () => {
      const result = await nftCampaignService.getUserNftCampaignByNftId(newNft.id);

      result?.nfts?.map((nft) => expect((nft as NFT & { amount: number }).amount).toBe(0));
      result?.nfts?.map((nft) => expect((nft as NFT & { shipped: number }).shipped).toBe(0));
    });
  });

  describe('getUserActiveCampaign', () => {
    it('returns active campaign', async () => {
      const result = await nftCampaignService.getUserActiveCampaign(issuerUser.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('contract');
      expect(result).toHaveProperty('emissionRateTable');
    });

    it('return null when there is no active campaign', async () => {
      const result = await nftCampaignService.getUserActiveCampaign(hasUser.id);

      expect(result).toBe(null);
    });
  });
});
