import { getLimitOffsetSql } from '@common/pagination/get-limit-offset-sql';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { getIntervalDate } from '@common/repository/get-interval-date';
import { getWhereInValues } from '@common/repository/get-where-in-values';
import { ScoreLog } from '@modules/score-log/score-log.model';
import { User } from '@modules/user/user.model';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { RankingInterval } from './enum/ranking-interval';

@Service()
export class RankingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEventScoreLogs(
    postIds: number[],
    pagingOptions?: PagingOptionsInput,
  ): Promise<(Omit<ScoreLog, 'postId'> & { totalScore: number; rank: number; postId: number })[]> {
    const limitOffsetSql = getLimitOffsetSql(pagingOptions);
    const whereInValues = getWhereInValues(postIds);

    const scoreLogs = await this.prisma.$queryRaw<
      (Omit<ScoreLog, 'postId'> & { totalScore: number; rank: number; postId: number })[]
    >(
      `
      select
        rank() over(order by SUM("x"."score") desc) as "rank",
        "x"."postId",
        SUM("x"."score") AS "totalScore"
      from(
        SELECT "postId", "userId", "score" FROM "public"."ScoreLog" WHERE "postId" IN (${whereInValues})
      ) as "x"
      join "public"."User" as "u"
      on "x"."userId" = "u"."id"
      where "u"."isBan" != true
      GROUP BY "x"."postId" ORDER BY "totalScore" DESC ${limitOffsetSql};
    `,
    );
    if (scoreLogs) {
      let countScoreLogs = scoreLogs.length;
      let rankCurren: number = scoreLogs[countScoreLogs - 1].rank;
      const idPosts: number[] = [];
      const limit = pagingOptions?.limit;
      // eslint-disable-next-line @typescript-eslint/no-for-in-array
      for (const i in scoreLogs) {
        if (postIds.includes(scoreLogs[i].postId)) {
          idPosts.push(scoreLogs[i].postId);
        }
      }
      const overlap = postIds.filter((v) => {
        return idPosts.includes(v) === false;
      });
      for (const i of overlap) {
        if (countScoreLogs === limit) {
          break;
        }
        const rank = (rankCurren += 1);
        const dataPost = {
          rank: rank,
          postId: i,
          totalScore: 0,
        };
        countScoreLogs += 1;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        scoreLogs.push(dataPost);
      }
    }

    return scoreLogs;
  }

  async findPostScoreLogs(
    interval: RankingInterval | 'all',
    pagingOptions?: PagingOptionsInput,
  ): Promise<(Omit<ScoreLog, 'postId'> & { totalScore: number; rank: number; postId: number })[]> {
    const intervalDate = getIntervalDate(interval);
    const limitOffsetSql = getLimitOffsetSql(pagingOptions);

    const scoreLogs = await this.prisma.$queryRaw<
      (Omit<ScoreLog, 'postId'> & { totalScore: number; rank: number; postId: number })[]
    >(
      `
      select
        rank() over(order by SUM("x"."score") desc) as "rank",
        "x"."postId",
        SUM("x"."score") AS "totalScore"
      from(
        SELECT "postId", "userId", "score" FROM "public"."ScoreLog" WHERE created::date >= date '${intervalDate}' AND "postId" IS NOT NULL
      ) as "x"
      join "public"."User" as "u"
      on "x"."userId" = "u"."id"
      where "u"."isBan" != true
      GROUP BY "x"."postId" ORDER BY "totalScore" DESC ${limitOffsetSql};
      `,
    );

    return scoreLogs;
  }

  async findUserScoreLogsRank(
    interval: RankingInterval | 'all',
    pagingOptions?: PagingOptionsInput,
  ): Promise<
    (Pick<ScoreLog, 'userId'> & {
      totalScore: number;
      totalPosts: number;
      rank: number;
      all: number | null;
      weekly: number | null;
      best: number | null;
      publicAddress: string | null;
      'nc.id': number | null;
      'uc.targetCosplayer': string | null;
      'uc.targetERC721': string | null;
      'uc.lowerCOT': string | null;
      'uc.userId': number | null;
      'nc.title': string;
      'nc.description': string;
      'nc.start': string | null;
      'nc.end': string | null;
      'nc.contract': string | null;
      'nc.userId': number | null;
      'nc.emissionRateTable': Record<string, number> | null;
    })[]
  > {
    const intervalDate = getIntervalDate(interval);
    const limitOffsetSql = getLimitOffsetSql(pagingOptions);
    const nowDate = new Date().toISOString(); // PostgreSQL supports ISO 8601 datetime format

    const scoreLogs = await this.prisma.$queryRaw<
      (Pick<ScoreLog, 'userId'> & {
        totalScore: number;
        totalPosts: number | 0;
        rank: number;
        all: number | null;
        weekly: number | null;
        best: number | null;
        publicAddress: string | null;
        'nc.id': number | null;
        'nc.title': string;
        'nc.description': string;
        'nc.start': string | null;
        'nc.end': string | null;
        'nc.contract': string | null;
        'nc.userId': number | null;
        'uc.targetCosplayer': string | null;
        'uc.targetERC721': string | null;
        'uc.lowerCOT': string | null;
        'uc.userId': number | null;
        'nc.emissionRateTable': Record<string, number> | null;
      })[]
    >(
      `
      select rank() over(order by "x"."totalScore" desc) as "rank", "x".*,
             "ur"."all" as "all", "ur"."weekly" as "weekly", "ur"."best" as "best", "up"."publicAddress",
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
             "nc"."emissionRateTable" as "nc.emissionRateTable",
      "uPt"."totalPosts" as "totalPosts"
      from (
        SELECT "userId", SUM(score) AS "totalScore" 
        FROM "public"."ScoreLog" 
        where created::date >= date '${intervalDate}' 
        GROUP BY "userId"
      ) as "x"
      join "public"."User" as "u"
      on "x"."userId" = "u"."id"
      left join (
          select
          distinct("u".*),
          count(p.*) over(partition by "u".id) as "totalPosts"
          from "public"."User" as "u"
          left outer join "public"."Post" as "p"
          on "u"."id" = "p"."userId"
      ) as "uPt"
      on "u"."id" = "uPt"."id"
      left join "public"."UserProfileRanking" as "ur"
      on "ur"."userId" = "u"."id"
      left join "public"."UserPrivate" as "up"
      on "up"."userId" = "u"."id"
      left outer join "public"."COTTipNFTDistributionState" as "uc"
      on "u"."id" = "uc"."userId"
      left outer join (
          select *
          from "public"."NFTCampaign"
          where '${nowDate}' > "start" and '${nowDate}' < "end"
      ) as "nc"
        on "u"."id" = "nc"."userId"
      where "u"."isBan" != true
      ORDER BY "totalScore" DESC ${limitOffsetSql};
    `,
    );

    return scoreLogs;
  }

  async findUserScoreLogs(
    interval: RankingInterval | 'all',
    pagingOptions?: PagingOptionsInput,
  ): Promise<(Pick<ScoreLog, 'userId'> & { totalScore: number; rank: number })[]> {
    const intervalDate = getIntervalDate(interval);
    const limitOffsetSql = getLimitOffsetSql(pagingOptions);

    const scoreLogs = await this.prisma.$queryRaw<
      (Pick<ScoreLog, 'userId'> & { totalScore: number; rank: number })[]
    >(
      `
      select rank() over(order by "x"."totalScore" desc) as "rank", "x".*
      from (
        SELECT "userId", SUM(score) AS "totalScore" FROM "public"."ScoreLog" where created::date >= date '${intervalDate}' GROUP BY "userId"
      ) as "x"
      join "public"."User" as "u"
      on "x"."userId" = "u"."id"
      where "u"."isBan" != true
      ORDER BY "totalScore" DESC ${limitOffsetSql};
    `,
    );

    return scoreLogs;
  }

  async findUsersWithFollowsCount(
    userIds: number[],
  ): Promise<
    (User & { followingCount: number; followedByCount: number; publicAddress: string | null })[]
  > {
    if (userIds.length === 0) return [];
    const whereInUserIds = getWhereInValues(userIds);

    const users = await this.prisma.$queryRaw<
      (User & { followingCount: number; followedByCount: number; publicAddress: string | null })[]
    >(`
    select
      u.*,
      coalesce("ufa"."followingCount", 0) as "followingCount",
      coalesce("ufb"."followedByCount", 0) as "followedByCount"
    from "public"."User" as u
    left outer join (
      select "A", count(*) as "followingCount"
      from "public"."_UserFollows"
      group by "A"
    ) as ufa
    on u.id = ufa."A"
    left outer join (
      select "B", count(*) as "followedByCount"
      from "public"."_UserFollows"
      group by "B"
    ) as ufb
    on u.id = ufb."B"
    where id in (${whereInUserIds});
    `);

    return users;
  }
}
