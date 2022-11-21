import { toYearMonth } from '@common/util/to-year-month';
import scoreRate from '@configs/score-rate';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { Service } from 'typedi';
import { CotScoresResponse } from './dto/response/cot-scores';
import { ScoreLog } from './score-log.model';
import { ScoreLogRepository } from './score-log.repository';

@Service()
export class ScoreLogService {
  constructor(private readonly scoreLogRepository: ScoreLogRepository) {}

  async cotScores(userId: number): Promise<CotScoresResponse> {
    const {
      userScoreSum,
      userAllScoreSum,
      allScoreSum,
      allJPYSum,
    } = await this.scoreLogRepository.cotScores(userId);
    const addedJPY = allScoreSum ? (allJPYSum * userScoreSum) / allScoreSum : 0;
    const { remain, received } = await this.scoreLogRepository.remianAndReceivedCot(userId);

    return {
      monthlyScore: userScoreSum,
      expectedJpy: addedJPY,
      allScore: userAllScoreSum,
      receivedCot: received,
      remainCot: remain,
    };
  }

  async getMonthlyScores(userId: number): Promise<{ month: string; score: number }[]> {
    const scoreLogs = await this.scoreLogRepository.findMany({
      select: {
        score: true,
        created: true,
      },
      where: {
        userId,
        created: {
          gt: dayjs().subtract(1, 'years').toDate(),
        },
      },
    });

    return scoreLogs.reduce((result: { month: string; score: number }[], current) => {
      const element = result.find((item) => item.month === toYearMonth(current.created));

      if (element) {
        element.score += current.score;
      } else {
        result.push({
          month: toYearMonth(current.created),
          score: current.score,
        });
      }

      return result;
    }, []);
  }

  async fav(postId: number, add = true): Promise<void> {
    const score = add ? scoreRate.fav : -scoreRate.fav;
    const userId = await this.scoreLogRepository.getUserIdByPostId(postId);
    const input = {
      userId,
      postId,
      score,
    };

    await this.scoreLogRepository.createScoreLog(input);
  }

  async comment(postId: number, add = true): Promise<void> {
    const score = add ? scoreRate.comment : -scoreRate.comment;
    const userId = await this.scoreLogRepository.getUserIdByPostId(postId);
    const input = {
      userId,
      postId,
      score,
    };

    await this.scoreLogRepository.createScoreLog(input);
  }

  async superchat(
    postId: number,
    senderId: number,
    amount: number,
    paymentIntentId: string,
  ): Promise<void> {
    const score = amount * scoreRate.superchat;
    const receivedId = await this.scoreLogRepository.getUserIdByPostId(postId);
    const input = {
      userId: receivedId,
      postId,
      senderId,
      score,
      paymentIntentId,
      jpy: score,
    };

    await this.scoreLogRepository.createScoreLog(input);
  }

  async membership(receivedId: number, senderId: number, amount: number): Promise<void> {
    const score = amount * scoreRate.membership;
    const input = {
      userId: receivedId,
      senderId,
      score,
      jpy: score,
    };

    await this.scoreLogRepository.createScoreLog(input);
  }

  async findFirst(args: Prisma.ScoreLogFindFirstArgs): Promise<ScoreLog | null> {
    return await this.scoreLogRepository.findFirst(args);
  }
}
