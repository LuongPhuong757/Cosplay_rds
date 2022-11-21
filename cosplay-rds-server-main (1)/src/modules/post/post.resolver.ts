import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { addUrlToTag } from '@common/util/add-url';
import { addPhotoUrlBylDisclosureRange } from '@common/util/add-url-by-disclosure-range';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { BlockUserGuard } from '@guards/block-user.guard';
import { PostGuard } from '@guards/post.guard';
import { GetBlockUsers } from '@middlewares/get-block-users.middleware';
import { PhotoResponse } from '@modules/photo/dto/response/photo';
import { Photo } from '@modules/photo/photo.model';
import { SuperchatResponse } from '@modules/superchat/dto/response/superchat';
import { TagResponse } from '@modules/tag/dto/response/tag';
import { Tag } from '@modules/tag/tag.model';
import { User } from '@prisma/client';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Authorized,
  Args,
  Root,
  FieldResolver,
  UseMiddleware,
  Int,
} from 'type-graphql';
import { Service } from 'typedi';
import { GetImageSignedUrlArg } from './dto/arg/get-image-singed-url';
import { GetMultipartSignedUrlsArg } from './dto/arg/get-multipart-signed-urls';
import { AddFavInput } from './dto/input/add-fav';
import { CreatePostInput } from './dto/input/create-post';
import { CreateVideoPostInput, UpdateVideoPostInput } from './dto/input/create-video-post';
import { DeletePostInput } from './dto/input/delete-post';
import { RemoveFavInput } from './dto/input/remove-fav';
import { UpdatePostInput } from './dto/input/update-post';
import { GetImageSignedUrlResponse } from './dto/response/get-image-singed-url';
import { GetVideoSignedUrlResponse } from './dto/response/get-video-signed-url';
import { PostResponse } from './dto/response/post';
import { DisclosureRange } from './enum/disclosure-range';
import { Post } from './post.model';
import { PostService } from './post.service';

