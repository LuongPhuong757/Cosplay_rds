import 'reflect-metadata';
import { rankingJob } from '../../src/jobs/ranking.job';
import { User } from '../../src/modules/user/user.model';
import { prisma } from '../prisma-instance';

describe('RankingJob', () => {
  const setup = async () => {
    const firstUser = ((await prisma.user.findMany()) as User[])[0];
    const secondUser = ((await prisma.user.findMany()) as User[])[1];
    const thirdUser = ((await prisma.user.findMany()) as User[])[2];

    await prisma.scoreLog.create({
      data: {
        userId: firstUser.id,
        score: 30000,
      },
    });

    await prisma.scoreLog.create({
      data: {
        userId: secondUser.id,
        score: 20000,
      },
    });

    await prisma.scoreLog.create({
      data: {
        userId: thirdUser.id,
        score: 10000,
      },
    });

    // firstUserのrankingが書き換わることを期待。
    await prisma.userProfileRanking.create({
      data: {
        userId: firstUser.id,
        all: 20000,
        best: 10000,
        weekly: 30000,
      },
    });
  };

  beforeAll(async () => {
    await setup();
  });

  describe('processJob', () => {
    it('chnage ranking.', async () => {
      await rankingJob.processJob();
      const userProfileRankings = await prisma.userProfileRanking.findMany();
      const firstRanking = userProfileRankings[0];

      expect(userProfileRankings.length).toBeGreaterThanOrEqual(3);
      expect(firstRanking.all).not.toBe(20000);
      expect(firstRanking.best).not.toBe(10000);
      expect(firstRanking.weekly).not.toBe(30000);
    });
  });
});
