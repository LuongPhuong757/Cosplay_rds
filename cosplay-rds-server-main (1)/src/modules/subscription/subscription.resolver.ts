import { ResultResponse } from '@common/response/result.response';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@modules/user/user.model';
import { Resolver, Arg, Authorized, Int, Mutation } from 'type-graphql';
import { Service } from 'typedi';
import { SubscriptionService } from './subscription.service';

@Service()
@Resolver()
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Mutation((returns) => ResultResponse, { description: 'サブスクリプションのキャンセルを行う。' })
  @Authorized()
  async cancelSubscription(
    @GetCurrentUser() currentUser: User,
    @Arg('userId', (type) => Int) userId: number,
  ): Promise<ResultResponse> {
    return await this.subscriptionService.cancelSubscription(currentUser, userId);
  }
}