@Service()
@Resolver((of) => PostResponse)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Query((returns) => [PostResponse], {
    description: 'タイムラインを取得する。',
  })
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async timeline(
    @GetCurrentUser() currentUser?: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput) pagingOptions?: PagingOptionsInput,
  ): Promise<Post[]> {
    return await this.postService.timeline(currentUser, pagingOptions);
  }

  @Query((returns) => [PostResponse], {
    description: 'フォローしているユーザの投稿を取得する。',
  })
  @Authorized()
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async followTimeline(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput) pagingOptions?: PagingOptionsInput,
  ): Promise<Post[]> {
    return await this.postService.followTimeline(currentUser, pagingOptions);
  }

  @Query((returns) => PostResponse, { description: '指定した投稿画像・動画を取得する。' })
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async getPostById(
    @Arg('postId', (type) => Int) postId: number,
    @GetCurrentUser() currentUser?: User,
  ): Promise<Post> {
    return await this.postService.findById(postId, currentUser);
  }

  @Query((returns) => [PostResponse], {
    description: '指定したユーザの投稿画像・動画一覧を取得する。',
  })
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async getPostsByUserId(
    @GetCurrentUser() currentUser: User,
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Post[]> {
    return await this.postService.findPostsByUserId(userId, pagingOptions, currentUser);
  }

  @Query((returns) => [PostResponse], {
    description: '指定したハッシュタグの投稿画像・動画一覧を取得する。',
  })
  async getPostsByHashTag(
    @Arg('hashTagId', (type) => Int) hashTagId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
    @GetCurrentUser() currentUser?: User,
  ): Promise<Post[]> {
    return await this.postService.findPostsByHashTag(hashTagId, pagingOptions, currentUser);
  }

  @Query((returns) => [PostResponse], {
    description: '指定したタグの投稿画像・動画一覧を取得する。',
  })
  async getPostsByTag(
    @Arg('tagId', (type) => Int) tagId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
    @GetCurrentUser() currentUser?: User,
  ): Promise<Post[]> {
    return await this.postService.findPostsByTag(tagId, pagingOptions, currentUser);
  }

  @Query((returns) => [PostResponse], {
    description: '指定したユーザのポートフォリオを取得する。',
  })
  @UseMiddleware(GetBlockUsers)
  @UseMiddleware(BlockUserGuard)
  async portfolios(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
    @GetCurrentUser() currentUser?: User,
  ): Promise<Post[]> {
    return await this.postService.portfolios(userId, pagingOptions, currentUser);
  }

  @Mutation((returns) => GetImageSignedUrlResponse, {
    description: '画像のS3へのアップロード用URLを取得する。',
  })
  @Authorized()
  getImageSignedUrl(
    @GetCurrentUser() currentUser: User,
    @Args() getImageSignedArg: GetImageSignedUrlArg,
  ): GetImageSignedUrlResponse {
    return this.postService.getImageSignedUrl(currentUser, getImageSignedArg);
  }

  @Mutation((returns) => GetVideoSignedUrlResponse, {
    description: '動画のS3へのアップロード用URLを取得する。',
  })
  @Authorized()
  async getMultipartSignedUrls(
    @GetCurrentUser() currentUser: User,
    @Args() getMultipartSignedUrlsArg: GetMultipartSignedUrlsArg,
  ): Promise<GetVideoSignedUrlResponse> {
    return await this.postService.getMultipartSignedUrls(currentUser, getMultipartSignedUrlsArg);
  }

  @Query((returns) => [PostResponse], {
    description: 'お気に入りした投稿一覧を取得する。',
  })
  @Authorized()
  async favorites(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Post[]> {
    return await this.postService.findFavorites(currentUser, pagingOptions);
  }

  @Mutation((returns) => PostResponse, { description: '投稿へのいいねを行う。' })
  @Authorized()
  async addFav(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => AddFavInput) addFavInput: AddFavInput,
  ): Promise<Post> {
    return await this.postService.addFav(currentUser, addFavInput);
  }

  @Mutation((returns) => PostResponse, { description: '投稿へのいいねを取り消し行う。' })
  @Authorized()
  async removeFav(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => RemoveFavInput) removeFavInput: RemoveFavInput,
  ): Promise<Post> {
    return await this.postService.removeFav(currentUser, removeFavInput);
  }

  @Mutation((returns) => PostResponse, { description: '投稿画像を新規作成する。' })
  @Authorized()
  async createPost(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => CreatePostInput) createPostInput: CreatePostInput,
  ): Promise<Post> {
    return await this.postService.createPost(currentUser, createPostInput);
  }

  @Mutation((returns) => PostResponse, { description: '投稿動画を新規作成する。' })
  @Authorized()
  async createVideoPost(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => CreateVideoPostInput) createVideoPostInput: CreateVideoPostInput,
  ): Promise<Post> {
    return await this.postService.createPost(currentUser, createVideoPostInput, false);
  }

  @Mutation((returns) => PostResponse, { description: '投稿動画を新規作成する。' })
  @Authorized()
  async updateVideoPost(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => UpdateVideoPostInput) updatePostInput: UpdateVideoPostInput,
  ): Promise<Post> {
    return await this.postService.updatePostImageVideo(updatePostInput, currentUser, false);
  }

  @Mutation((returns) => PostResponse, { description: '投稿画像・動画を更新する。' })
  @Authorized()
  @UseMiddleware(PostGuard)
  async updatePost(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => UpdatePostInput) updatePostInput: UpdatePostInput,
  ): Promise<Post> {
    return await this.postService.updatePostImageVideo(updatePostInput, currentUser, true);
  }

  @Mutation((returns) => Int, { description: '投稿画像・動画を削除する。' })
  @Authorized()
  @UseMiddleware(PostGuard)
  async deletePost(
    @Arg('input', (type) => DeletePostInput) deletePostInput: DeletePostInput,
  ): Promise<number> {
    return await this.postService.deletePost(deletePostInput);
  }

  @FieldResolver((returns) => [TagResponse], {
    description: 'タグの中でドメインを付与したイメージのURLを返すFieldResolver。',
  })
  tags(@Root() post: Post): Tag[] {
    const { tags } = post;
    if (!tags) {
      return [];
    }

    return tags.map(addUrlToTag);
  }

  @FieldResolver((returns) => [PhotoResponse], {
    description: 'ドメインを付与した公開範囲の権限に合わせたイメージのURLを返すFieldResolver。',
  })
  photos(
    @Root()
    post: Omit<Post, 'user'> & {
      isFollowing: boolean;
      isMyPost: boolean;
      user: User & { currentUserIsMembership?: boolean; isMyPost?: boolean; isFollowing?: boolean };
    },
  ): Photo[] {
    const { photos, disclosureRange, user } = post;
    let { isFollowing, isMyPost } = post;
    if (!photos) {
      return [];
    }
    isFollowing = isFollowing ?? post.user.isFollowing;
    isMyPost = isMyPost ?? post.user.isMyPost;

    return photos.map((photo) =>
      addPhotoUrlBylDisclosureRange(
        photo,
        isMyPost ? DisclosureRange.ALL : disclosureRange,
        isFollowing,
        user.currentUserIsMembership,
      ),
    );
  }

  @FieldResolver((returns) => Boolean, {
    description:
      '投稿画像・動画のユーザをフォローしているかどうかを含めたユーザを返すFieldResolver。',
  })
  user(
    @Root() post: Post & { currentUserFollowings: number[]; isFollowing?: boolean },
  ): User & { isFollowing: boolean } {
    const { currentUserFollowings, userId, isFollowing, user } = post;
    if (!user) {
      throw Error(`no user on postId: ${post.id}`);
    }

    if (isFollowing !== undefined) {
      return { ...user, isFollowing };
    }
    if (!currentUserFollowings) {
      return { ...user, isFollowing: false };
    }
    const currentUserIsFollowing = currentUserFollowings.indexOf(userId) !== -1;

    return { ...user, isFollowing: currentUserIsFollowing };
  }

  @FieldResolver((returns) => Int, {
    description: 'いいねの合計数を返すFieldResolver。',
  })
  totalFavs(@Root() post: Post & { _count: { [key: string]: number } }): number {
    return post._count.favs;
  }

  @FieldResolver((returns) => Int, { description: 'コメントの合計数を返すFieldResolver。' })
  totalComments(@Root() post: Post & { _count: { [key: string]: number } }): number {
    return post._count.comments;
  }

  @FieldResolver((returns) => [SuperchatResponse], {
    nullable: true,
    description:
      '投稿画像・動画に紐付くスーパーチャットおよびURL付きのアイコンイメージを持ったユーザを返すFieldResolver。',
  })
  superchats(@Root() post: PostResponse): SuperchatResponse[] {
    const { comments } = post;
    if (!comments) {
      return [];
    }

    return comments.map((comment) => comment.superChat).filter((superchat) => !!superchat);
  }

  @FieldResolver((returns) => Int, {
    description: 'スーパーチャットの合計金額を返すFieldResolver。',
  })
  totalSuperchats(@Root() post: PostResponse): number {
    const superchats = this.superchats(post);

    return superchats.reduce(
      (accumulator: number, currentValue: SuperchatResponse) =>
        accumulator + currentValue.price?.amount ?? 0,
      0,
    );
  }
}
