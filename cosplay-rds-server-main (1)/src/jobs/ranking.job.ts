import { getCurrentTime } from '@common/util/current-time';
import { extractUserIds } from '@common/util/extract-ids';
import { RankingInterval } from '@modules/ranking/enum/ranking-interval';
import { RankingService } from '@modules/ranking/ranking.service';
import { User } from '@modules/user/user.model';
import { UserProfileRanking } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Container } from 'typedi';

const RANKIG_JOB_PAGING_OPTIONS = {
  limit: 1000, // 1000人まで取得
};

class RankingJob {
  rankingService: RankingService;
  prismaService: PrismaService;

  constructor() {
    this.rankingService = Container.get(RankingService);
    this.prismaService = Container.get(PrismaService);
  }

  async processJob(): Promise<void> {
    console.log(`start create ranking job. ${getCurrentTime()}`);

    try {
      const resultAll = await this.rankingService.userRanking('all', RANKIG_JOB_PAGING_OPTIONS);
      const resultWeekly = await this.rankingService.userRanking(
        RankingInterval.WEEKLY,
        RANKIG_JOB_PAGING_OPTIONS,
      );
      const resultDaily = await this.rankingService.userRanking(
        RankingInterval.MONTHLY,
        RANKIG_JOB_PAGING_OPTIONS,
      );
      const allInsertValues = this.getInsertRankingValues(resultAll.map(this.extractUserIdAndRank));
      const weeklyInsertValues = this.getInsertRankingValues(
        resultWeekly.map(this.extractUserIdAndRank),
      );
      const bestInsertValues = this.getInsertRankingValues(
        resultDaily.map(this.extractUserIdAndRank),
      );
      if (allInsertValues) {
        await this.prismaService.$executeRaw(
          `INSERT INTO "public"."UserProfileRanking" ("userId", "all") VALUES ${allInsertValues} ON CONFLICT ("userId") DO UPDATE SET "all" = excluded.all;`,
        );
      }

      if (weeklyInsertValues) {
        await this.prismaService.$executeRaw(
          `INSERT INTO "public"."UserProfileRanking" ("userId", "weekly") VALUES ${weeklyInsertValues} ON CONFLICT ("userId") DO UPDATE SET "weekly" = excluded.weekly;`,
        );
      }

      if (bestInsertValues) {
        await this.prismaService.$executeRaw(
          `INSERT INTO "public"."UserProfileRanking" ("userId", "best") VALUES ${bestInsertValues} ON CONFLICT ("userId") DO UPDATE SET "best" = excluded.best;`,
        );
      }
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`create ranking job cannot be processed. message: ${message}.`);
    }

    console.log(`finish create ranking job. ${getCurrentTime()}`);
  }

  async getBestInsertValues(
    resultDaily: Array<{
      user: User;
      rank: number;
      score: number;
      totalFollowing: number;
      totalFollowedBy: number;
    }>,
  ): Promise<string | null> {
    const mapped: { userId: number; rank: number }[] = resultDaily.map(this.extractUserIdAndRank);

    const bestUserProfileRankings: Pick<
      UserProfileRanking,
      'userId' | 'best'
    >[] = await this.prismaService.userProfileRanking.findMany({
      where: {
        userId: {
          in: mapped.map(extractUserIds),
        },
      },
      select: {
        userId: true,
        best: true,
      },
    });

    const filterBestRankings = mapped.filter(({ userId, rank }) => {
      const finded = bestUserProfileRankings.find((ranking) => ranking.userId === userId);
      if (!finded) return true;
      if (!finded.best) return true;

      return rank < finded.best; // 小さい方
    });

    return this.getInsertRankingValues(filterBestRankings);
  }

  private extractUserIdAndRank = (ranking: {
    user: User;
    rank: number;
    score: number;
    totalFollowing: number;
    totalFollowedBy: number;
  }): { userId: number; rank: number } => {
    return {
      userId: ranking.user.id,
      rank: ranking.rank,
    };
  };

  private getInsertRankingValues = (
    rankings: { userId: number; rank: number }[],
  ): string | null => {
    if (rankings.length === 0) return null;

    return rankings.map((ranking) => `(${ranking.userId}, ${ranking.rank})`).join(',');
  };
}

export const rankingJob = new RankingJob();
