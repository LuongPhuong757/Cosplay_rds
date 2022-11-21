import 'reflect-metadata';
import dayjs from 'dayjs';
import { NFTCampaign } from '../../../src/modules/nft-campaign/nft-campaign.model';
import { NFTPrivilegeOnUsersRepository } from '../../../src/modules/nft-privilege-on-user/nft-privilege-on-user.repository';
import { NFTPrivilegeOnUsersService } from '../../../src/modules/nft-privilege-on-user/nft-privilege-on-user.service';
import { NFTPrivilege } from '../../../src/modules/nft-privilege/nft-privilege.model';
import { NFTPrivilegeRepository } from '../../../src/modules/nft-privilege/nft-privilege.repository';
import { NFTPrivilegeService } from '../../../src/modules/nft-privilege/nft-privilege.service';
import { NFT } from '../../../src/modules/nft/nft.model';
import { UserHasNftService } from '../../../src/modules/user-has-nft/user-has-nft.service';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';
import { userHasNftRepository, sqsService, generatorService } from '../../service-instance';

describe('NFTPrivilegeOnUserService', () => {
  const nFTPrivilegeOnUsersRepository = new NFTPrivilegeOnUsersRepository(prisma);
  const nFTPrivilegeOnUsersService = new NFTPrivilegeOnUsersService(nFTPrivilegeOnUsersRepository);
  const nFTPrivilegeRepository = new NFTPrivilegeRepository(prisma);
  const userHasNftService = new UserHasNftService(
    userHasNftRepository,
    sqsService,
    generatorService,
  );
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
  let newCampaign: NFTCampaign;
  let newPrivilege: NFTPrivilege;

  beforeAll(async () => {
    issuerUser = ((await prisma.user.findMany()) as User[])[0];
    hasUser = ((await prisma.user.findMany()) as User[])[1];

    newCampaign = await prisma.nFTCampaign.create({
      data: {
        title: 'nft_campaign_title_privilege_on_user',
        description: 'nft_campaign_description_privilege_on_user',
        userId: issuerUser.id,
        start: new Date(new Date().setDate(new Date().getDate() - 1)),
        end: new Date(new Date().setDate(new Date().getDate() + 1)),
        contract: '0xAAA',
        emissionRateTable: { rarity1: 60, rarity2: 20, rarity3: 10, rarity4: 8, rarity5: 2 },
      },
    });

    newNft = await prisma.nFT.create({
      data: {
        address: 'privilege-on-01-address',
        tokenID: '1000',
        totalSupply: 1000,
        name: 'testNftNameOnUsers',
        description: 'testNftDescriptionOnUsers',
        image: 'testNftImageOnUsers',
        rarity: 1,
        campaignId: newCampaign.id,
      },
    });

    await prisma.userHasNFT.create({
      data: {
        nftId: newNft.id,
        amount: 10,
        shipped: 10,
        userId: hasUser.id,
      },
    });

    newPrivilege = await prisma.nFTPrivilege.create({
      data: {
        title: 'nft_privilege_title_on_user',
        description: 'nft_privilege_title_on_user',
        emailBody: 'nft_privilege_title_on_user',
        limitExecutionTimes: 10,
        expired: dayjs().add(1, 'day').toDate(),
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

    hasUser = await prisma.user.update({
      where: {
        id: hasUser.id,
      },
      data: {
        userPrivate: {
          upsert: {
            create: {
              email: 'nftPrivilegeHasUserOnUsers@example.com',
            },
            update: {
              email: 'nftPrivilegeHasUserOnUsers@example.com',
            },
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
  });

  describe('getNftPrivilegesExecutedUsers', () => {
    it('returns nft privileges executed user', async () => {
      await nFTPrivilegeService.executePrivilege(hasUser, {
        nftPrivilegeId: newPrivilege.id,
      });

      const results = await nFTPrivilegeOnUsersService.getNftPrivilegesExecutedUsers(
        newPrivilege?.id,
      );

      results.map((result) => {
        expect(result).toHaveProperty('executionTimes');
        expect(result).toHaveProperty('nftPrivilegeId');
        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('userId');
      });
    });
  });
});
