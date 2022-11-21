import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { PostRankig } from '@modules/post/post-ranking.model';
import { UserResponse } from '@modules/user/dto/response/user';
import { UserBaseResolver } from '@modules/user/user-base.resolver';
import { UserRankingNew } from '@modules/user/user-ranking.model';
import { User } from '@modules/user/user.model';
import { Resolver, Query, Arg, Int } from 'type-graphql';
import { Service } from 'typedi';
import { CotHolderRankingResponse } from './dto/response/cot-holder-ranking';
import { EventRankingResponse, PostRankingResponse } from './dto/response/post-ranking';
import { UserRankingResponse } from './dto/response/user-ranking';
import { RankingInterval } from './enum/ranking-interval';
import { rankingEventUser, RankingService } from './ranking.service';

@Service()
@Resolver((of) => PostRankingResponse)
export class RankingResolver extends UserBaseResolver(UserResponse) {
  constructor(private readonly rankingService: RankingService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  @Query((returns) => EventRankingResponse, { description: 'イベントランキングを取得する。' })
  async eventRanking(
    @Arg('eventId', (type) => Int) eventId: number,
    @Arg('pagingOptions', { nullable: true }) pagingOptions?: PagingOptionsInput,
    @GetCurrentUser() currentUser?: User,
  ): Promise<{ posts: PostRankig[] | []; users: rankingEventUser[] | [] }> {
    return await this.rankingService.eventRanking(eventId, pagingOptions, currentUser);
  }

  @Query((returns) => [UserRankingResponse], { description: 'ユーザランキングを取得する。' })
  async userRanking(
    @Arg('interval', (type) => RankingInterval) interval: RankingInterval,
    @Arg('pagingOptions', { nullable: true }) pagingOptions?: PagingOptionsInput,
    @GetCurrentUser() currentUser?: User,
  ): Promise<UserRankingNew[]> {
    return await this.rankingService.userRankingNew(interval, pagingOptions, currentUser);
  }

  @Query((returns) => [PostRankingResponse], { description: '投稿ランキングを取得する。' })
  async postRanking(
    @Arg('interval', (type) => RankingInterval) interval: RankingInterval,
    @Arg('pagingOptions', { nullable: true }) pagingOptions?: PagingOptionsInput,
    @GetCurrentUser() currentUser?: User,
  ): Promise<PostRankig[]> {
    return await this.rankingService.postRanking(interval, pagingOptions, currentUser);
  }

  @Query((returns) => [CotHolderRankingResponse], {
    description: 'COTのHolderランキングを取得する。',
  })
  async cotHolderRanking(
    @Arg('pagingOptions', { nullable: true }) pagingOptions?: PagingOptionsInput,
  ): Promise<CotHolderRankingResponse[]> {
    return await this.rankingService.cotHolderRanking(pagingOptions);
  }
}
