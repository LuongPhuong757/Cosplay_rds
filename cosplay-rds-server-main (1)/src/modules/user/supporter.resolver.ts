import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Resolver, Query, Arg, Int } from 'type-graphql';
import { Service } from 'typedi';
import { SupporterResponse } from './dto/response/supporter';
import { UserBaseResolver } from './user-base.resolver';
import { UserFollow } from './user-follow.model';
import { UserService } from './user.service';

@Service()
@Resolver((of) => SupporterResponse)
export class SupporterResolver extends UserBaseResolver(SupporterResponse) {
  constructor(private readonly userService: UserService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  @Query((returns) => [SupporterResponse], {
    description: 'サポーター覧を取得する。',
  })
  async getSupporters(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserFollow[]> {
    return await this.userService.getSupporters(userId, pagingOptions);
  }
}
