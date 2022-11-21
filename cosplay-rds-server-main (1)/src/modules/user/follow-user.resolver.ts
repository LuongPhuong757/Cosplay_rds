import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { BlockUserGuard } from '@guards/block-user.guard';
import { GetBlockUsers } from '@middlewares/get-block-users.middleware';
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  UseMiddleware,
  Authorized,
  Int,
  FieldResolver,
  Root,
} from 'type-graphql';
import { Service } from 'typedi';
import { SocialActionInput } from './dto/input/social-action';
import { FollowUserResponse } from './dto/response/follow-user';
import { UserBaseResolver } from './user-base.resolver';
import { UserFollow } from './user-follow.model';
import { User } from './user.model';
import { UserService } from './user.service';

@Service()
@Resolver((of) => FollowUserResponse)
export class FollowUserResolver extends UserBaseResolver(FollowUserResponse) {
  constructor(private readonly userService: UserService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  @Query((returns) => [FollowUserResponse], {
    description: 'フォローしているユーザー一覧を取得する。',
  })
  @Authorized()
  async follows(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<(UserFollow & { isFollowing: boolean })[]> {
    return await this.userService.follows(userId, pagingOptions);
  }

  @Query((returns) => [FollowUserResponse], {
    description: 'フォローされているユーザ一覧を取得する。',
  })
  @Authorized()
  async followers(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<(UserFollow & { isFollowing: boolean })[]> {
    return await this.userService.followers(userId, pagingOptions);
  }

  @Mutation((returns) => Int, { description: 'ユーザをフォローする。' })
  @Authorized()
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async createFollow(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => SocialActionInput) socialActionInput: SocialActionInput,
  ): Promise<number> {
    return await this.userService.createFollow(currentUser, socialActionInput);
  }

  @Mutation((returns) => Int, { description: 'ユーザのフォローを解除する。' })
  @Authorized()
  async deleteFollow(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => SocialActionInput) socialActionInput: SocialActionInput,
  ): Promise<number> {
    return await this.userService.deleteFollow(currentUser, socialActionInput);
  }

  @Mutation((returns) => Int, { description: 'ユーザのフォローを解除する。' })
  @Authorized()
  async deleteFollower(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => SocialActionInput) socialActionInput: SocialActionInput,
  ): Promise<number> {
    return await this.userService.deleteFollower(currentUser, socialActionInput);
  }

  @FieldResolver((returns) => Boolean, {
    description: 'フォローしているかどうかを返すFieldResolver',
  })
  isFollowing(@Root() user: User & { isFollowing?: boolean }): boolean {
    return !!user.isFollowing;
  }
}
