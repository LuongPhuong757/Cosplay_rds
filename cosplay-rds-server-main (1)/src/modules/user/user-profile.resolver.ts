import { ResultResponse } from '@common/response/result.response';
import { extractIds } from '@common/util/extract-ids';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { BlockUserGuard } from '@guards/block-user.guard';
import { GetBlockUsers } from '@middlewares/get-block-users.middleware';
import { UserProfileRankingResponse } from '@modules/ranking/dto/response/user-profile-ranking';
import {
  Resolver,
  Query,
  Arg,
  UseMiddleware,
  Authorized,
  Int,
  FieldResolver,
  Root,
  Mutation,
} from 'type-graphql';
import { Service } from 'typedi';
import { UpdateEmailInput } from './dto/input/update-email';
import { VerifyEmailInput } from './dto/input/verify-email';
import { GetPublicAddressResponse } from './dto/response/get-public-address';
import { SupporterResponse } from './dto/response/supporter';
import { UserProfileResponse } from './dto/response/user-profile';
import { UserBaseResolver } from './user-base.resolver';
import { User } from './user.model';
import { UserService } from './user.service';

@Service()
@Resolver((of) => UserProfileResponse)
export class UserProfileResolver extends UserBaseResolver(UserProfileResponse) {
  constructor(private readonly userService: UserService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  @Query((returns) => UserProfileResponse, {
    description: 'userIdかアカウント名でユーザのプロフィール情報を取得する。',
  })
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async user(
    @Arg('userId', (type) => Int, { nullable: true }) userId?: number,
    @Arg('account', (type) => String, { nullable: true }) account?: string,
    @GetCurrentUser() currentUser?: User,
  ): Promise<User> {
    return await this.userService.user(userId, account, currentUser);
  }

  @Query((returns) => UserProfileResponse, {
    description: '自分のプロフィール情報を取得する。',
  })
  @Authorized()
  async me(@GetCurrentUser() { id }: User): Promise<User> {
    return await this.userService.user(id);
  }

  @Query((returns) => GetPublicAddressResponse, {
    description: 'PublicAddressを取得する。',
  })
  async getPublicAddress(
    @Arg('userId', (type) => Int) userId: number,
  ): Promise<GetPublicAddressResponse> {
    return await this.userService.getPublicAddress(userId);
  }

  @Mutation((returns) => ResultResponse, { description: 'メールアドレスを更新する。' })
  @Authorized()
  async updateEmail(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => UpdateEmailInput) input: UpdateEmailInput,
  ): Promise<ResultResponse> {
    return await this.userService.updateEmail(currentUser, input);
  }

  @Mutation((returns) => ResultResponse, { description: 'メール認証を行う。' })
  async verifyEmail(
    @Arg('input', (type) => VerifyEmailInput) input: VerifyEmailInput,
  ): Promise<ResultResponse> {
    return await this.userService.verifyEmail(input);
  }

  @FieldResolver((returns) => [SupporterResponse], {
    description: 'サポータ一覧を返すFieldResolver。',
  })
  supporters(@Root() user: User & { supporters: User[] }): User[] {
    return user.supporters;
  }

  @FieldResolver((returns) => Int, {
    description: '投稿画像・動画の総数を返すFieldResolver。',
  })
  totalPosts(@Root() user: User & { postCount: number }): number {
    return user.postCount;
  }

  @FieldResolver((returns) => Int, {
    description: 'フォローしているユーザの総数を返すFieldResolver。',
  })
  totalFollows(@Root() user: User & { followingCount: number }): number {
    return user.followingCount;
  }

  @FieldResolver((returns) => Int, {
    description: 'フォローされているユーザの総数を返すFieldResolver。',
  })
  totalFollowers(@Root() user: User & { followedByCount: number }): number {
    return user.followedByCount;
  }

  @FieldResolver((returns) => UserProfileRankingResponse, {
    description: 'ランキング情報を返すFieldResolver。',
  })
  ranking(
    @Root() user: User & { profileRanking: { [key: string]: number | null } },
  ): UserProfileRankingResponse {
    const { profileRanking } = user;
    if (!profileRanking) {
      return {
        weekly: 0,
        all: 0,
        best: 0,
      };
    }
    const { weekly, all, best } = profileRanking;

    return {
      weekly: weekly ?? 0,
      all: all ?? 0,
      best: best ?? 0,
    };
  }

  @FieldResolver((returns) => Boolean, {
    description: 'ユーザをブロックしているかどうかを返すFieldResolver。',
  })
  isBlocking(@Root() user: User, @GetCurrentUser() currentUser?: User): boolean {
    if (!currentUser) return false;

    const { id } = user;
    const { blocking } = currentUser;
    if (!blocking) return false;

    return blocking?.map(extractIds).indexOf(id) !== -1;
  }
}
