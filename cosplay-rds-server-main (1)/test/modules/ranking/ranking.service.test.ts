import 'reflect-metadata';
import { UserService } from '@modules/user/user.service';
import { HashTagService } from '../../../src/modules/hash-tag/hash-tag.service';
import { NotificationService } from '../../../src/modules/notification/notification.service';
import { PhotoRepository } from '../../../src/modules/photo/photo.repository';
import { PostRepository } from '../../../src/modules/post/post.repository';
import { PostService } from '../../../src/modules/post/post.service';
import { RankingInterval } from '../../../src/modules/ranking/enum/ranking-interval';
import { RankingRepository } from '../../../src/modules/ranking/ranking.repository';
import { RankingService } from '../../../src/modules/ranking/ranking.service';
import { ScoreLogRepository } from '../../../src/modules/score-log/score-log.repository';
import { ScoreLogService } from '../../../src/modules/score-log/score-log.service';
import { TagRepository } from '../../../src/modules/tag/tag.repository';
import { TagService } from '../../../src/modules/tag/tag.service';
import { S3Provider } from '../../../src/providers/s3.provider';
import { SqsService } from '../../../src/providers/sqs.provider';
import {
  fetchFirstTestUser,
  fetchSecondTestUser,
  fetchThirdTestUser,
  dayBefore,
  fetchFirstTestPost,
  fetchSecondTestPost,
} from '../../helper';
import { prisma } from '../../prisma-instance';
import {
  auth0Provider,
  cotTipRepository,
  generatorService,
  stripeService,
  userPrivateService,
  userRepository,
} from '../../service-instance';

