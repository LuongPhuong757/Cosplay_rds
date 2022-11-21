import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@modules/user/user.model';
import { Authorized, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import { CotScoresResponse } from './dto/response/cot-scores';
import { MonthlyScoreResponse } from './dto/response/monthly-score';
import { ScoreLogService } from './score-log.service';

@Service()
@Resolver((of) => CotScoresResponse)
export class ScoreLogResolver {
  constructor(private readonly scoreLogService: ScoreLogService) {}

  @Query((returns) => CotScoresResponse, { description: 'Cot Scores Response を取得する' })
  async cotScores(@GetCurrentUser() { id }: User): Promise<CotScoresResponse> {
    return await this.scoreLogService.cotScores(id);
  }

  @Query((returns) => [MonthlyScoreResponse], { description: '月ごとのScoreを取得する' })
  @Authorized()
  async getMonthlyScores(@GetCurrentUser() { id }: User): Promise<MonthlyScoreResponse[]> {
    return await this.scoreLogService.getMonthlyScores(id);
  }
}
