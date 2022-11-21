/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getLimitOffsetSql } from '@common/pagination/get-limit-offset-sql';
import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { notIsBanQuery } from '@common/repository/not-is-ban-query';
import { getFindUserWhereQuery } from '@common/util/get-find-user-where-query';
import { getSnsValue } from '@common/util/get-sns-value';
import { generateHashedFilename } from '@common/util/image-filename';
import { EMAIL_REG_EXP } from '@configs/constant';
import { IncludeInput, DataInput } from '@interfaces';
import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { Gender } from '@modules/user-private/enum/gender';
import { UserPrivateSetting } from '@modules/user-private/user-private-setting.model';
import { Prisma } from '@prisma/client';
import { GeneratorService } from '@services/generator.service';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { CreateUserAfterRegistrationInput } from './dto/input/create-user-after-registration';
import { SocialActionInput } from './dto/input/social-action';
import { UpdateMySettingInput } from './dto/input/update-my-setting';
import { UpdateProfileInput } from './dto/input/update-profile';
import { UserFollow } from './user-follow.model';
import { User } from './user.model';

type FindUserType = User & {
  followingCount: number;
  followedByCount: number;
  totalMemberships: number;
  totalMembershippedBy: number;
  postCount: number;
  all: number | null;
  weekly: number | null;
  best: number | null;
  membershipId: number | null;
  nftCampaign?: NFTCampaign | null;
  publicAddress?: string | null;
};

export interface rankingUser extends User {
  totalFollowing: number;
  totalFollowedBy: number;
  totalPosts: number;
  all: number | null;
  best: number | null;
  weekly: number | null;
}