xdescribe('RankingService', () => {
  let rankingService: RankingService;
  let rankingRepository: RankingRepository;

  beforeAll(async () => {
    await setupScoreLog();
  });

  beforeEach(() => {
    const tagRepository = new TagRepository(prisma);
    const s3Provider = new S3Provider(generatorService);
    const hashTagService = new HashTagService(prisma);
    const notificationService = new NotificationService(prisma);
    const scoreLogRepository = new ScoreLogRepository(prisma);
    const scoreLogService = new ScoreLogService(scoreLogRepository);
    const sqsService = new SqsService();
    const tagService = new TagService(prisma, tagRepository);
    const postRepository = new PostRepository(prisma);
    const photoRepository = new PhotoRepository(prisma);
    const postService = new PostService(
      s3Provider,
      prisma,
      hashTagService,
      tagService,
      postRepository,
      photoRepository,
      notificationService,
      scoreLogService,
      sqsService,
      userPrivateService,
    );
    const userService = new UserService(
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
    rankingRepository = new RankingRepository(prisma);
    rankingService = new RankingService(prisma, rankingRepository, postService, userService);
  });

  const setupScoreLog = async () => {
    const firstUser = await fetchFirstTestUser();
    const secondUser = await fetchSecondTestUser();
    const thirdUser = await fetchThirdTestUser();
    const firstPost = await fetchFirstTestPost();
    const secondPost = await fetchSecondTestPost();

    await prisma.scoreLog.deleteMany({});

    await prisma.scoreLog.create({
      data: {
        userId: firstUser.id,
        score: 1000,
        created: dayBefore(1),
        postId: firstPost.id,
      },
    });

    await prisma.scoreLog.create({
      data: {
        userId: firstUser.id,
        score: 500,
        created: dayBefore(10),
        postId: firstPost.id,
      },
    });

    await prisma.scoreLog.create({
      data: {
        userId: secondUser.id,
        score: 1200,
        created: dayBefore(2),
        postId: secondPost.id,
      },
    });

    await prisma.scoreLog.create({
      data: {
        userId: thirdUser.id,
        score: 400,
        created: dayBefore(10),
        postId: firstPost.id,
      },
    });
  };

  describe('userRanking', () => {
    it('returns userRanking', async () => {
      const ranking = await rankingService.userRanking(RankingInterval.MONTHLY);

      const firstRank = ranking[0];
      const secondRank = ranking[1];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1500);
      expect(firstRank.user.id).toBe(1);

      expect(secondRank.rank).toBe(2);
      expect(secondRank.score).toBe(1200);
      expect(secondRank.user.id).toBe(2);
    });

    it('interval', async () => {
      const ranking = await rankingService.userRanking(RankingInterval.WEEKLY);

      const firstRank = ranking[0];
      const secondRank = ranking[1];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1200);
      expect(firstRank.user.id).toBe(2);

      expect(secondRank.rank).toBe(2);
      expect(secondRank.score).toBe(1000);
      expect(secondRank.user.id).toBe(1);
    });

    it('pagingOption limit', async () => {
      const ranking = await rankingService.userRanking(RankingInterval.MONTHLY, { limit: 1 });

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1500);
      expect(firstRank.user.id).toBe(1);
      expect(ranking).toHaveLength(1);
    });

    it('pagingOption skip', async () => {
      const ranking = await rankingService.userRanking(RankingInterval.MONTHLY, { offset: 1 });

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(2);
      expect(firstRank.score).toBe(1200);
      expect(firstRank.user.id).toBe(2);
    });
  });

  describe('postRanking', () => {
    it('returns postRanking', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.MONTHLY);

      const firstRank = ranking[0];
      const secondRank = ranking[1];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1900);
      expect(firstRank.post.id).toBe(1);

      expect(secondRank.rank).toBe(2);
      expect(secondRank.score).toBe(1200);
      expect(secondRank.post.id).toBe(2);
    });

    it('interval', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.WEEKLY);

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1200);
      expect(firstRank.post.id).toBe(2);
    });

    it('pagingOption limit', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.MONTHLY, { limit: 1 });

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1900);
      expect(firstRank.post.id).toBe(1);
      expect(ranking).toHaveLength(1);
    });

    it('pagingOption skip', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.MONTHLY, { offset: 1 });

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(2);
      expect(firstRank.score).toBe(1200);
      expect(firstRank.post.id).toBe(2);
    });
  });

  describe('cotHolderRanking', () => {
    it('returns cotHolderRanking', async () => {
      await prisma.user.create({
        data: {
          auth0Id: 'cot_auth0Id',
          name: 'cot_name',
          account: 'cot_account',
          icon: 'cot_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              totalCot: 10,
            },
          },
        },
      });

      await prisma.user.create({
        data: {
          auth0Id: 'cot2_auth0Id',
          name: 'cot2_name',
          account: 'cot2_account',
          icon: 'cot2_icon',
          isBan: false,
          isCosplayer: false,
          userPrivate: {
            create: {
              totalCot: 5,
            },
          },
        },
      });

      const ranking = await rankingService.cotHolderRanking();

      expect(ranking[0].rank).toBe(1);
      expect(ranking[0]).toHaveProperty('totalCot');
    });
  });

  describe('eventRanking', () => {
    it('returns eventRanking', async () => {
      const ranking = await rankingService.eventRanking(1);

      const firstRank = ranking.posts[0];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1900);
      expect(firstRank.post.id).toBe(1);
    });

    it('interval', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.WEEKLY);

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1200);
      expect(firstRank.post.id).toBe(2);
    });

    it('pagingOption limit', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.MONTHLY, { limit: 1 });

      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(1);
      expect(firstRank.score).toBe(1900);
      expect(firstRank.post.id).toBe(1);
      expect(ranking).toHaveLength(1);
    });

    it('pagingOption skip', async () => {
      const ranking = await rankingService.postRanking(RankingInterval.MONTHLY, { offset: 1 });
      const firstRank = ranking[0];

      expect(firstRank.rank).toBe(2);
      expect(firstRank.score).toBe(1200);
      expect(firstRank.post.id).toBe(2);
    });
  });
});
