import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { extractIds } from '@common/util/extract-ids';
import config from '@config';
import { DecodeEmailVerifyToken, WebhookEvent } from '@interfaces';
import { COTTipRepository } from '@modules/cot-tip/cot-tip.repository';
import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { InfoType } from '@modules/notification/enum/info-type';
import { NotificationService } from '@modules/notification/notification.service';
import { UserPrivate } from '@modules/user-private/user-private.model';
import { SUBSCRIPTION_STATUS } from '@prisma/client';
import { Auth0Provider } from '@providers/auth0.provider';
import { SqsSendEvent } from '@providers/enum/sqs-send-event';
import { S3Provider } from '@providers/s3.provider';
import { SqsService } from '@providers/sqs.provider';
import { StripeService } from '@providers/stripe.provider';
import { GeneratorService } from '@services/generator.service';
import { PrismaService } from '@services/prisma.service';
import { ForbiddenError } from 'apollo-server-express';
import { Service } from 'typedi';
import { CreateUserAfterRegistrationInput } from './dto/input/create-user-after-registration';
import { MigrateOldAccountInput } from './dto/input/migrate-old-account';
import { SocialActionInput } from './dto/input/social-action';
import { SyncEmailVerifiedInput } from './dto/input/sync-email-verified';
import { UpdateEmailInput } from './dto/input/update-email';
import { UpdateMySettingInput } from './dto/input/update-my-setting';
import { UpdateProfileInput } from './dto/input/update-profile';
import { VerifyEmailInput } from './dto/input/verify-email';
import { GetPublicAddressResponse } from './dto/response/get-public-address';
import { MigrateOldAccountResponse } from './dto/response/migrate-old-account';
import { UserFollow } from './user-follow.model';
import { User, UserNewCosplayer } from './user.model';
import { UserRepository } from './user.repository';

const MAX_LIMIT_SUPPORTERS = 10;
const MIGRATE_AUTH0_ID = 'migrateAuth0';
const EMAIL_VERIFY_EXPIRE_TIME = '1h';

const { sqsImageCompressionQueueUrl, sqsWebhookStripeQueueUrl } = config.aws;
const { photoDomain } = config.file;

