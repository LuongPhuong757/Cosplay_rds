import scoreRate from '@configs/score-rate';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { ScoreLog } from './score-log.model';

@Service()
export class ScoreLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.ScoreLogFindManyArgs): Promise<ScoreLog[]> {
    return await this.prisma.scoreLog.findMany(args);
  }

  async findFirst(args: Prisma.ScoreLogFindFirstArgs): Promise<ScoreLog | null> {
    return await this.prisma.scoreLog.findFirst(args);
  }

  async cotScores(
    userId: number,
  ): Promise<{
    userScoreSum: number;
    userAllScoreSum: number;
    allScoreSum: number;
    allJPYSum: number;
  }> {
    let {
      max: { timestamp },
    } = await this.prisma.distributedTimestamp.aggregate({
      max: {
        timestamp: true,
      },
    });
    if (!timestamp) timestamp = new Date(0); // timestamp が無いとき限りなく大昔から検索
    const userScoreSum = await this.getUserScoreSum(userId, timestamp);
    const userAllScoreSum = await this.getUserScoreSum(userId, new Date(0));
    const allScoreSum = await this.getAllScoreSum(timestamp);
    const allJPYSum = await this.getAllJPYSum(timestamp);

    return { userScoreSum, userAllScoreSum, allScoreSum, allJPYSum };
  }

  async remianAndReceivedCot(userId: number): Promise<{ remain: number; received: number }> {
    const ret = await this.prisma.user.findUnique({
      select: {
        userPrivate: {
          select: {
            remainCot: true,
            receivedCot: true,
          },
        },
      },
      where: {
        id: userId,
      },
    });

    return {
      remain: ret?.userPrivate?.remainCot ?? 0,
      received: ret?.userPrivate?.receivedCot ?? 0,
    };
  }

  async getUserScoreSum(userId: number, timestamp: Date): Promise<number> {
    const {
      sum: { score },
    } = await this.prisma.scoreLog.aggregate({
      sum: {
        score: true,
      },
      where: {
        userId,
        created: {
          gt: timestamp,
        },
      },
    });

    return score ?? 0;
  }

  async getAllScoreSum(timestamp: Date): Promise<number> {
    const {
      sum: { score },
    } = await this.prisma.scoreLog.aggregate({
      sum: {
        score: true,
      },
      where: {
        created: {
          gt: timestamp,
        },
      },
    });

    return score ?? 0;
  }

  // スコアレートが変動した場合、変わる
  async getAllJPYSum(timestamp: Date): Promise<number> {
    const {
      sum: { score },
    } = await this.prisma.scoreLog.aggregate({
      sum: {
        score: true,
      },
      where: {
        created: {
          gt: timestamp,
        },
        score: {
          gte: 700, // superchat or membership must be gte 700.(100*7)
        },
      },
    });

    return (score ?? 0) / scoreRate.membership;
  }

  async getUserIdByPostId(postId: number): Promise<number> {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        userId: true,
      },
    });
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }

    return post.userId;
  }

  async createScoreLog(data: Prisma.ScoreLogCreateInput): Promise<void> {
    try {
      await this.prisma.scoreLog.create({
        data,
      });
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(
        `cannot create score log. message ${message} userId: ${data.userId} score: ${data.score}.`,
      );
    }
  }
}
