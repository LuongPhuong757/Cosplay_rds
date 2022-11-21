import 'reflect-metadata';
import { Result } from '@common/response/result.enum';
import { Gender } from '@modules/user-private/enum/gender';
import { UserFollow } from '@modules/user/user-follow.model';
import { User } from '@modules/user/user.model';
import { UserService } from '@modules/user/user.service';
import request from '@providers/request.provider';
import {
  fetchUser,
  deleteTestUserPrviate,
  deleteTestUser,
  fetchFirstTestUser,
  fetchSecondTestUser,
  noExistUserId,
  pagingOptions,
  generatePageOptionsInput,
} from '../../helper';
import { prisma } from '../../prisma-instance';
import {
  userRepository,
  stripeService,
  notificationService,
  sqsService,
  s3Provider,
  auth0Provider,
  generatorService,
  cotTipRepository,
} from '../../service-instance';

describe('UserService', () => {
  let userService: UserService;

  const setup = () => {
    const mockedFunctions = {
      mockThrow: jest.fn().mockImplementationOnce(() => {
        throw new Error('error');
      }),
      mockCancelCustomerSubscription: jest.fn().mockResolvedValue(true),
      mockDeleteFiles: jest.fn().mockResolvedValue(true),
      sendQueue: jest.fn().mockResolvedValue(null),
    };

    sqsService.sendQueue = mockedFunctions.sendQueue;

    return mockedFunctions;
  };

  const testFollowUser = async (firstUser: User, secondUser: User) => {
    await userService.createFollow(firstUser, { userId: secondUser.id });
  };

  const testUnFollowUser = async (firstUser: User, secondUser: User) => {
    await userService.deleteFollow(firstUser, { userId: secondUser.id });
  };

  beforeAll(() => {
    userService = new UserService(
      prisma,
      userRepository,
      notificationService,
      stripeService,
      sqsService,
      s3Provider,
      auth0Provider,
      generatorService,
      cotTipRepository,
    );

    stripeService.updateProduct = jest.fn().mockResolvedValue(true);
  });

  describe('users', () => {
    it('returns users that have correct property.', async () => {
      const users = await userService.users('user1_account');
      const user = users[0];

      expect(users.length).toBeGreaterThanOrEqual(1);
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('account');
      expect(user).toHaveProperty('icon');
    });

    it('with pagingOptions.', async () => {
      const pagingOptions = generatePageOptionsInput();
      const users = await userService.users('user1_account', pagingOptions);

      expect(users.length).toBeGreaterThanOrEqual(1);
    });

    it('where like.', async () => {
      const users = await userService.users('er1_');

      expect(users.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('user', () => {
    it('returns user that have correct property.', async () => {
      const { id } = await fetchFirstTestUser();
      const user = await userService.user(id);

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('account');
      expect(user).toHaveProperty('icon');
      expect(user).toHaveProperty('profile');
      expect(user).toHaveProperty('website');
      expect(user).toHaveProperty('currentUserIsMembership');
      expect(user).toHaveProperty('followedByCount');
      expect(user).toHaveProperty('followingCount');
      expect(user).toHaveProperty('totalMembershippedBy');
      expect(user).toHaveProperty('totalMemberships');
      expect(user).toHaveProperty('membershipId');
      expect(user).toHaveProperty('profileRanking');
      expect(user).toHaveProperty('publicAddress');
      expect(user).toHaveProperty('isUserTipNFTDistribute');
    });

    it('cannot return user is banned.', async () => {
      const { id } = (await prisma.user.findFirst({ where: { isBan: true } })) as User;

      await expect(userService.user(id)).rejects.toThrow();
    });
  });

  describe('createUserAfterRegistration', () => {
    it('create user with random name.', async () => {
      const createUserAfterRegistrationInput = {
        auth0Id: 'testId',
        name: 'testemail@example.com',
        email: 'testemail@example.com',
      };

      const res = await userService.createUserAfterRegistration(createUserAfterRegistrationInput);
      const created = await fetchUser({ where: { auth0Id: 'testId' } });

      expect(res.result).toBe(Result.ok);
      expect(created.name).not.toBe('testemail@example.com');

      await deleteTestUserPrviate(created.id);
      await deleteTestUser(created.id);
    });

    it('input does not have email.', async () => {
      const createUserAfterRegistrationInput = {
        auth0Id: 'testIdNoEmail',
        name: 'testNameNoEmail',
      };

      const res = await userService.createUserAfterRegistration(createUserAfterRegistrationInput);

      expect(res.result).toBe(Result.ok);

      const created = await fetchUser({ where: { auth0Id: 'testIdNoEmail' } });

      await deleteTestUserPrviate(created.id);
      await deleteTestUser(created.id);
    });

    it('migrate user from old account.', async () => {
      const email = 'migrateemail@gmail.com';
      const newAuth0Id = 'migratenewauth0Id';
      const migrateAccountInput = {
        account: 'migrateaccount',
        name: 'migratename',
        email,
        gender: Gender.MALE,
        birthday: new Date(),
      };
      await userService.migrateOldAccount(migrateAccountInput);

      const createUserAfterRegistrationInput = {
        auth0Id: newAuth0Id,
        name: 'testName',
        email,
      };
      const res = await userService.createUserAfterRegistration(createUserAfterRegistrationInput);

      expect(res.result).toBe(Result.ok);

      const migratedUser = await prisma.user.findFirst({ where: { userPrivate: { email } } });

      expect(migratedUser?.auth0Id).toBe(newAuth0Id);
    });

    it('throw error.', async () => {
      const { mockThrow } = setup();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const oldCreate = prisma.user.create;
      prisma.user.create = mockThrow;

      const createUserAfterRegistrationInput = {
        auth0Id: 'testId',
        name: 'testName',
        email: 'testemail@example.com',
      };

      const res = await userService.createUserAfterRegistration(createUserAfterRegistrationInput);

      expect(res.result).toBe(Result.ng);

      prisma.user.create = oldCreate;
    });
  });

  describe('getPublicAddress', () => {
    it('returns public address.', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'pub_email_auth0Id',
          name: 'pub_email_name',
          account: 'pub_email_account',
          icon: 'pub_email_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              publicAddress: 'testPublicAddress',
            },
          },
        },
      });
      const { publicAddress } = await userService.getPublicAddress(user.id);

      expect(publicAddress).toBe('testPublicAddress');
    });
  });

  describe('syncEmailVerified', () => {
    it('sync email.', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'sync_email_auth0Id',
          name: 'sync_email_name',
          account: 'sync_email_account',
          icon: 'sync_email_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      const input = {
        auth0Id: 'sync_email_auth0Id',
        email: 'sync_email1@example.com',
      };

      const res = await userService.syncEmailVerified(input);
      const updated = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        include: {
          userPrivate: true,
        },
      });

      expect(res.result).toBe(Result.ok);
      expect(updated?.userPrivate?.email).toBe('sync_email1@example.com');
    });

    it('sync email with no updated.', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'sync_email2_auth0Id',
          name: 'sync_email2_name',
          account: 'sync_email2_account',
          icon: 'sync_email2_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              email: 'sync_email2@example.com',
            },
          },
        },
      });
      const input = {
        auth0Id: 'sync_email2_auth0Id',
        email: 'sync_email_update@example.com',
      };

      const res = await userService.syncEmailVerified(input);
      const updated = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        include: {
          userPrivate: true,
        },
      });

      expect(res.result).toBe(Result.ok);
      expect(updated?.userPrivate?.email).toBe('sync_email2@example.com');
    });

    it('throw error.', async () => {
      const input = {
        auth0Id: 'sync_email_no_exist',
        email: 'sync_email1@example.com',
      };

      const res = await userService.syncEmailVerified(input);

      expect(res.result).toBe(Result.ng);
    });
  });

  describe('updateProfile', () => {
    it('update user profile.', async () => {
      setup();
      const user = await fetchFirstTestUser();
      const newGender = Gender.MALE;
      const newBirthday = new Date('2000-01-01');
      const updateProfileInput = {
        name: user.name,
        account: user.account,
        icon: 'new-icon.png',
        gender: newGender,
        birthday: newBirthday,
      };

      const updated = await userService.updateProfile(user, updateProfileInput);

      expect(updated.id).toBe(user.id);
      expect(updated.name).toBe(user.name);
      expect(updated.account).toBe(user.account);
      expect(updated.icon).toBe(`new-icon.png`);
      expect(updated?.userPrivate?.gender).toBe(newGender);
    });

    it('account lowercase.', async () => {
      const user = await fetchSecondTestUser();
      const updateProfileInput = {
        account: 'AAAAA',
      };

      const updated = await userService.updateProfile(user, updateProfileInput);

      expect(updated.account).toBe('aaaaa');
    });

    it('throw error.', async () => {
      const { mockThrow } = setup();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const origUpdate = prisma.user.update;
      prisma.user.update = mockThrow;

      const user = await fetchFirstTestUser();
      const updateProfileInput = {
        name: user.name,
        account: user.account,
        email: 'hello@cosplay.com',
      };

      await expect(userService.updateProfile(user, updateProfileInput)).rejects.toThrow();

      prisma.user.update = origUpdate;
    });
  });

  describe('updateEmail', () => {
    it('update email', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'update_email_auth0Id',
          name: 'update_email_name',
          account: 'update_email_account',
          icon: 'update_email_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      const result = await userService.updateEmail(user, {
        email: 'new-email@example.com',
        lang: 'en',
      });

      expect(result.result).toBe(Result.ok);
    });

    it('cannot change email when user has already public address', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'update_email2_auth0Id',
          name: 'update_email2_name',
          account: 'update_email2_account',
          icon: 'update_email2_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              email: 'update_email2@gmail.com',
              publicAddress: 'update_email2_public_address',
            },
          },
        },
        include: {
          userPrivate: true,
        },
      });

      const result = await userService.updateEmail(user, {
        email: 'new-email@example.com',
        lang: 'en',
      });

      expect(result.result).toBe(Result.ng);
      expect(result.message).toBe('email cannot change. you already have public address');
    });
  });

  describe('verifyEmail', () => {
    it('update verifytoken', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'update_verify_auth0Id',
          name: 'update_verify_name',
          account: 'update_verify_account',
          icon: 'update_verify_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              emailVerifyToken: 'update_verify_token',
            },
          },
        },
        include: {
          userPrivate: true,
        },
      });

      const emailVerifyToken = user?.userPrivate?.emailVerifyToken || 'update_verify_token';
      const newEmail = 'newemail@example.com';
      const token = generatorService.generateToken(
        { emailVerifyToken, newEmail },
        { expiresIn: '1h' },
      );
      const result = await userService.verifyEmail({
        token,
      });
      const updateEmailUser = await prisma.user.findFirst({
        where: {
          auth0Id: 'update_verify_auth0Id',
        },
        include: {
          userPrivate: true,
        },
      });

      expect(result.result).toBe(Result.ok);
      expect(updateEmailUser?.userPrivate?.email).toBe(newEmail);
    });

    it('cannot change email', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'update_verify2_auth0Id',
          name: 'update_verify2_name',
          account: 'update_verify2_account',
          icon: 'update_verify2_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              email: 'update_verify2@gmail.com',
              publicAddress: 'update_verify2_public_address',
              emailVerifyToken: 'update_verify2_token',
            },
          },
        },
        include: {
          userPrivate: true,
        },
      });
      const emailVerifyToken = user?.userPrivate?.emailVerifyToken || 'update_verify2_token';
      const newEmail = 'newemail@example.com';
      const token = generatorService.generateToken(
        { emailVerifyToken, newEmail },
        { expiresIn: '1h' },
      );
      const result = await userService.verifyEmail({
        token,
      });

      expect(result.result).toBe(Result.ng);
      expect(result.message).toBe('email cannot change');
    });
  });

  describe('createFollow', () => {
    it('follow the user.', async () => {
      const firstUser = await fetchFirstTestUser();
      const { id: secondUserId } = await fetchSecondTestUser();

      const result = await userService.createFollow({ ...firstUser }, { userId: secondUserId });

      expect(result).toBe(secondUserId);
    });

    it('following user does not exist.', async () => {
      const firstUser = await fetchFirstTestUser();

      await expect(
        userService.createFollow({ ...firstUser }, { userId: noExistUserId }),
      ).rejects.toThrow();
    });
  });

  describe('follows', () => {
    it('get following.', async () => {
      const { id } = await fetchFirstTestUser();
      const followingUser = await userService.follows(id);

      expect(followingUser.length).toBeGreaterThanOrEqual(1);
    });

    it('with pagingOptions.', async () => {
      const { id } = await fetchFirstTestUser();
      const followings = await userService.follows(id, pagingOptions);

      expect(followings.length).toBeGreaterThanOrEqual(1);
    });

    it('isFollowing false.', async () => {
      const { id } = await fetchFirstTestUser();
      const followings = await userService.follows(id, pagingOptions);

      expect(followings[0].isFollowing).toBe(false);
    });

    it('isFollowing true.', async () => {
      const firstUser = await fetchFirstTestUser();
      const secondUser = await fetchSecondTestUser();
      await testFollowUser(secondUser, firstUser);

      const followings = await userService.follows(firstUser.id, pagingOptions);

      expect(followings[0].isFollowing).toBe(true);

      await testUnFollowUser(secondUser, firstUser);
    });

    it('not exists.', async () => {
      await expect(userService.follows(noExistUserId)).rejects.toThrow();
    });
  });

  describe('followers', () => {
    it('get followedBy.', async () => {
      const { id } = await fetchSecondTestUser();
      const followers = await userService.followers(id);

      expect(followers.length).toBeGreaterThanOrEqual(1);
    });

    it('with pagingOptions.', async () => {
      const { id } = await fetchSecondTestUser();
      const followers = await userService.followers(id);

      expect(followers.length).toBeGreaterThanOrEqual(1);
    });

    it('isFollowing false.', async () => {
      const { id } = await fetchSecondTestUser();
      const followers = await userService.followers(id);

      expect(followers[0].isFollowing).toBe(false);
    });

    it('isFollowing true.', async () => {
      const firstUser = await fetchFirstTestUser();
      const secondUser = await fetchSecondTestUser();
      await testFollowUser(secondUser, firstUser);

      const followers = await userService.followers(secondUser.id);

      expect(followers[0].isFollowing).toBe(true);

      await testUnFollowUser(secondUser, firstUser);
    });

    it('not exists.', async () => {
      await expect(userService.followers(noExistUserId)).rejects.toThrow();
    });
  });

  describe('deleteFollow', () => {
    it('unfollow the user.', async () => {
      const firstUser = await fetchFirstTestUser();
      const { id: secondUserId } = await fetchSecondTestUser();

      const deleted = await userService.deleteFollow({ ...firstUser }, { userId: secondUserId });

      expect(deleted).toBe(secondUserId);

      const followingUser = await userService.follows(firstUser.id);

      expect(followingUser).toHaveLength(0);
    });

    it('following user does not exist.', async () => {
      const firstUser = await fetchFirstTestUser();
      const res = await userService.deleteFollow({ ...firstUser }, { userId: noExistUserId });

      expect(res).toBe(noExistUserId);
    });
  });

  describe('createBlock', () => {
    it('block the user.', async () => {
      const firstUser = await fetchFirstTestUser();
      const { id: secondUserId } = await fetchSecondTestUser();

      const blockUserId = await userService.createBlock({ ...firstUser }, { userId: secondUserId });

      expect(blockUserId).toBe(secondUserId);
    });
  });

  describe('blocks', () => {
    it('block users.', async () => {
      const firstUser = await fetchFirstTestUser();
      const blocks = await userService.blocks({ ...firstUser });

      expect(blocks).toHaveLength(1);
    });
  });

  describe('deleteBlock', () => {
    it('unblock the user.', async () => {
      const firstUser = await fetchFirstTestUser();
      const { id: secondUserId } = await fetchSecondTestUser();

      const blockUserId = await userService.deleteBlock({ ...firstUser }, { userId: secondUserId });

      expect(blockUserId).toBe(secondUserId);
    });
  });

  describe('getSupporters', () => {
    it('get supporters.', async () => {
      const user = await prisma.user.create({
        data: {
          account: 'su1-account',
          auth0Id: 'su1-auth0Id',
          name: 'su1-name',
        },
      });
      const firstSupporters = await prisma.user.create({
        data: {
          account: 'su1-1-account',
          auth0Id: 'su1-1-auth0Id',
          name: 'su1-1-name',
        },
      });
      const secondSupporters = await prisma.user.create({
        data: {
          account: 'su1-2-account',
          auth0Id: 'su1-2-auth0Id',
          name: 'su1-2-name',
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: user.id,
          score: 1000,
          senderId: firstSupporters.id,
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: user.id,
          score: 2000,
          senderId: firstSupporters.id,
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: user.id,
          score: 2500,
          senderId: secondSupporters.id,
        },
      });

      const result = await userService.getSupporters(user.id);
      const res1 = result[0] as UserFollow & { totalScore: number };
      const res2 = result[1] as UserFollow & { totalScore: number };

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(res1.totalScore > res2.totalScore).toBe(true);
    });

    it('paging options.', async () => {
      const user = (await prisma.user.findFirst({
        where: {
          account: 'su1-account',
        },
      })) as User;
      const result = await userService.getSupporters(user.id, { limit: 1 });

      expect(result.length).toBe(1);
    });
  });

  describe('register public address', () => {
    it('register public address.', async () => {
      const user = await fetchFirstTestUser();
      const newAddress = '0x....';

      const registered = await userService.registerPublicAddress(user, newAddress);

      expect(registered?.userPrivate?.publicAddress).toBe(newAddress);
    });

    it('throw error.', async () => {
      const { mockThrow } = setup();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const origUpdate = prisma.user.update;
      prisma.user.update = mockThrow;

      const user = await fetchFirstTestUser();
      const newAddress = '0x....';

      await expect(userService.registerPublicAddress(user, newAddress)).rejects.toThrow();

      prisma.user.update = origUpdate;
    });
  });

  describe('updateMySetting', () => {
    it('update my setting', async () => {
      const firstUser = await fetchFirstTestUser();

      const updated = await userService.updateMySetting(firstUser, {
        fav: 1,
      });

      const setting = updated.setting as { [key: string]: number };

      expect(setting.fav).toBe(1);
    });

    it('no user', async () => {
      const firstUser = await fetchFirstTestUser();
      firstUser.id = 10000;

      await expect(
        userService.updateMySetting(firstUser, {
          fav: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe('mySetting', () => {
    it('get my setting', async () => {
      const firstUser = await fetchFirstTestUser();
      const mySetting = await userService.mySetting(firstUser);
      const setting = mySetting.setting as { [key: string]: number };

      expect(setting.fav).toBe(1);
    });

    it('no user', async () => {
      const firstUser = await fetchFirstTestUser();
      firstUser.id = 10000;

      await expect(userService.mySetting(firstUser)).rejects.toThrow();
    });
  });

  describe('delete account', () => {
    it('return ok.', async () => {
      const { mockCancelCustomerSubscription, mockDeleteFiles } = setup();
      stripeService.cancelCustomerSubscription = mockCancelCustomerSubscription;
      s3Provider.deleteFiles = mockDeleteFiles;

      const newUser = await prisma.user.create({
        data: {
          auth0Id: 'delete1_auth0Id',
          name: 'delete1_name',
          account: 'delete1_account',
          icon: 'delete1_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      const subUser1 = await prisma.user.create({
        data: {
          auth0Id: 'delete2_auth0Id',
          name: 'delete2_name',
          account: 'delete2_account',
          icon: 'delete2_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      const price = await prisma.price.create({
        data: {
          amount: 100,
          currency: 'jpy',
          jpy: 100,
        },
      });
      const membership = await prisma.membership.create({
        data: {
          userId: subUser1.id,
          priceId: price.id,
          stripePriceId: 'xxx',
          stripeProductId: 'yyy',
        },
      });
      await prisma.subscription.create({
        data: {
          sellerId: subUser1.id,
          buyerId: newUser.id,
          status: 'ACTIVE',
          stripeSubscriptionKey: 'zzz',
          membershipId: membership.id,
        },
      });
      await prisma.post.create({
        data: {
          userId: newUser.id,
          caption: 'delete1_caption',
          photos: {
            create: {
              image: 'test.png',
            },
          },
        },
      });

      const result = await userService.deleteAccount(newUser);

      expect(result.result).toBe(Result.ok);
      expect(mockCancelCustomerSubscription).toBeCalledWith('zzz');
      expect(mockDeleteFiles).toBeCalledWith([
        'test.png',
        'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3.png', // hashed filename
        'delete1_icon',
      ]);
    });

    it('return ng.', async () => {
      const firstUser = await fetchFirstTestUser();
      request.client.post = jest.fn().mockImplementationOnce(() => {
        throw new Error('error');
      });
      const result = await userService.deleteAccount({ ...firstUser, auth0Id: 'no_exist' });

      expect(result.result).toBe(Result.ng);
    });
  });

  describe('getNftDistributedUsers', () => {
    it('returns nft distributed users', async () => {
      await prisma.user.create({
        data: {
          auth0Id: 'user_nft1_auth0Id',
          name: 'user_nft1_name',
          account: 'user_nft1_account',
          icon: 'user_nft1_icon',
          isBan: false,
          isCosplayer: false,
          cOTTipNFTDistributionState: {
            create: {
              targetERC721: 'user_nft1_erc',
              lowerCOT: '1',
            },
          },
        },
      });
      const nftDistributedUsers = await userService.getNftDistributedUsers();

      expect(nftDistributedUsers.length).toBeGreaterThanOrEqual(1);
      expect(nftDistributedUsers[0]?.cOTTipNFTDistributionState).not.toBeNull();
    });
  });

  describe('migrateOldAccount', () => {
    it('create new account that has world cosplay info.', async () => {
      const input = {
        account: 'oldaccount',
        name: 'newName',
        email: 'newemail@gmail.com',
        gender: Gender.MALE,
        birthday: new Date(),
        profile: 'some profile',
      };
      const res = await userService.migrateOldAccount(input);

      expect(res.result).toBe(Result.ok);
    });

    it('already created the migrate account.', async () => {
      const input = {
        account: 'oldaccount',
        name: 'newName',
        email: 'newemail@gmail.com',
        gender: Gender.MALE,
        birthday: new Date(),
      };
      const res = await userService.migrateOldAccount(input);

      expect(res.result).toBe(Result.ng);
      expect(res.message).toBe(
        'Your account has already registered. Login in your account on curecos.',
      );
    });

    it('generate random account when same account is taken.', async () => {
      const { account } = (await prisma.user.findFirst()) as User;
      const input = {
        account,
        name: 'newName',
        email: 'generate_account@gmail.com',
        gender: Gender.MALE,
        birthday: new Date(),
      };
      const res = await userService.migrateOldAccount(input);

      const migrated = (await prisma.user.findFirst({
        where: { userPrivate: { email: 'generate_account@gmail.com' } },
      })) as User;

      expect(res.result).toBe(Result.ok);
      expect(migrated.account).not.toBe(account);
    });
  });
});
