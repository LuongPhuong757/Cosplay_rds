import { NFT } from '@prisma/client';
import { Comment } from '../../../src/modules/comment/comment.model';
import { NFTCampaign } from '../../../src/modules/nft-campaign/nft-campaign.model';
import { NFTGachaRepository } from '../../../src/modules/nft-gacha/nft-gacha.repository';
import { NFTGachaService } from '../../../src/modules/nft-gacha/nft-gacha.service';
import { NftRepository } from '../../../src/modules/nft/nft.repository';
import { Post } from '../../../src/modules/post/post.model';
import { Superchat } from '../../../src/modules/superchat/superchat.model';
import { SuperchatRepository } from '../../../src/modules/superchat/superchat.repository';
import { UserHasNftRepository } from '../../../src/modules/user-has-nft/user-has-nft.repository';
import { User } from '../../../src/modules/user/user.model';
import { GachaService } from '../../../src/services/gacha.service';
import { prisma } from '../../prisma-instance';

describe('NFTGachaService', () => {
  const nftGachaRepository = new NFTGachaRepository(prisma);
  const superchatRepository = new SuperchatRepository(prisma);
  const nftRepository = new NftRepository(prisma);
  const userHasNFTRepository = new UserHasNftRepository(prisma);
  const gachaService = new GachaService();
  const nftGachaService = new NFTGachaService(
    nftGachaRepository,
    superchatRepository,
    nftRepository,
    userHasNFTRepository,
    gachaService,
  );
  let issuerUser: User;
  let targetUser: User;
  let newNft: NFT;
  let comment: Comment;
  let superchat: Superchat;
  let newCampaign: NFTCampaign;

  beforeAll(async () => {
    issuerUser = await prisma.user.create({
      data: {
        auth0Id: 'gacha_auth0Id',
        name: 'gacha_name',
        account: 'gacha_account',
        icon: 'gacha_icon',
        isBan: false,
        isCosplayer: false,
      },
    });
    targetUser = ((await prisma.user.findMany()) as User[])[1];
    const price = await prisma.price.create({
      data: {
        currency: 'jpy',
        amount: 1000,
        jpy: 1000,
      },
    });
    const post = ((await prisma.post.findMany()) as Post[])[0];

    newCampaign = await prisma.nFTCampaign.create({
      data: {
        title: 'nftcampaign_gacha_title',
        description: 'nftcampaign_gacha_description',
        userId: issuerUser.id,
        start: new Date(),
        end: new Date(),
        contract: '0xAAA',
        emissionRateTable: { 1: 60 },
        // emissionRateTable: { 1: 60, 2: 20, 3: 10, 4: 8, 5: 2 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    newNft = await prisma.nFT.create({
      data: {
        address: 'gacha-nft-address',
        tokenID: '1000',
        totalSupply: 1000,
        name: 'testNftName',
        description: 'testNftDescription',
        image: 'testNftImage',
        rarity: 1,
        campaignId: newCampaign.id,
      },
    });

    comment = await prisma.comment.create({
      data: {
        userId: targetUser.id,
        comment: 'testComment',
        postId: post.id,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    superchat = await prisma.superchat.create({
      data: {
        userId: targetUser.id,
        commentId: comment.id,
        priceId: price.id,
        paymentIntentId: 'gachaTestPaymentIntentId',
      },
    });
  });

  describe('getNftGacha', () => {
    it('invalid request', async () => {
      await expect(
        nftGachaService.getNftGacha(targetUser.id, 'notFoundPaymentIntentId'),
      ).rejects.toThrow('invalid request');
    });

    it('create Gacha', async () => {
      await nftGachaService.createGacha(newCampaign, 1000, superchat.id, targetUser.id);
      const nftGacha = await nftGachaService.getNftGacha(targetUser.id, 'gachaTestPaymentIntentId');

      expect(nftGacha.length).toBeGreaterThan(0);
      expect(nftGacha[0]).toHaveProperty('id');
      expect(nftGacha[0]).toHaveProperty('amount');
    });
  });
});
