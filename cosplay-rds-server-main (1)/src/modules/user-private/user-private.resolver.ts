import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { ResultResponse } from '@common/response/result.response';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { XApiKeyGuard } from '@guards/x-api-key-guard';
import { User } from '@modules/user/user.model';
import { IOAuth2RequestTokenResult } from 'twitter-api-v2';
import { Resolver, Query, UseMiddleware, Mutation, Arg, Authorized, Args } from 'type-graphql';
import { Service } from 'typedi';
import { CotReceiveHistoryArg } from './dto/arg/cot-receive-history.arg';
import { UpdateUserTotalCotInput } from './dto/input/update-user-total-cot';
import { VerifyTwitterAuthInput } from './dto/input/verify-twitter-auth';
import { CotReceiveHistoryResponse } from './dto/response/cot-receive-history';
import { GenerateTwitterAuthLinkResponse } from './dto/response/generate-twitter-auth-link';
import { UserWithPublicAddressResponse } from './dto/response/user-with-public-address';
import { UserPrivate } from './user-private.model';
import { UserPrivateService } from './user-private.service';

@Service()
@Resolver()
export class UserResolver {
  constructor(private readonly userPrivateService: UserPrivateService) {}

  @Query((returns) => [UserWithPublicAddressResponse], {
    description: 'public addressを持ったユーザUserPrivate一覧を返す。',
  })
  @UseMiddleware(XApiKeyGuard)
  async getUsersWithPublicAddress(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserPrivate[]> {
    return await this.userPrivateService.getUsersWithPublicAddress(pagingOptions);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'public addressに紐づくcotの数を更新する。',
  })
  @UseMiddleware(XApiKeyGuard)
  async updateUsersTotalCot(
    @Arg('input', (type) => [UpdateUserTotalCotInput])
    inputs: [UpdateUserTotalCotInput],
  ): Promise<ResultResponse> {
    return await this.userPrivateService.updateUsersTotalCot(inputs);
  }

  @Query((returns) => [CotReceiveHistoryResponse], {
    description: 'COTの投げ銭履歴一覧を返す。',
  })
  @Authorized()
  async getCotReceiveHistory(
    @GetCurrentUser() currentUser: User,
    @Args() { cotHistoryType, fromDay }: CotReceiveHistoryArg,
    @Arg('pagingOptions', (type) => PagingOptionsInput)
    pagingOptions: PagingOptionsInput,
  ): Promise<CotReceiveHistoryResponse[]> {
    return await this.userPrivateService.getCotReceiveHistory(
      cotHistoryType,
      fromDay,
      pagingOptions,
      currentUser.userPrivate?.publicAddress,
    );
  }

  @Mutation((returns) => GenerateTwitterAuthLinkResponse, {
    description: 'TwitterのOauth連携のリンクを返す。',
  })
  @Authorized()
  async generateTwitterAuthLink(
    @GetCurrentUser() currentUser: User,
  ): Promise<IOAuth2RequestTokenResult> {
    return await this.userPrivateService.generateTwitterAuthLink(currentUser.id);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'TwitterのOauth連携のリンクを返す。',
  })
  verifyTwitterOauth(
    @Arg('input', (type) => VerifyTwitterAuthInput)
    input: VerifyTwitterAuthInput,
  ): Promise<ResultResponse> {
    return this.userPrivateService.verifyTwitterOauth(input);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'TwitterのOauth連携を解除する。',
  })
  @Authorized()
  async revokeTwitterOauth(@GetCurrentUser() currentUser: User): Promise<ResultResponse> {
    return await this.userPrivateService.revokeTwitterOauth(currentUser.id);
  }
}
