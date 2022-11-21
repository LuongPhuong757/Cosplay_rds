import { User } from '@modules/user/user.model';
import { prisma } from '../../prisma-instance';
import { nftService } from '../../service-instance';

describe('NftService', () => {
  let issuerUser: User;

  beforeAll(async () => {
    issuerUser = ((await prisma.user.findMany()) as User[])[0];
  });

  describe('findIssuedNFTs', () => {
    beforeAll(async () => {
      const campaign = await prisma.nFTCampaign.create({
        data: {
          title: 'nftcampaign_nft_title',
          description: 'nftcampaign_nft_description',
          userId: issuerUser.id,
          start: new Date(),
          end: new Date(),
          contract: '0xAAA',
          emissionRateTable: { 1: 60 },
        },
      });

      await prisma.nFT.create({
        data: {
          address: 'nft01-address',
          tokenID: '1000',
          totalSupply: 1000,
          name: 'testNftName',
          description: 'testNftDescription',
          image: 'testNftImage',
          rarity: 1,
          campaignId: campaign.id,
        },
      });
    });

    it('returns nfts', async () => {
      const result = await nftService.findIssuedNFTs(issuerUser.id);
      const nft = result[0];

      expect(nft).toHaveProperty('id');
      expect(nft).toHaveProperty('tokenID');
      expect(nft).toHaveProperty('totalSupply');
      expect(nft).toHaveProperty('name');
      expect(nft).toHaveProperty('image');
      expect(nft).toHaveProperty('description');
      expect(nft).toHaveProperty('campaignId');
      expect(nft).toHaveProperty('rarity');
      expect(nft).toHaveProperty('amount');
      expect(nft).toHaveProperty('shipped');
    });

    it('find nft by id', async () => {
      const result = await nftService.findIssuedNFTs(issuerUser.id);
      const nft0 = result[0];
      const nft = await nftService.findNFTById(nft0.id);

      expect(nft).toHaveProperty('id');
      expect(nft).toHaveProperty('tokenID');
      expect(nft).toHaveProperty('totalSupply');
      expect(nft).toHaveProperty('name');
      expect(nft).toHaveProperty('image');
      expect(nft).toHaveProperty('description');
      expect(nft).toHaveProperty('campaignId');
      expect(nft).toHaveProperty('rarity');
      expect(nft).toHaveProperty('amount');
      expect(nft).toHaveProperty('shipped');
      expect(nft).toHaveProperty('campaign');
      expect(nft?.campaign).toHaveProperty('user');
    });
  });
});
