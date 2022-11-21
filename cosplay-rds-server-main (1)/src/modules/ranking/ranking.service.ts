import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { extractIds, extractUserIds } from '@common/util/extract-ids';
import { PostRankig } from '@modules/post/post-ranking.model';
import { Post } from '@modules/post/post.model';
import { PostService } from '@modules/post/post.service';
import { UserRanking, UserRankingNew } from '@modules/user/user-ranking.model';
import { User } from '@modules/user/user.model';
import { UserService } from '@modules/user/user.service';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { CotHolderRankingResponse } from './dto/response/cot-holder-ranking';
import { RankingInterval } from './enum/ranking-interval';
import { RankingRepository } from './ranking.repository';

export interface rankingEventUser {
  userId?: number;
  score?: number;
  user: User;
}

@Service()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingRepository: RankingRepository,
    private readonly postService: PostService,
    private readonly userService: UserService,
  ) {}

  async eventRanking(
    eventId: number,
    pagingOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<{ posts: PostRankig[]; users: rankingEventUser[] }> {
    //event post
    const tag = await this.prisma.tag.findFirst({
      where: {
        eventId: eventId,
      },
      include: {
        posts: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!tag) return { posts: [], users: [] };
    const userLog: rankingEventUser[] = [];
    const postIds = tag.posts.map(extractIds);
    const scoreLogs = await this.rankingRepository.findEventScoreLogs(postIds, pagingOptions);
    const postDetail = await this.takePostRanking(scoreLogs, currentUser);

    for (const posts of postDetail) {
      let check = false;
      const score = posts.score ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-for-in-array
      for (const i in userLog) {
        if (userLog[i].userId === posts.post.userId) {
          check = true;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          userLog[i].score += score;
        }
      }
      if (check) {
        continue;
      }
      const user = await this.userService.user(
        posts?.post?.user?.id,
        posts?.post?.user?.account,
        currentUser,
      );
      const dataqUserRank: rankingEventUser = {
        userId: posts.post.userId,
        score: score,
        user: user,
      };
      userLog.push(dataqUserRank);
    }
    // console.log('userRefer', userLog);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    userLog.sort((a, b) => b.score - a.score);
    const data = {
      posts: postDetail,
      users: userLog,
    };

    return data;
  }

  async userRankingNew(
    interval: RankingInterval | 'all',
    pagingOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<UserRankingNew[]> {
    const scoreLogs = await this.rankingRepository.findUserScoreLogsRank(interval, pagingOptions);

    const scoreLogUserIds = scoreLogs.map(extractUserIds);
    const users = await this.rankingRepository.findUsersWithFollowsCount(scoreLogUserIds);
    let followingIds: number[] = [];
    if (currentUser) {
      followingIds = await this.followingIds(currentUser.id);
    }
    const organized = scoreLogs.map((scoreLog) => {
      const { userId, totalScore, rank, all, weekly, best, publicAddress } = scoreLog;
      let isFollowing = false;
      if (followingIds) {
        isFollowing = followingIds.includes(userId);
      }
      const profileRanking = {
        all: all ?? 0,
        weekly: weekly ?? 0,
        best: best ?? 0,
      };
      const user = users.find((u) => u.id === userId);
      if (!user) {
        throw Error(`user does not exist. userId: ${userId}.`);
      } else {
        user.publicAddress = publicAddress;
      }
      if (scoreLog['nc.id']) {
        user.nftCampaign = {
          id: scoreLog['nc.id'],
          title: scoreLog['nc.title'] ?? '',
          description: scoreLog['nc.description'] ?? '',
          start: new Date(scoreLog['nc.start']!),
          end: new Date(scoreLog['nc.end']!),
          contract: scoreLog['nc.contract']!,
          userId: scoreLog['nc.userId']!,
          emissionRateTable: scoreLog['nc.emissionRateTable'],
        };
      }
      if (scoreLog['uc.targetCosplayer']) {
        user.cOTTipNFTDistributionState = {
          targetCosplayer: scoreLog['uc.targetCosplayer']!,
          targetERC721: scoreLog['uc.targetERC721']!,
          lowerCOT: scoreLog['uc.lowerCOT']!,
          userId: scoreLog['uc.userId']!,
        };
      }

      return {
        user,
        profileRanking,
        totalFollowing: user.followingCount,
        totalFollowedBy: user.followedByCount,
        totalPosts: scoreLog.totalPosts,
        score: totalScore,
        rank,
        isFollowing,
      };
    });

    return organized;
  }

  async userRanking(
    interval: RankingInterval | 'all',
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserRanking[]> {
    const scoreLogs = await this.rankingRepository.findUserScoreLogs(interval, pagingOptions);

    const scoreLogUserIds = scoreLogs.map(extractUserIds);
    const users = await this.rankingRepository.findUsersWithFollowsCount(scoreLogUserIds);

    const organized = scoreLogs.map((scoreLog) => {
      const { userId, totalScore, rank } = scoreLog;
      const user = users.find((u) => u.id === userId);
      if (!user) {
        throw Error(`user does not exist. userId: ${userId}.`);
      }

      return {
        user,
        totalFollowing: user.followingCount,
        totalFollowedBy: user.followedByCount,
        score: totalScore,
        rank,
      };
    });

    return organized;
  }

  async postRanking(
    interval: RankingInterval,
    pagingOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<PostRankig[]> {
    const scoreLogs = await this.rankingRepository.findPostScoreLogs(interval, pagingOptions);

    return await this.takePostRanking(scoreLogs, currentUser);
  }

  async cotHolderRanking(pagingOptions?: PagingOptionsInput): Promise<CotHolderRankingResponse[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    const userPrivates = await this.prisma.userPrivate.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          totalCot: 'desc',
        },
      ],
      where: {
        user: {
          posts: {
            some: {},
          },
        },
        NOT: [
          {
            totalCot: null,
          },
          {
            totalCot: 0,
          },
        ],
      },
      include: {
        user: {
          include: {
            posts: true,
            followedBy: true,
            following: true,
            UserProfileRanking: true,
          },
        },
      },
    });

    const cotHolderRanking = userPrivates.map(({ user, totalCot, publicAddress }, index) => {
      const all = user.UserProfileRanking?.all || null;
      const weekly = user.UserProfileRanking?.weekly || null;
      const best = user.UserProfileRanking?.best || null;
      const totalFollows = user.following.length;
      const totalFollowers = user.followedBy.length;
      const totalPosts = user.posts.length;
      const profileRanking = {
        all: all ?? 0,
        weekly: weekly ?? 0,
        best: best ?? 0,
      };

      return {
        user,
        publicAddress: publicAddress ?? null,
        rank: index + 1 + (pagingOptions?.offset ?? 0),
        totalCot: totalCot as number,
        profileRanking: profileRanking,
        totalFollows,
        totalFollowers,
        totalPosts,
      };
    });

    return cotHolderRanking;
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

  addIsFollowingMap(
    post: Post,
    isFollowing: boolean,
    currentUserId?: number,
  ): Post & { isFollowing: boolean } {
    if (post?.user?.id === currentUserId) return { ...post, isFollowing: false };

    return { ...post, isFollowing };
  }

  addIsFollowingWithFollowingIds(
    posts: Post[],
    followingIds: number[],
    currentUserId?: number,
  ): void {
    const setFollowingIds = new Set(followingIds);
    const added = posts.map((post) =>
      this.addIsFollowingMap(post, setFollowingIds.has(post?.user?.id as number), currentUserId),
    );

    posts.splice(0, posts.length, ...added);
  }

  private async takePostRanking(
    scoreLogs: { postId: number; totalScore: number; rank: number }[],
    currentUser?: User,
  ): Promise<PostRankig[]> {
    const scoreLogPostIds = scoreLogs.map((scoreLog) => scoreLog.postId);
    const posts = await this.prisma.post.findMany({
      where: {
        id: {
          in: scoreLogPostIds,
        },
      },
      include: {
        comments: {
          where: {
            superchatId: {
              not: null,
            },
          },
          include: {
            user: true,
            superChat: {
              include: {
                user: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: { favs: true, comments: true },
        },
        user: {
          include: {
            nftCampaigns: true,
            cOTTipNFTDistributionState: true,
            membership: {
              select: {
                stripePriceId: true,
              },
            },
          },
        },
        photos: {
          select: {
            id: true,
            image: true,
            postId: true,
          },
        },
        hashtags: true,
        tags: {
          include: {
            user: true,
            event: true,
          },
        },
      },
    });

    const organized = scoreLogs.map((scoreLog) => {
      const { postId, totalScore, rank } = scoreLog;
      const post = posts.find((u) => u.id === postId);
      if (!post) {
        throw Error('no post');
      }

      return {
        post,
        rank,
        score: totalScore,
      };
    });

    if (!currentUser) {
      return organized.map((org) => {
        const added = this.postService.addIsFollowingMap(org.post, false);

        return {
          ...org,
          post: added,
        };
      });
    }

    const origanizePosts = organized.map((or) => or.post);
    await this.postService.addFavAndIsMembership(currentUser, origanizePosts);

    this.postService.addIsFollowing(origanizePosts, true, currentUser.id);

    const followingIds: number[] = await this.followingIds(currentUser.id);
    this.addIsFollowingWithFollowingIds(origanizePosts, followingIds, currentUser.id);

    return organized.map((original, index) => {
      return {
        ...original,
        post: origanizePosts[index],
      };
    });
  }
}