@Service()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
    private readonly stripeService: StripeService,
    private readonly sqsService: SqsService,
    private readonly s3Provider: S3Provider,
    private readonly auth0Provider: Auth0Provider,
    private readonly generatorService: GeneratorService,
    private readonly cotTipRepository: COTTipRepository,
  ) {}

  async users(query: string, pagingOptions?: PagingOptionsInput): Promise<User[]> {
    return await this.userRepository.findUsers(query, pagingOptions);
  }

  async usersIsCosplayer(pagingOptions?: PagingOptionsInput): Promise<User[]> {
    return await this.userRepository.findUsersIsCosplayer(pagingOptions);
  }

  private followingIds = async (userId: number): Promise<number[]> => {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!user) {
      throw Error(`cannot get followingIds. userId: ${userId}.`);
    }

    const following = user?.following || [];

    return following.map(extractIds);
  };

  async newUsers(
    pagingOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<UserNewCosplayer[]> {
    const user = await this.userRepository.findNewUsers(pagingOptions);
    let followIds: number[] | null = [];
    if (currentUser) {
      followIds = await this.followingIds(currentUser.id);
    }
    const userData = user.map((scoreLog) => {
      const { all, best, weekly } = scoreLog;
      const profileRanking = {
        all: all ?? 0,
        best: best ?? 0,
        weekly: weekly ?? 0,
      };
      let isFollowing = false;
      if (followIds) {
        isFollowing = followIds.includes(scoreLog.id);
      }
      scoreLog.icon = scoreLog.icon ? photoDomain + scoreLog.icon : null;

      return {
        ...scoreLog,
        profileRanking,
        totalFollowing: scoreLog.totalFollowing,
        totalFollowedBy: scoreLog.totalFollowedBy,
        totalPosts: scoreLog.totalPosts,
        isFollowing,
      };
    });

    return userData;
  }

  async createUserAfterRegistration(
    input: CreateUserAfterRegistrationInput,
  ): Promise<ResultResponse> {
    const { email, auth0Id } = input;
    const account = await this.generateUniqueAccount();
    try {
      if (email) {
        const migrateOldAccountId = await this.getMigrateOldAccountId(email);
        if (migrateOldAccountId) {
          await this.prisma.user.update({
            where: {
              id: migrateOldAccountId,
            },
            data: {
              auth0Id,
            },
          });

          console.log(`migrated user from old world cosplay. id: ${migrateOldAccountId}.`);

          return {
            result: Result.ok,
          };
        }
      }

      const newUser = await this.userRepository.registerUser({ ...input, account });

      console.log(`created user is requested from auth0. id: ${newUser.id} name: ${newUser.name}`);

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `cannot create user is requested from auth0. message: ${message} auth0Id: ${auth0Id}.`,
      );

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async syncEmailVerified(input: SyncEmailVerifiedInput): Promise<ResultResponse> {
    console.log(`syncEmailVerified input ${JSON.stringify(input)}`);

    const { email, auth0Id } = input;
    try {
      const user = await this.userRepository.findOne({
        where: {
          auth0Id,
        },
        include: {
          userPrivate: true,
        },
      });
      if (!user) {
        throw new Error(`no user auth0Id ${auth0Id}`);
      }

      if (!user.userPrivate?.email) {
        await this.prisma.userPrivate.upsert({
          where: {
            userId: user.id,
          },
          create: {
            email,
            userId: user.id,
          },
          update: {
            email,
          },
        });

        console.log(`syncd email verified from auth0. auth0Id: ${auth0Id}`);
      }

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `cannot sync email verified from auth0. message: ${message} auth0Id: ${auth0Id}.`,
      );

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async applyVerifiedEmail(user: User): Promise<ResultResponse> {
    const { id, auth0Id } = user;
    try {
      const user = await this.userRepository.findOne({
        where: {
          id,
        },
        include: {
          userPrivate: true,
        },
      });
      if (!user) {
        throw new Error(`no user auth0Id ${id}`);
      }

      // メールアドレスが無い場合は、auth0を確認してメールを反映する
      if (!user.userPrivate?.email) {
        const accessToken = await this.auth0Provider.getOauthToken();
        const auth0User = await this.auth0Provider.getUser(accessToken, auth0Id);
        if (!auth0User.email_verified) {
          throw new Error('email is not verified');
        }
        const { email } = auth0User;

        await this.prisma.userPrivate.upsert({
          where: {
            userId: id,
          },
          create: {
            email,
            userId: id,
          },
          update: {
            email,
          },
        });

        console.log(`apply email verified from auth0. id: ${id}`);
      }

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `cannot apply verified email from auth0. message: ${message} auth0Id: ${auth0Id}.`,
      );

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async user(
    userId?: number,
    account?: string,
    currentUser?: User,
  ): Promise<
    User & {
      currentUserIsMembership: boolean;
      profileRanking: { [key: string]: number | null };
      postCount: number;
      followingCount: number;
      followedByCount: number;
      totalMemberships: number;
      totalMembershippedBy: number;
      supporters: User[];
      nftCampaign?: NFTCampaign | null;
      isUserTipNFTDistribute: boolean;
    }
  > {
    const user = await this.userRepository.findUser(userId, account);
    const supporters = await this.userRepository.fetchSupporters(user.id, {
      limit: MAX_LIMIT_SUPPORTERS,
    });

    const currentUserIsMembership = await this.getIsCurrentUserIsMembership(user.id, currentUser);
    const { all, weekly, best, ...rest } = user;
    const profileRanking = {
      all,
      weekly,
      best,
    };

    return {
      ...rest,
      profileRanking,
      currentUserIsMembership,
      supporters,
      isUserTipNFTDistribute: !!user.cOTTipNFTDistributionState,
    };
  }

  async myPrivate(userId: number): Promise<User> {
    return await this.userRepository.findMyPrivate(userId);
  }

  async getPublicAddress(userId: number): Promise<GetPublicAddressResponse> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      include: {
        userPrivate: {
          select: {
            publicAddress: true,
          },
        },
      },
    });

    return {
      publicAddress: user?.userPrivate?.publicAddress,
    };
  }

  async updateProfile(currentUser: User, updateProfileInput: UpdateProfileInput): Promise<User> {
    const { id, account: currentAccount, icon: currentIcon } = currentUser;
    if (updateProfileInput.account) {
      updateProfileInput.account = updateProfileInput.account.toLowerCase();
    }
    try {
      const updatedUser = await this.userRepository.updateProfile(currentUser, updateProfileInput);
      if (!updatedUser) {
        throw Error(`user does not exist. userId: ${id}.`);
      }

      const { account: newAccount, icon: newIcon } = updateProfileInput;

      const { membership } = updatedUser;
      if (membership && newAccount && newAccount !== currentAccount) {
        await this.stripeService.updateProduct(membership.stripeProductId, newAccount);
      }

      if (newIcon && newIcon !== currentIcon) {
        const params = SqsService.generateMessageAttribute(SqsSendEvent.userIcon, newIcon);

        await this.sqsService.sendQueue({
          MessageAttributes: params,
          MessageBody: `user icon compression. icon ${newIcon} userId: ${id}.`,
          QueueUrl: sqsImageCompressionQueueUrl,
        });
      }

      return updatedUser;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`my profile cannot be updated. message: ${message} userId: ${id}.`);
    }
  }

  async updateEmail(
    currentUser: User,
    { email: newEmail, lang }: UpdateEmailInput,
  ): Promise<ResultResponse> {
    try {
      if (currentUser.userPrivate?.publicAddress) {
        throw new Error('email cannot change. you already have public address');
      }

      const emailVerifyToken = this.generatorService.getRandomString(20);
      await this.prisma.userPrivate.upsert({
        where: {
          userId: currentUser.id,
        },
        create: {
          emailVerifyToken,
          userId: currentUser.id,
        },
        update: {
          emailVerifyToken,
        },
      });

      const token = this.generatorService.generateToken(
        { newEmail, emailVerifyToken },
        {
          expiresIn: EMAIL_VERIFY_EXPIRE_TIME,
        },
      );
      const emailVerifyLink = this.generatorService.generateEmailVerifyLink(token);
      const payload = JSON.stringify({ emailVerifyLink, email: newEmail, lang });
      const uuid = this.generatorService.getRandomString(10);
      const params = SqsService.generatePayloadMessageAttribute(WebhookEvent.updateEmail, payload);

      await this.sqsService.sendQueue({
        MessageAttributes: params,
        MessageBody: `update user email. userId: ${currentUser.id}.`,
        QueueUrl: sqsWebhookStripeQueueUrl,
        MessageGroupId: `update_email_${uuid}`,
        MessageDeduplicationId: uuid,
      });

      return {
        result: Result.ok,
      };
    } catch (error) {
      const { message } = <Error>error;
      console.error(`cannot generate email verify token ${message}`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async verifyEmail({ token }: VerifyEmailInput): Promise<ResultResponse> {
    try {
      const {
        newEmail,
        emailVerifyToken,
      } = this.generatorService.decodeToken<DecodeEmailVerifyToken>(token);

      const user = await this.userRepository.findOne({
        where: {
          userPrivate: {
            emailVerifyToken,
          },
        },
        include: {
          userPrivate: true,
        },
      });
      if (!user) {
        throw new Error('token is invalid');
      }
      if (user.userPrivate?.publicAddress) {
        throw new Error('email cannot change');
      }

      await this.userRepository.update({
        where: {
          id: user.id,
        },
        data: {
          userPrivate: {
            update: {
              email: newEmail,
              emailVerifyToken: null,
            },
          },
        },
      });

      return {
        result: Result.ok,
      };
    } catch (error) {
      const { message } = <Error>error;
      console.error(`cannot verify token ${message}`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async follows(
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<
    (UserFollow & {
      isFollowing: boolean;
      publicAddress: string | null;
      totalPost: number;
      totalFollower: number | 0;
      totalFollowing: number | 0;
      weekly: number | null;
      all: number | null;
      best: number | null;
    })[]
  > {
    const userFollowings = await this.userRepository.fetchUserFollowings(userId, pagingOptions);
    if (!userFollowings) {
      throw Error(`cannot get follows. userId: ${userId}`);
    }

    const following = userFollowings?.following || [];
    const userFollowers = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        followedBy: {
          where: {
            id: { in: following.map(extractIds) },
          },
          select: {
            id: true,
          },
        },
      },
    });

    const followedBy = userFollowers?.followedBy || [];
    const setFollowedBy = new Set(followedBy.map(extractIds));

    return following.map((follow) => ({
      ...follow,
      isFollowing: setFollowedBy.has(follow.id),
      publicAddress: follow.userPrivate ? follow.userPrivate.publicAddress : null,
      totalPost: follow.posts?.length ?? 0,
      totalFollower: follow.followedBy?.length ?? 0,
      totalFollowing: follow.following?.length ?? 0,
      weekly: follow.UserProfileRanking?.weekly ?? null,
      all: follow.UserProfileRanking?.all ?? null,
      best: follow.UserProfileRanking?.best ?? null,
    }));
  }

  async followers(
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<
    (UserFollow & {
      isFollowing: boolean;
      publicAddress: string | null;
      totalPost: number;
      totalFollower: number | 0;
      totalFollowing: number | 0;
      weekly: number | null;
      all: number | null;
      best: number | null;
    })[]
  > {
    const userFollowers = await this.userRepository.fetchUserFollowers(userId, pagingOptions);
    if (!userFollowers) {
      throw Error(`cannot get followers. userId: ${userId}.`);
    }

    const followedBy = userFollowers?.followedBy || [];
    const userFollowings = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: {
          where: {
            id: { in: followedBy.map(extractIds) },
          },
          select: {
            id: true,
          },
        },
      },
    });

    const following = userFollowings?.following || [];
    const setFollowing = new Set(following.map(extractIds));

    return followedBy.map((follow) => ({
      ...follow,
      isFollowing: setFollowing.has(follow.id),
      publicAddress: follow.userPrivate ? follow.userPrivate.publicAddress : null,
      totalPost: follow.posts?.length ?? 0,
      totalFollower: follow.followedBy?.length ?? 0,
      totalFollowing: follow.following?.length ?? 0,
      weekly: follow.UserProfileRanking?.weekly ?? null,
      all: follow.UserProfileRanking?.all ?? null,
      best: follow.UserProfileRanking?.best ?? null,
    }));
  }

  async createFollow(currentUser: User, socialActionInput: SocialActionInput): Promise<number> {
    const { id } = currentUser;
    const { userId } = socialActionInput;
    try {
      await this.userRepository.createFollow(id, socialActionInput);
      await this.notificationService.createNotification(id, userId, InfoType.FOLLOW);

      return userId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`user cannot follow ther user. message: ${message} userId: ${userId}.`);
    }
  }

  async deleteFollow(currentUser: User, socialActionInput: SocialActionInput): Promise<number> {
    const { id } = currentUser;
    const { userId } = socialActionInput;
    try {
      await this.userRepository.deleteFollow(id, socialActionInput);

      return userId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`user cannot unfollow the user. message: ${message} userId: ${userId}.`);
    }
  }

  async deleteFollower(currentUser: User, socialActionInput: SocialActionInput): Promise<number> {
    const { id } = currentUser;
    const { userId } = socialActionInput;
    try {
      await this.userRepository.deleteFollower(id, socialActionInput);

      return userId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`user cannot unfollow the user. message: ${message} userId: ${userId}.`);
    }
  }

  async blocks(currentUser: User, pagingOptions?: PagingOptionsInput): Promise<UserFollow[]> {
    const { id } = currentUser;
    const userBlockings = await this.userRepository.fetchUserBlockings(id, pagingOptions);

    if (!userBlockings) {
      throw Error(`cannot get blocks. userId: ${id}`);
    }

    return userBlockings?.blocking || [];
  }

  async createBlock(currentUser: User, socialActionInput: SocialActionInput): Promise<number> {
    const { id } = currentUser;
    const { userId } = socialActionInput;
    try {
      await this.userRepository.createBlock(id, socialActionInput);

      return userId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`user cannot block ther user. message: ${message} userId: ${userId}.`);
    }
  }

  async deleteBlock(currentUser: User, socialActionInput: SocialActionInput): Promise<number> {
    const { id } = currentUser;
    const { userId } = socialActionInput;
    try {
      await this.userRepository.deleteBlock(id, socialActionInput);

      return userId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`user cannot unfollow the user. message: ${message} userId: ${userId}.`);
    }
  }

  async getSupporters(userId: number, pagingOptions?: PagingOptionsInput): Promise<UserFollow[]> {
    return await this.userRepository.fetchSupporters(userId, pagingOptions);
  }

  async registerPublicAddress(currentUser: User, publicAddress: string): Promise<User> {
    const { id } = currentUser;
    try {
      const updatedUser = await this.userRepository.registerPublicAddress(id, publicAddress);
      if (!updatedUser) {
        throw Error(`user does not exist. userId: ${id}.`);
      }

      return updatedUser;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`public address cannot be updated. message: ${message} userId: ${id}.`);
    }
  }

  async mySetting(currentUser: User): Promise<UserPrivate> {
    const { id } = currentUser;
    const userPrivate = await this.prisma.userPrivate.findFirst({
      where: {
        userId: id,
      },
    });
    if (!userPrivate) {
      throw Error(`user does not exist. userId: ${id}.`);
    }

    return userPrivate;
  }

  async updateMySetting(
    currentUser: User,
    updateMySettingInput: UpdateMySettingInput,
  ): Promise<UserPrivate> {
    const { id } = currentUser;
    try {
      const updatedUser = await this.userRepository.updateMySetting(id, updateMySettingInput);
      if (!updatedUser || !updatedUser.userPrivate) {
        throw Error(`user does not exist. userId: ${id}.`);
      }

      return updatedUser.userPrivate;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`my setting cannot be updated. message: ${message} userId: ${id}.`);
    }
  }

  async deleteAccount(currentUser: User): Promise<ResultResponse> {
    const { id, auth0Id, icon } = currentUser;
    try {
      const accessToken = await this.auth0Provider.getOauthToken();
      await this.auth0Provider.deleteAccount(accessToken, auth0Id);
      console.log(`delete account from auth0. authId: ${auth0Id}.`);

      const subscriptionKeys = await this.userRepository.fetchSubscriptionKeys(id);
      await Promise.all(
        subscriptionKeys.map(async (subscriptionKey) => {
          await this.stripeService.cancelCustomerSubscription(subscriptionKey);
        }),
      );
      console.log(`cancel all subscriptions. userId: ${id}.`);

      const filenames = await this.userRepository.fetchPhotoFilenames(id);
      if (icon) {
        filenames.push(icon);
      }

      if (filenames.length !== 0) {
        await this.s3Provider.deleteFiles(filenames);
      }
      console.log(`delete all image data. userId: ${id}.`);

      await this.prisma.$executeRaw(`DELETE FROM "public"."User" WHERE id = $1;`, id);
      console.log(`delete account from rds. userId: ${id}.`);

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(`cannot delete account. message: ${message} userId: ${currentUser.id}.`);

      return {
        result: Result.ng,
      };
    }
  }

  async migrateOldAccount(input: MigrateOldAccountInput): Promise<MigrateOldAccountResponse> {
    const { account: inputAccount, email } = input;
    const account = inputAccount.toLocaleLowerCase();
    const newAuth0Id = `${MIGRATE_AUTH0_ID}_${account}`;
    const newInput = { ...input, auth0Id: newAuth0Id };

    try {
      const findSameOldAccount = await this.prisma.user.findFirst({
        where: {
          auth0Id: newAuth0Id,
          userPrivate: {
            email,
          },
        },
      });
      if (findSameOldAccount) {
        return {
          result: Result.ng,
          message: 'Your account has already registered. Login in your account on curecos.',
        };
      }

      const findAccount = await this.prisma.user.findFirst({
        where: {
          account: {
            equals: account,
            mode: 'insensitive',
          },
        },
      });
      if (findAccount) {
        const newAccount = await this.generateUniqueAccount();
        newInput.account = newAccount;
        newInput.auth0Id = `${MIGRATE_AUTH0_ID}_${newAccount}`;
      }

      await this.userRepository.registerUser({
        ...newInput,
      });

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(`cannot create migrate account. message: ${message} account: ${account}.`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async getLinkAccounts(auth0Id: string): Promise<User[]> {
    const accessToken = await this.auth0Provider.getOauthToken();
    const auth0User = await this.auth0Provider.getUser(accessToken, auth0Id);

    // メールアドレスがないユーザ
    if (!auth0User.email) {
      await this.updateIsAlreadyLinkAccount(accessToken, auth0Id);

      return [];
    }

    // パスワード認証のユーザはメール認証済みでないとリンクできるアカウントを取得できない
    if (auth0User.identities[0].provider === 'auth0' && !auth0User.email_verified) {
      throw new ForbiddenError('you have to verify email first');
    }

    await this.updateIsAlreadyLinkAccount(accessToken, auth0Id);

    const auth0Users = await this.auth0Provider.getUsersByEmail(accessToken, auth0User.email);

    // filtered
    const filtered = auth0Users.filter((auth) => auth.user_id !== auth0Id);
    if (filtered.length === 0) return [];

    return await this.prisma.user.findMany({
      where: {
        auth0Id: {
          in: filtered.map(({ user_id }) => user_id),
        },
      },
    });
  }

  private async updateIsAlreadyLinkAccount(accessToken: string, auth0Id: string): Promise<void> {
    // linkAccountsをcallしたユーザは、auth0のis_already_link_accountを設定する
    const body = {
      app_metadata: {
        is_already_link_account: true,
      },
    };

    await this.auth0Provider.updateUser(accessToken, auth0Id, body);
  }

  async getLinkAccountsByAuth0(email: string, auth0Id: string): Promise<User[]> {
    const accessToken = await this.auth0Provider.getOauthToken();
    const auth0Users = await this.auth0Provider.getUsersByEmail(accessToken, email);

    // auth0側からリクエストした自分のアカウントは含めないようにする。
    const filtered = auth0Users.filter((auth) => auth.user_id !== auth0Id);
    if (filtered.length === 0) return [];

    return await this.prisma.user.findMany({
      where: {
        auth0Id: {
          in: filtered.map(({ user_id }) => user_id),
        },
      },
    });
  }

  async linkAccount(myAuth0Id: string, userId: number): Promise<ResultResponse> {
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!dbUser) {
        throw new Error(`userId does not exist userId: ${userId}.`);
      }

      const accessToken = await this.auth0Provider.getOauthToken();
      const primaryUser = await this.auth0Provider.getUser(accessToken, dbUser.auth0Id);
      const myUser = await this.auth0Provider.getUser(accessToken, myAuth0Id);
      const myProvider = myUser.identities[0].provider;

      // Auth0側でメールアドレスが一致しているユーザのみリンクできる
      if (primaryUser.email !== myUser.email) {
        throw new Error('invalid request');
      }

      // パスワード認証かつメールアドレスが認証されていないユーザはリンクできない
      if (myProvider === 'auth0' && !myUser.email_verified) {
        throw new Error('you have to verify email first');
      }

      const myDbUser = await this.prisma.user.findFirst({
        where: {
          auth0Id: myAuth0Id,
        },
        include: {
          posts: true,
          comments: true,
        },
      });

      // 投稿を持っている人はリンクできない
      if ((myDbUser?.posts || []).length !== 0) {
        throw new Error('you already has posts.');
      }

      // コメントを持っている人はリンクできない
      if ((myDbUser?.comments || []).length !== 0) {
        throw new Error('you already has comments.');
      }

      await this.auth0Provider.linkAccount(accessToken, primaryUser.user_id, myAuth0Id, myProvider);

      // リンクするとリンクアクションを起こしたユーザのアカウントをrdsからのみ消す
      if (myDbUser) {
        // cascadingで削除する
        await this.prisma.$executeRaw(`DELETE FROM "public"."User" WHERE id = $1;`, myDbUser.id);
      }

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(`cannot link account. message: ${message} myAuth0Id: ${myAuth0Id}.`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async getNftDistributedUsers(pagingOptions?: PagingOptionsInput): Promise<User[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const users = await this.userRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        NOT: [
          {
            isBan: true,
          },
          {
            cOTTipNFTDistributionState: null,
          },
        ],
      },
      include: {
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });

    return users;
  }

  private getIsCurrentUserIsMembership = async (
    userId: number,
    currentUser?: User,
  ): Promise<boolean> => {
    if (!currentUser) return false;

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        buyerId: currentUser.id,
        sellerId: userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    return !!subscription;
  };

  private generateUniqueAccount = async (): Promise<string> => {
    const newAccount = this.generatorService.getRandomString();
    const user = await this.prisma.user.findFirst({
      where: {
        account: newAccount,
      },
    });
    if (!user) return newAccount;

    return this.generateUniqueAccount();
  };

  private getMigrateOldAccountId = async (email: string): Promise<number | null> => {
    const users = await this.prisma.user.findMany({
      where: {
        userPrivate: {
          email,
        },
      },
    });
    const user = users.find((user) => user.auth0Id.includes(MIGRATE_AUTH0_ID));

    return user?.id ?? null;
  };
}
