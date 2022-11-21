import dayjs from 'dayjs';
import { toYearMonth } from '../../../src/common/util/to-year-month';
import scoreRate from '../../../src/configs/score-rate';
import { Post } from '../../../src/modules/post/post.model';
import { ScoreLog } from '../../../src/modules/score-log/score-log.model';
import { ScoreLogRepository } from '../../../src/modules/score-log/score-log.repository';
import { ScoreLogService } from '../../../src/modules/score-log/score-log.service';
import { User } from '../../../src/modules/user/user.model';
import { setCots, setFutureDistributedTimestamp } from '../../helper';
import { prisma } from '../../prisma-instance';

describe('ScoreLogService', () => {
  let scoreLogService: ScoreLogService;
  let scoreLogRepository: ScoreLogRepository;
  let post: Post;

  beforeAll(async () => {
    scoreLogRepository = new ScoreLogRepository(prisma);
    scoreLogService = new ScoreLogService(scoreLogRepository);
    post = ((await prisma.post.findMany()) as Post[])[0];
  });

  describe('fav', () => {
    it('add fav score.', async () => {
      const prevScoreLogCount = await prisma.scoreLog.count();
      await scoreLogService.fav(post.id);
      const scoreLogCount = await prisma.scoreLog.count();
      const latest = (await prisma.scoreLog.findFirst({
        orderBy: { created: 'desc' },
      })) as ScoreLog;

      expect(prevScoreLogCount).not.toBe(scoreLogCount);
      expect(latest.score).toBe(scoreRate.fav);
    });

    it('add negative fav score.', async () => {
      const prevScoreLogCount = await prisma.scoreLog.count();
      await scoreLogService.fav(post.id, false);
      const scoreLogCount = await prisma.scoreLog.count();
      const latest = (await prisma.scoreLog.findFirst({
        orderBy: { created: 'desc' },
      })) as ScoreLog;

      expect(prevScoreLogCount).not.toBe(scoreLogCount);
      expect(latest.score).toBe(-scoreRate.fav);
    });
  });

  describe('comment', () => {
    it('add comment score.', async () => {
      const prevScoreLogCount = await prisma.scoreLog.count();
      await scoreLogService.comment(post.id);
      const scoreLogCount = await prisma.scoreLog.count();
      const latest = (await prisma.scoreLog.findFirst({
        orderBy: { created: 'desc' },
      })) as ScoreLog;

      expect(prevScoreLogCount).not.toBe(scoreLogCount);
      expect(latest.score).toBe(scoreRate.comment);
    });

    it('add negative comment score.', async () => {
      const prevScoreLogCount = await prisma.scoreLog.count();
      await scoreLogService.comment(post.id, false);
      const scoreLogCount = await prisma.scoreLog.count();
      const latest = (await prisma.scoreLog.findFirst({
        orderBy: { created: 'desc' },
      })) as ScoreLog;

      expect(prevScoreLogCount).not.toBe(scoreLogCount);
      expect(latest.score).toBe(-scoreRate.comment);
    });
  });

  describe('superchat', () => {
    it('add superchat score.', async () => {
      const user = (await prisma.user.findFirst()) as User;
      const prevScoreLogCount = await prisma.scoreLog.count();
      await scoreLogService.superchat(post.id, user.id, 100, 'paymentIntentId');
      const scoreLogCount = await prisma.scoreLog.count();
      const latest = (await prisma.scoreLog.findFirst({
        orderBy: { created: 'desc' },
      })) as ScoreLog;

      expect(prevScoreLogCount).not.toBe(scoreLogCount);
      expect(latest.score).toBe(scoreRate.superchat * 100);
    });
  });

  describe('membership', () => {
    it('add membership score.', async () => {
      const firstUser = ((await prisma.user.findMany()) as User[])[0];
      const secondUser = ((await prisma.user.findMany()) as User[])[1];
      const prevScoreLogCount = await prisma.scoreLog.count();
      await scoreLogService.membership(firstUser.id, secondUser.id, 100);
      const scoreLogCount = await prisma.scoreLog.count();
      const latest = (await prisma.scoreLog.findFirst({
        orderBy: { created: 'desc' },
      })) as ScoreLog;

      expect(prevScoreLogCount).not.toBe(scoreLogCount);
      expect(latest.score).toBe(scoreRate.membership * 100);
    });
  });

  xdescribe('cotScores', () => {
    it('get cot scores', async () => {
      const user = (await prisma.user.findFirst()) as User;
      const cotScores = await scoreLogService.cotScores(user.id);

      // firstUser has:
      // +- 0 fav
      // +- 0 comment
      // 100 jpy superchat * 7
      // 100 jpy membership * 7
      // = 1400 C-SCORE.

      // expectedJPY:
      // 200[jpy] * (1400/1400) = 200[jpy]

      expect(cotScores.monthlyScore).toBe(1400);
      expect(cotScores.expectedJpy).toBe(200);
      expect(cotScores.allScore).toBe(1400);
      expect(cotScores.receivedCot).toBe(0);
      expect(cotScores.remainCot).toBe(0);
    });

    it('get cot scoresa after distributed', async () => {
      const user = (await prisma.user.findFirst()) as User;
      await setFutureDistributedTimestamp();
      await setCots(user.id, 0.01, 0.02);

      const cotScores = await scoreLogService.cotScores(user.id);

      // firstUser has:
      // = 0 C-SCORE.

      // expectedJPY:
      // 0[jpy] * (0/0) = 0[jpy]

      expect(cotScores.monthlyScore).toBe(0);
      expect(cotScores.expectedJpy).toBe(0);
      expect(cotScores.allScore).toBe(1400);
      expect(cotScores.receivedCot).toBe(0.02);
      expect(cotScores.remainCot).toBe(0.01);
    });
  });

  describe('getMonthlyScores', () => {
    let monthlyUser: User;

    beforeAll(async () => {
      monthlyUser = await prisma.user.create({
        data: {
          auth0Id: 'ms_auth0Id',
          name: 'ms_name',
          account: 'ms_account',
          icon: 'ms_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: monthlyUser.id,
          score: 100,
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: monthlyUser.id,
          score: 50,
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: monthlyUser.id,
          score: 10,
          created: dayjs(new Date()).subtract(1, 'month').toDate(),
        },
      });
      await prisma.scoreLog.create({
        data: {
          userId: monthlyUser.id,
          score: 10,
          created: dayjs(new Date()).subtract(1, 'year').toDate(),
        },
      });
    });

    it('returns monthly scores.', async () => {
      const monthlyScores = await scoreLogService.getMonthlyScores(monthlyUser.id);

      const currentMonth = toYearMonth(new Date());
      const lastMonth = toYearMonth(dayjs(new Date()).subtract(1, 'month').toDate());

      expect(monthlyScores).toHaveLength(2);
      expect(monthlyScores.map((score) => score.month)).toEqual([currentMonth, lastMonth]);
      expect(monthlyScores.filter((score) => score.month === currentMonth)[0].score).toEqual(150);
    });
  });
});