@Service()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generatorService: GeneratorService,
  ) {}

  async findUsers(query: string, pagingOptions?: PagingOptionsInput): Promise<User[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.user.findMany({
      ...pagingOptionsQuery,
      where: {
        OR: [
          {
            account: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        ...notIsBanQuery,
      },
      include: {
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
  }

  async findUsersIsCosplayer(pagingOptions?: PagingOptionsInput): Promise<User[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.user.findMany({
      ...pagingOptionsQuery,
      where: {
        ...notIsBanQuery,
        isCosplayer: true,
      },
      include: {
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
  }

  async findNewUsers(pagingOptions?: PagingOptionsInput): Promise<rankingUser[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.$queryRaw<rankingUser[]>`SELECT DISTINCT 
        "user".* ,
        "userPrivate"."publicAddress",
        "userRanking"."all" as "all",
        "userRanking"."best" as "best",
        "userRanking"."weekly" as "weekly",
        coalesce("ufa"."followingCount", 0) as "totalFollowing",
        coalesce("ufb"."followedByCount", 0) as "totalFollowedBy",
        count("post".*) over(partition by "user"."id") as "totalPosts"
        FROM "public"."User" as "user" inner join "public"."Post" as "post" on "user"."id"="post"."userId"
        join "public"."UserPrivate" as "userPrivate" on "user"."id"="userPrivate"."userId"
        join "public"."UserProfileRanking" as "userRanking" on "user"."id"="userRanking"."userId"
        left outer join (
          select "A", count(*) as "followingCount"
          from "public"."_UserFollows"
          group by "A"
        ) as "ufa"
        on "user"."id" = "ufa"."A"
        left outer join (
          select "B", count(*) as "followedByCount"
          from "public"."_UserFollows"
          group by "B"
        ) as "ufb"
        on "user"."id" = "ufb"."B"                                               
        ORDER BY "user"."id" desc
        limit ${pagingOptionsQuery.take} offset ${pagingOptionsQuery.skip}`;
  }

  async registerUser(
    input: CreateUserAfterRegistrationInput & {
      account: string;
      gender?: Gender;
      birthday?: Date;
      profile?: string;
    },
  ): Promise<User> {
    const { account, auth0Id, profile, name, ...rest } = input;
    const newName = EMAIL_REG_EXP.test(name) ? this.generatorService.getRandomString() : name;

    return await this.prisma.user.create({
      data: {
        auth0Id,
        account,
        name: newName,
        profile,
        userPrivate: {
          create: { ...rest },
        },
      },
    });
  }

  async findUser(userId?: number, account?: string): Promise<FindUserType> {
    const findUserRawQuery = getFindUserWhereQuery(userId, account);
    const nowDate = new Date().toISOString(); // PostgreSQL supports ISO 8601 datetime format
    const result = await this.prisma.$queryRaw<
      (User & {
        followingCount: number;
        followedByCount: number;
        totalMemberships: number;
        totalMembershippedBy: number;
        postCount: number;
        all: number | null;
        weekly: number | null;
        best: number | null;
        membershipId: number | null;
        publicAddress: string | null;
        nftCotTarget: string | null;
        'uc.targetCosplayer': string | null;
        'uc.targetERC721': string | null;
        'uc.lowerCOT': string | null;
        'uc.userId': number | null;
        'nc.id': number | null;
        'nc.title': string;
        'nc.description': string;
        'nc.start': string | null;
        'nc.end': string | null;
        'nc.contract': string | null;
        'nc.userId': number | null;
        'nc.emissionRateTable': Record<string, number> | null;
      })[]
    >(`
      select
        "x".*,
        "upr"."all",
        "upr"."weekly",
        "upr"."best",
        "up"."publicAddress" as "publicAddress",
        "m"."id" as "membershipId",
        "uc"."targetCosplayer" as "uc.targetCosplayer",
        "uc"."targetERC721" as "uc.targetERC721",
        "uc"."lowerCOT" as "uc.lowerCOT",
        "uc"."userId" as "uc.userId",
        "nc"."id" as "nc.id",
        "nc"."title" as "nc.title",
        "nc"."description" as "nc.description",
        "nc"."start" as "nc.start",
        "nc"."end" as "nc.end",
        "nc"."contract" as "nc.contract",
        "nc"."emissionRateTable" as "nc.emissionRateTable"
      from (
        select
          distinct("u".*),
          coalesce("ufb"."followingCount", 0) as "followingCount",
          coalesce("ufa"."followedByCount", 0) as "followedByCount",
          coalesce("tms"."totalMemberships", 0) as "totalMemberships",
          coalesce("tmsby"."totalMembershippedBy", 0) as "totalMembershippedBy",
          count(p.*) over(partition by "u".id) as "postCount"
        from "public"."User" as "u"
        left outer join (
          select
            distinct("B") as "userId",
            count(*) over(partition by "B") as "followingCount"
          from "public"."_UserFollows"
        ) as ufb
        on u.id = ufb."userId"
        left outer join (
          select
            distinct("A") as "userId",
            count(*) over(partition by "A") as "followedByCount"
          from "public"."_UserFollows"
        ) as ufa
        on u.id = ufa."userId"
      left outer join (
          select
            distinct("buyerId") as "userId",
            count(*) over(partition by "buyerId") as "totalMemberships"
          from "public"."Subscription"
          where "status" = 'ACTIVE'
        ) as tms
        on u.id = tms."userId"
      left outer join (
          select
            distinct("sellerId") as "userId",
            count(*) over(partition by "sellerId") as "totalMembershippedBy"
          from "public"."Subscription"
          where "status" = 'ACTIVE'
        ) as tmsby
        on u.id = tmsby."userId"
        left outer join "public"."Post" as "p"
        on "u"."id" = "p"."userId"
        ${findUserRawQuery}
        AND "u"."isBan" = false
      ) as "x"
      left outer join "public"."UserProfileRanking" as "upr"
      on "x"."id" = "upr"."userId"
      left outer join "public"."Membership" as "m"
      on "x"."id" = "m"."userId"
      left outer join "public"."UserPrivate" as "up"
      on "x"."id" = "up"."userId"
      left outer join "public"."COTTipNFTDistributionState" as "uc"
      on "x"."id" = "uc"."userId"
      left outer join (
        select *
        from "public"."NFTCampaign"
        where '${nowDate}' > "start" and '${nowDate}' < "end"
      ) as "nc"
      on "x"."id" = "nc"."userId" ORDER BY "end" ASC;
    `);

    if (result.length === 0) {
      throw Error(`user does not exist. raw query: ${findUserRawQuery}`);
    }
    const findUser = result[0];
    const user = {
      ...result[0],
    } as FindUserType;

    if (findUser['nc.id']) {
      user.nftCampaign = {
        id: findUser['nc.id'],
        title: findUser['nc.title'] ?? '',
        description: findUser['nc.description'] ?? '',
        start: new Date(findUser['nc.start']!),
        end: new Date(findUser['nc.end']!),
        contract: findUser['nc.contract']!,
        userId: findUser['nc.userId']!,
        emissionRateTable: findUser['nc.emissionRateTable'],
      };
    }

    if (findUser['uc.targetCosplayer']) {
      user.cOTTipNFTDistributionState = {
        targetCosplayer: findUser['uc.targetCosplayer']!,
        targetERC721: findUser['uc.targetERC721']!,
        lowerCOT: findUser['uc.lowerCOT']!,
        userId: findUser['uc.userId']!,
      };
    }

    return user;
  }

  async findMyPrivate(userId: number): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        ...notIsBanQuery,
      },
      include: {
        userPrivate: true,
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
    if (!user) {
      throw Error(`user does not exist. userId: ${userId}.`);
    }

    return user;
  }

  async findMany(args: Prisma.UserFindManyArgs): Promise<User[]> {
    return await this.prisma.user.findMany(args);
  }

  async findOne(args: Prisma.UserFindFirstArgs): Promise<User | null> {
    return await this.prisma.user.findFirst(args);
  }

  async updateProfile(currentUser: User, updateProfileInput: UpdateProfileInput): Promise<User> {
    const { id } = currentUser;
    const snsInfo = currentUser.snsInfo as { [key: string]: string };
    const { birthday, gender, phone, facebook, twitter, instagram, ...rest } = updateProfileInput;
    const sns = getSnsValue(snsInfo, { facebook, twitter, instagram });

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        snsInfo: sns,
        ...rest,
        userPrivate: {
          upsert: {
            create: {
              birthday,
              gender,
              phone,
            },
            update: {
              birthday,
              gender,
              phone,
            },
          },
        },
      },
      include: {
        posts: true,
        followedBy: true,
        following: true,
        userPrivate: true,
        membership: true,
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
  }

  async update(args: Prisma.UserUpdateArgs): Promise<User> {
    return await this.prisma.user.update(args);
  }

  async fetchUserFollowings(
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<(User & { following: UserFollow[] | null }) | null> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: {
          ...pagingOptionsQuery,
          include: {
            UserProfileRanking: true,
            posts: true,
            following: true,
            followedBy: true,
            userPrivate: true,
            nftCampaigns: true,
            cOTTipNFTDistributionState: true,
          },
        },
      },
    });
  }

  async fetchUserFollowers(
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<(User & { followedBy: UserFollow[] | null }) | null> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        followedBy: {
          ...pagingOptionsQuery,
          include: {
            UserProfileRanking: true,
            posts: true,
            following: true,
            followedBy: true,
            userPrivate: true,
            nftCampaigns: true,
            cOTTipNFTDistributionState: true,
          },
        },
      },
    });
  }

  async fetchSupporters(userId: number, pagingOptions?: PagingOptionsInput): Promise<User[]> {
    const limitOffsetSql = getLimitOffsetSql(pagingOptions);
    const supporters = await this.prisma.$queryRaw<User[]>(`
      SELECT
        "sl".*,
        "u"."id",
        "u"."name",
        "u"."account",
        "u"."icon"
      FROM (
        SELECT
          "senderId",
          SUM("score") as "totalScore"
        FROM "ScoreLog"
        WHERE "userId" = ${userId}
        GROUP BY "senderId"
        ORDER BY "totalScore" DESC
        ${limitOffsetSql}
      ) AS "sl"
      JOIN "User" AS "u"
      ON "sl"."senderId" = "u"."id"
      ORDER BY "totalScore" DESC;
    `);

    return supporters;
  }

  async createFollow(id: number, socialActionInput: SocialActionInput): Promise<void> {
    const { userId } = socialActionInput;
    const dataInput = {
      following: {
        connect: {
          id: userId,
        },
      },
    };

    await this.socialAction(id, dataInput);
  }

  async deleteFollow(id: number, socialActionInput: SocialActionInput): Promise<void> {
    const { userId } = socialActionInput;
    const dataInput = {
      following: {
        disconnect: {
          id: userId,
        },
      },
    };

    await this.socialAction(id, dataInput);
  }

  async deleteFollower(id: number, socialActionInput: SocialActionInput): Promise<void> {
    const { userId } = socialActionInput;
    const dataInput = {
      followedBy: {
        disconnect: {
          id: userId,
        },
      },
    };

    await this.socialAction(id, dataInput);
  }

  async fetchUserBlockings(
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<User | null> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const includeInput = {
      blocking: {
        ...pagingOptionsQuery,
        select: {
          id: true,
          auth0Id: true,
          account: true,
          name: true,
          icon: true,
        },
      },
    };

    return await this.fetchSocials(userId, includeInput);
  }

  async createBlock(id: number, socialActionInput: SocialActionInput): Promise<void> {
    const { userId } = socialActionInput;
    const dataInput = {
      blocking: {
        connect: {
          id: userId,
        },
      },
      following: {
        disconnect: {
          id: userId,
        },
      },
      followedBy: {
        disconnect: {
          id: userId,
        },
      },
    };

    await this.socialAction(id, dataInput);
  }

  async deleteBlock(id: number, socialActionInput: SocialActionInput): Promise<void> {
    const { userId } = socialActionInput;
    const dataInput = {
      blocking: {
        disconnect: {
          id: userId,
        },
      },
    };

    await this.socialAction(id, dataInput);
  }

  async registerPublicAddress(id: number, publicAddress: string): Promise<User> {
    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        userPrivate: {
          upsert: {
            create: {
              publicAddress,
            },
            update: {
              publicAddress,
            },
          },
        },
      },
      include: {
        userPrivate: true,
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
  }

  async updateMySetting(id: number, updateMySettingInput: UpdateMySettingInput): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        userPrivate: {
          select: {
            setting: true,
          },
        },
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
    if (!user) {
      throw Error('user does not exist.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const oldSetting = user.userPrivate?.setting as UserPrivateSetting;

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        userPrivate: {
          update: {
            setting: {
              ...oldSetting,
              ...updateMySettingInput,
            },
          },
        },
      },
      include: {
        userPrivate: true,
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
      },
    });
  }

  async fetchSubscriptionKeys(userId: number): Promise<string[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
      select: {
        stripeSubscriptionKey: true,
      },
    });

    return subscriptions.map((subscription) => subscription.stripeSubscriptionKey);
  }

  async fetchPhotoFilenames(userId: number): Promise<string[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        userId,
      },
      include: {
        photos: {
          select: {
            image: true,
          },
        },
      },
    });

    const filenames = posts.flatMap((post) => post.photos).map((photo) => photo.image);
    const blurredFilenames = filenames.map(generateHashedFilename);

    return [...filenames, ...blurredFilenames];
  }

  private async fetchSocials(userId: number, includeInput: IncludeInput): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        ...includeInput,
      },
    });
  }

  private async socialAction(id: number, dataInput: DataInput): Promise<void> {
    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...dataInput,
      },
    });
  }
}
