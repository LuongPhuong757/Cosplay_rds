import 'reflect-metadata';
import dayjs from 'dayjs';
import { Result } from '../../../src/common/response/result.enum';
import { NFTCampaign } from '../../../src/modules/nft-campaign/nft-campaign.model';
import { NFTPrivilegeOnUsersRepository } from '../../../src/modules/nft-privilege-on-user/nft-privilege-on-user.repository';
import { NFTPrivilege } from '../../../src/modules/nft-privilege/nft-privilege.model';
import { NFTPrivilegeRepository } from '../../../src/modules/nft-privilege/nft-privilege.repository';
import { NFTPrivilegeService } from '../../../src/modules/nft-privilege/nft-privilege.service';
import { NFT } from '../../../src/modules/nft/nft.model';
import { UserHasNFT } from '../../../src/modules/user-has-nft/user-has-nft.model';
import { UserHasNftService } from '../../../src/modules/user-has-nft/user-has-nft.service';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';
import { userHasNftRepository, sqsService, generatorService } from '../../service-instance';

describe('NFTPrivilegeService', () => {
  const nFTPrivilegeRepository = new NFTPrivilegeRepository(prisma);
  const userHasNftService = new UserHasNftService(
    userHasNftRepository,
    sqsService,
    generatorService,
  );
  const nFTPrivilegeOnUsersRepository = new NFTPrivilegeOnUsersRepository(prisma);
  const nFTPrivilegeService = new NFTPrivilegeService(
    nFTPrivilegeRepository,
    nFTPrivilegeOnUsersRepository,
    userHasNftService,
    userHasNftRepository,
    sqsService,
    generatorService,
  );
  let issuerUser: User;
  let hasUser: User;
  let newNft: NFT;
  let newUserHasNft: UserHasNFT;
  let newCampaign: NFTCampaign;
  let newPrivilege: NFTPrivilege;
  let newNftPrivilege: NFTPrivilege;
  let secondNewNft: NFT;
  let secondUserHasNft: UserHasNFT;

  const setup = () => {
    const mockedFunctions = {
      sendQueue: jest.fn().mockResolvedValue(null),
    };

    sqsService.sendQueue = mockedFunctions.sendQueue;

    return mockedFunctions;
  };

  beforeAll(async () => {
    issuerUser = ((await prisma.user.findMany()) as User[])[0];
    hasUser = ((await prisma.user.findMany()) as User[])[1];

    newCampaign = await prisma.nFTCampaign.create({
      data: {
        title: 'nft_campaign_title_privilege',
        description: 'nft_campaign_description_privilege',
        userId: issuerUser.id,
        start: new Date(new Date().setDate(new Date().getDate() - 1)),
        end: new Date(new Date().setDate(new Date().getDate() + 1)),
        contract: '0xAAA',
        emissionRateTable: { rarity1: 60, rarity2: 20, rarity3: 10, rarity4: 8, rarity5: 2 },
      },
    });

    newNft = await prisma.nFT.create({
      data: {
        address: 'privilege-nft-address',
        tokenID: '1000',
        totalSupply: 1000,
        name: 'testNftName',
        description: 'testNftDescription',
        image: 'testNftImage',
        rarity: 1,
        campaignId: newCampaign.id,
      },
    });

    newUserHasNft = await prisma.userHasNFT.create({
      data: {
        nftId: newNft.id,
        amount: 10,
        shipped: 10,
        userId: hasUser.id,
      },
    });

    newPrivilege = await prisma.nFTPrivilege.create({
      data: {
        title: 'nft_privilege_title',
        description: 'nft_privilege_title',
        emailBody: 'nft_privilege_title',
        limitExecutionTimes: 3,
        expired: new Date(new Date().setDate(new Date().getDate() + 1)),
        nftCampaignId: newCampaign.id,
      },
    });

    await prisma.nFTPrivilegeOnNFTs.create({
      data: {
        nftId: newNft.id,
        nftPrivilegeId: newPrivilege.id,
        required: 10,
      },
    });
  });

  describe('getNftPrivileges', () => {
    it('throw invalid nftCampaignId', async () => {
      await expect(nFTPrivilegeService.getNftPrivilegesByCampaignId(1000, hasUser)).rejects.toThrow(
        'nft campaign has no privilege',
      );
    });

    it('returns nft privileges that have amount and shipped', async () => {
      const result = await nFTPrivilegeService.getNftPrivilegesByCampaignId(
        newCampaign.id,
        hasUser,
      );

      result.map((privilege) => {
        expect(privilege).toHaveProperty('id');
        expect(privilege).toHaveProperty('title');
        expect(privilege).toHaveProperty('description');
        expect(privilege).toHaveProperty('expired');
        expect(privilege).toHaveProperty('limitExecutionTimes');
        expect(privilege).toHaveProperty('emailBody');
        expect(privilege).toHaveProperty('nftCampaign');

        const nftPrivilegeOnNFT = privilege?.nfts?.find((nft) => nft.nftId === newUserHasNft.nftId);

        expect(nftPrivilegeOnNFT).toHaveProperty('required');
        expect((nftPrivilegeOnNFT?.nft as NFT & { amount: number })?.amount).toBe(
          newUserHasNft.amount,
        );
        expect((nftPrivilegeOnNFT?.nft as NFT & { shipped: number })?.shipped).toBe(
          newUserHasNft.shipped,
        );
        privilege?.nftPrivilegeOnUsers?.map((nftPrivilegeUser) => {
          expect(nftPrivilegeUser.userId).toBe(hasUser.id);
        });
      });
    });

    it('returns nft privileges that have no amount and shipped when user is not authroized', async () => {
      const result = await nFTPrivilegeService.getNftPrivilegesByCampaignId(newCampaign.id);

      result.map((privilege) => {
        const nftPrivilegeOnNFT = privilege?.nfts?.find((nft) => nft.nftId === newUserHasNft.nftId);

        expect(nftPrivilegeOnNFT).toHaveProperty('required');
        expect((nftPrivilegeOnNFT?.nft as NFT & { amount: number })?.amount).toBe(0);
        expect((nftPrivilegeOnNFT?.nft as NFT & { shipped: number })?.shipped).toBe(0);
        expect(privilege.nftPrivilegeOnUsers).toBe(undefined);
      });
    });
  });

  describe('getNftPrivilegesByNftId', () => {
    it('throw invalid nftId', async () => {
      const result = await nFTPrivilegeService.getNftPrivilegesByNftId(1000, hasUser);
      expect(result).toHaveLength(0);
    });

    it('returns nft privilege that has amount and shipped', async () => {
      const result = await nFTPrivilegeService.getNftPrivilegesByNftId(newNft.id, hasUser);

      result.map((privilege) => {
        expect(privilege).toHaveProperty('id');
        expect(privilege).toHaveProperty('title');
        expect(privilege).toHaveProperty('description');
        expect(privilege).toHaveProperty('expired');
        expect(privilege).toHaveProperty('limitExecutionTimes');
        expect(privilege).toHaveProperty('emailBody');
        expect(privilege).toHaveProperty('nftCampaign');

        const nftPrivilegeOnNFT = privilege?.nfts?.find((nft) => nft.nftId === newUserHasNft.nftId);

        expect(nftPrivilegeOnNFT).toHaveProperty('required');
        expect((nftPrivilegeOnNFT?.nft as NFT & { amount: number })?.amount).toBe(
          newUserHasNft.amount,
        );
        expect((nftPrivilegeOnNFT?.nft as NFT & { shipped: number })?.shipped).toBe(
          newUserHasNft.shipped,
        );
        privilege?.nftPrivilegeOnUsers?.map((nftPrivilegeUser) => {
          expect(nftPrivilegeUser.userId).toBe(hasUser.id);
        });
      });
    });

    it('returns nft privilege that have no amount and shipped when user is not authroized', async () => {
      const result = await nFTPrivilegeService.getNftPrivilegesByNftId(newNft.id);

      result.map((privilege) => {
        const nftPrivilegeOnNFT = privilege?.nfts?.find((nft) => nft.nftId === newUserHasNft.nftId);

        expect(nftPrivilegeOnNFT).toHaveProperty('required');
        expect((nftPrivilegeOnNFT?.nft as NFT & { amount: number })?.amount).toBe(0);
        expect((nftPrivilegeOnNFT?.nft as NFT & { shipped: number })?.shipped).toBe(0);
        expect(privilege.nftPrivilegeOnUsers).toBe(undefined);
      });
    });
  });

  describe('getNftPrivilege', () => {
    it('throw invalid nftPrivilegeId', async () => {
      await expect(nFTPrivilegeService.getNftPrivilege(1000, hasUser)).rejects.toThrow(
        'NFT privilege was not found',
      );
    });

    it('returns nft privilege that has amount and shipped', async () => {
      const result = await nFTPrivilegeService.getNftPrivilege(newPrivilege.id, hasUser);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('expired');
      expect(result).toHaveProperty('limitExecutionTimes');
      expect(result).toHaveProperty('emailBody');
      expect(result).toHaveProperty('nftCampaign');

      const nftPrivilegeOnNFT = result?.nfts?.find((nft) => nft.nftId === newUserHasNft.nftId);

      expect(nftPrivilegeOnNFT).toHaveProperty('required');
      expect((nftPrivilegeOnNFT?.nft as NFT & { amount: number })?.amount).toBe(
        newUserHasNft.amount,
      );
      expect((nftPrivilegeOnNFT?.nft as NFT & { shipped: number })?.shipped).toBe(
        newUserHasNft.shipped,
      );
      result?.nftPrivilegeOnUsers?.map((nftPrivilegeUser) => {
        expect(nftPrivilegeUser.userId).toBe(hasUser.id);
      });
    });

    it('returns nft privilege that have no amount and shipped when user is not authroized', async () => {
      const result = await nFTPrivilegeService.getNftPrivilege(newPrivilege.id);

      const nftPrivilegeOnNFT = result?.nfts?.find((nft) => nft.nftId === newUserHasNft.nftId);

      expect(nftPrivilegeOnNFT).toHaveProperty('required');
      expect((nftPrivilegeOnNFT?.nft as NFT & { amount: number })?.amount).toBe(0);
      expect((nftPrivilegeOnNFT?.nft as NFT & { shipped: number })?.shipped).toBe(0);
      expect(result.nftPrivilegeOnUsers).toBe(undefined);
    });
  });

  describe('executePrivilege', () => {
    beforeAll(async () => {
      secondNewNft = await prisma.nFT.create({
        data: {
          address: 'privilege-nft2-address',
          tokenID: '1000',
          totalSupply: 1000,
          name: 'testNftName',
          description: 'testNftDescription',
          image: 'testNftImage',
          rarity: 2,
          campaignId: newCampaign.id,
        },
      });

      newNftPrivilege = await prisma.nFTPrivilege.create({
        data: {
          title: 'nft_privilege_title_new',
          description: 'nft_privilege_title_new',
          emailBody: 'nft_privilege_title_new',
          limitExecutionTimes: 3,
          expired: dayjs().add(1, 'day').toDate(),
          nftCampaignId: newCampaign.id,
        },
      });

      await prisma.nFTPrivilegeOnNFTs.create({
        data: {
          nftId: newNft.id,
          nftPrivilegeId: newNftPrivilege.id,
          required: 5,
        },
      });

      await prisma.nFTPrivilegeOnNFTs.create({
        data: {
          nftId: secondNewNft.id,
          nftPrivilegeId: newNftPrivilege.id,
          required: 5,
        },
      });
    });

    it('throw invalid nftPrivilegeId', async () => {
      const res = await nFTPrivilegeService.executePrivilege(hasUser, { nftPrivilegeId: 1000 });

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe('not found nft privilege nftPrivilegeId: 1000');
    });

    it('throw invalid expired', async () => {
      await prisma.nFTPrivilege.update({
        where: {
          id: newNftPrivilege.id,
        },
        data: {
          expired: dayjs().subtract(1, 'days').toDate(),
        },
      });

      const res = await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe('this ntf privilege already exipred');

      await prisma.nFTPrivilege.update({
        where: {
          id: newNftPrivilege.id,
        },
        data: {
          expired: dayjs().add(1, 'days').toDate(),
        },
      });
    });

    it('throw invalid email', async () => {
      const res = await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe('you must set email before getting executing nft privilege');
    });

    it('throw userHasNft size', async () => {
      hasUser = await prisma.user.update({
        where: {
          id: hasUser.id,
        },
        data: {
          userPrivate: {
            upsert: {
              create: {
                email: 'nftPrivilegeHasUser@example.com',
              },
              update: {
                email: 'nftPrivilegeHasUser@example.com',
              },
            },
          },
        },
        include: {
          userPrivate: true,
        },
      });

      const res = await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe('collect all the NFTs you need to execute privilege');
    });

    it('throw not enough nfts', async () => {
      secondUserHasNft = await prisma.userHasNFT.create({
        data: {
          nftId: secondNewNft.id,
          amount: 1,
          shipped: 10,
          userId: hasUser.id,
        },
      });

      const res = await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe('you dont have enough nft amount');
    });

    it('throw execution time limit', async () => {
      await prisma.userHasNFT.update({
        where: {
          id: secondUserHasNft.id,
        },
        data: {
          amount: 10,
        },
      });
      await prisma.nFTPrivilege.update({
        where: {
          id: newNftPrivilege.id,
        },
        data: {
          limitExecutionTimes: 0,
        },
      });

      const res = await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe('execution times is already reach limit');

      await prisma.nFTPrivilege.update({
        where: {
          id: newNftPrivilege.id,
        },
        data: {
          limitExecutionTimes: 10,
        },
      });
    });

    it('ok', async () => {
      const { sendQueue } = setup();
      const res = await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });
      const userHasNftResult = await prisma.userHasNFT.findMany({
        where: {
          userId: hasUser.id,
        },
      });

      expect(res.result).toBe(Result.ok);
      userHasNftResult.map((result) => {
        expect(result.amount).toBe(10 - 5); // 使用した分
      });
      expect(sendQueue).toBeCalled();
    });
  });

  describe('getExecutedNftPrivilegesByUserId', () => {
    beforeAll(async () => {
      setup();
      await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newNftPrivilege.id,
      });
    });

    it('returns executed nft privilege', async () => {
      const executedNftPrivileges = await nFTPrivilegeService.getExecutedNftPrivilegesByUserId(
        hasUser.id,
      );

      executedNftPrivileges.map((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('expired');
        expect(result).toHaveProperty('limitExecutionTimes');
        expect(result.nftCampaign).toHaveProperty('user');

        result?.nftPrivilegeOnUsers?.map((nest) => {
          expect(nest).toHaveProperty('executionTimes');
        });
      });
    });
  });

  describe('getUserIssueNftPrivileges', () => {
    it('returns user issue nft privilege', async () => {
      const userIssueNftPrivileges = await nFTPrivilegeService.getUserIssueNftPrivileges(
        issuerUser.id,
      );

      userIssueNftPrivileges.map((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('expired');
        expect(result).toHaveProperty('limitExecutionTimes');

        result?.nftPrivilegeOnUsers?.map((nest) => {
          expect(nest).toHaveProperty('executionTimes');
        });
      });
    });
  });

  describe('getExcecutableNftPrivilege', () => {
    it('returns no executable nft privilege', async () => {
      const executableNftPrivilege = await nFTPrivilegeService.getExcecutableNftPrivilege(
        hasUser,
        hasUser.id,
      );

      const result = executableNftPrivilege.some((e) => e.isExecutable);
      expect(result).toBe(false);
    });

    it('returns executable nft privilege', async () => {
      await prisma.userHasNFT.update({
        where: {
          id: secondUserHasNft.id,
        },
        data: {
          amount: 30,
        },
      });
      await prisma.userHasNFT.update({
        where: {
          id: newUserHasNft.id,
        },
        data: {
          amount: 30,
        },
      });
      const executableNftPrivilege = await nFTPrivilegeService.getExcecutableNftPrivilege(
        hasUser,
        hasUser.id,
      );

      const result = executableNftPrivilege.some((e) => e.isExecutable);
      expect(result).toBe(true);
    });
  });
});
