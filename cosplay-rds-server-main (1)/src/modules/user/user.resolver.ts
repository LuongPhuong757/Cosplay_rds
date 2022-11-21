import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { ResultResponse } from '@common/response/result.response';
import { GetAuth0Id } from '@decorators/auth0-id.decorator';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { Auth0IdGuard } from '@guards/auth0-id.guard';
import { XApiKeyGuard } from '@guards/x-api-key-guard';
import { UserResponseNewCosplayer } from '@modules/user/dto/response/user-new-cosplayer';
import { Resolver, Query, Arg, Mutation, UseMiddleware, Authorized, Int } from 'type-graphql';
import { Service } from 'typedi';
import { CreateUserAfterRegistrationInput } from './dto/input/create-user-after-registration';
import { LinkAccountInput } from './dto/input/link-account';
import { SocialActionInput } from './dto/input/social-action';
import { SyncEmailVerifiedInput } from './dto/input/sync-email-verified';
import { UserResponse } from './dto/response/user';
import { UserBaseResolver } from './user-base.resolver';
import { UserFollow } from './user-follow.model';
import { User, UserNewCosplayer } from './user.model';
import { UserService } from './user.service';

@Service()
@Resolver((of) => UserResponse)
export class UserResolver extends UserBaseResolver(UserResponse) {
  constructor(private readonly userService: UserService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  @Query((returns) => [UserResponse], { description: 'アカウント検索結果一覧を取得する。' })
  async users(
    @Arg('query', (type) => String) query: string,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<User[]> {
    return await this.userService.users(query, pagingOptions);
  }

  @Query((returns) => [UserResponse], { description: 'アカウント検索結果一覧を取得する。' })
  async usersIsCosplayer(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<User[]> {
    return await this.userService.usersIsCosplayer(pagingOptions);
  }

  @Query((returns) => [UserResponseNewCosplayer], {
    description: '新しいアカウントの結果のリストを取得します。',
  })
  async newCosplayers(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserNewCosplayer[]> {
    return await this.userService.newUsers(pagingOptions, currentUser);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'Auth0アカウント作成後にRDSに連携する。',
  })
  @UseMiddleware(XApiKeyGuard)
  async createUserAfterRegistration(
    @Arg('input', (type) => CreateUserAfterRegistrationInput)
    createUserAfterRegistrationInput: CreateUserAfterRegistrationInput,
  ): Promise<ResultResponse> {
    return await this.userService.createUserAfterRegistration(createUserAfterRegistrationInput);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'Auth0アカウントの認証済みメールアドレスをRDSに連携する。',
  })
  @UseMiddleware(XApiKeyGuard)
  async syncEmailVerified(
    @Arg('input', (type) => SyncEmailVerifiedInput)
    input: SyncEmailVerifiedInput,
  ): Promise<ResultResponse> {
    return await this.userService.syncEmailVerified(input);
  }

  // ログインしている場合は、こちらを呼ぶ
  // ログインしていない場合は、Auth0Hook経由でメールアドレスをSyncさせる
  @Mutation((returns) => ResultResponse, {
    description:
      'パスワード認証でメールを認証した後に、ログイン状態の場合はメールをRDS側に反映させる。',
  })
  @Authorized()
  async applyVerifiedEmail(@GetCurrentUser() currentUser: User): Promise<ResultResponse> {
    return await this.userService.applyVerifiedEmail(currentUser);
  }

  @Query((returns) => [UserResponse], {
    description: 'ブロックしているユーザ一覧を取得する。',
  })
  @Authorized()
  async blocks(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserFollow[]> {
    return await this.userService.blocks(currentUser, pagingOptions);
  }

  @Mutation((returns) => Int, { description: 'ユーザをブロックする。' })
  @Authorized()
  async createBlock(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => SocialActionInput) socialActionInput: SocialActionInput,
  ): Promise<number> {
    return await this.userService.createBlock(currentUser, socialActionInput);
  }

  @Mutation((returns) => Int, { description: 'ユーザのブロックを解除する。' })
  @Authorized()
  async deleteBlock(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => SocialActionInput) socialActionInput: SocialActionInput,
  ): Promise<number> {
    return await this.userService.deleteBlock(currentUser, socialActionInput);
  }

  @Query((returns) => [UserResponse], {
    description: 'Auth0ユーザがリンクできるアカウント一覧を返す。',
  })
  @UseMiddleware(Auth0IdGuard)
  async getLinkAccounts(@GetAuth0Id() auth0Id: string): Promise<User[]> {
    return await this.userService.getLinkAccounts(auth0Id);
  }

  @Query((returns) => [UserResponse], {
    description: 'Auth0のhooks関数から連携できるアカウント一覧を取得する。',
  })
  @UseMiddleware(XApiKeyGuard)
  async getLinkAccountsByAuth0(
    @Arg('email', (type) => String) email: string,
    @Arg('auth0Id', (type) => String) auth0Id: string,
  ): Promise<User[]> {
    return await this.userService.getLinkAccountsByAuth0(email, auth0Id);
  }

  @Query((returns) => [UserResponse], {
    description: 'NFT返礼コスプレイヤーのリストを返す。',
  })
  async getNftDistributedUsers(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<User[]> {
    return await this.userService.getNftDistributedUsers(pagingOptions);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'Auth0のユーザ同士のリンクを行う。',
  })
  @UseMiddleware(Auth0IdGuard)
  linkAccount(
    @GetAuth0Id() auth0Id: string,
    @Arg('input', (type) => LinkAccountInput) { userId }: LinkAccountInput,
  ): Promise<ResultResponse> {
    return this.userService.linkAccount(auth0Id, userId);
  }
}
