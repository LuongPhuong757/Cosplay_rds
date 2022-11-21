import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { parseHashTags } from '@common/parser/parse-hash-tags';
import { getBlockIds } from '@common/repository/get-blocking-ids';
import { extractUserIds, extractPostIds, extractValue, extractIds } from '@common/util/extract-ids';
import { generateTwitterPostMessage } from '@common/util/generate-twitter-post-message';
import { getCreateAndDeleteItems } from '@common/util/get-create-and-delete-items';
import config from '@config';
import { HashTag } from '@modules/hash-tag/hash-tag.model';
import { HashTagService } from '@modules/hash-tag/hash-tag.service';
import { InfoType } from '@modules/notification/enum/info-type';
import { NotificationService } from '@modules/notification/notification.service';
import { ScoreLogService } from '@modules/score-log/score-log.service';
import { Tag } from '@modules/tag/tag.model';
import { TagService } from '@modules/tag/tag.service';
import { UserPrivateService } from '@modules/user-private/user-private.service';
import { User } from '@modules/user/user.model';
import { SUBSCRIPTION_STATUS } from '@prisma/client';
import { SqsSendEvent } from '@providers/enum/sqs-send-event';
import { S3Provider } from '@providers/s3.provider';
import { SqsService } from '@providers/sqs.provider';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { PhotoRepository } from '../photo/photo.repository';
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
import { DisclosureRange } from './enum/disclosure-range';
import { Post } from './post.model';
import { PostRepository } from './post.repository';

const { sqsImageCompressionQueueUrl } = config.aws;

@Service()
export class PostService {
  constructor(
    private readonly s3Provider: S3Provider,
    private readonly prisma: PrismaService,
    private readonly hashTagService: HashTagService,
    private readonly tagService: TagService,
    private readonly postRepository: PostRepository,
    private readonly photoRepository: PhotoRepository,
    private readonly notificationService: NotificationService,
    private readonly scoreLogService: ScoreLogService,
    private readonly sqsService: SqsService,
    private readonly userPrivateService: UserPrivateService,
  ) {}

  async timeline(currentUser?: User, pagingOptions?: PagingOptionsInput): Promise<Post[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    if (!currentUser) return await this.postRepository.fetchTimeline(pagingOptionsQuery);

    const { blockedBy, blocking } = currentUser;
    const blockingIds = getBlockIds(blockedBy, blocking);
    const followingIds = await this.followingIds(currentUser.id);
    const whereInFollowingIds = {
      userId: { notIn: blockingIds },
    };

    const timelines = await this.postRepository.fetchTimeline(
      pagingOptionsQuery,
      whereInFollowingIds,
    );

    await this.addFavAndIsMembership(currentUser, timelines);
    this.addIsFollowingWithFollowingIds(timelines, followingIds, currentUser.id);

    return timelines;
  }

  async followTimeline(currentUser: User, pagingOptions?: PagingOptionsInput): Promise<Post[]> {
    const { id, blockedBy, blocking } = currentUser;
    const blockingIds = getBlockIds(blockedBy, blocking);
    const followingIds = await this.followingIds(id);

    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const whereInFollowingIds = {
      userId: { in: [...followingIds, id], notIn: blockingIds },
    };

    const timelines = await this.postRepository.fetchTimeline(
      pagingOptionsQuery,
      whereInFollowingIds,
    );

    await this.addFavAndIsMembership(currentUser, timelines);
    this.addIsFollowing(timelines, true, id);

    return timelines;
  }

  // TODO: 最適化が必要
  // 今後不必要になるかもしれません
  async myTimeline(currentUser: User, pagingOptions?: PagingOptionsInput): Promise<Post[]> {
    const { id, blockedBy, blocking } = currentUser;
    const blockingIds = getBlockIds(blockedBy, blocking);
    const followingIds = await this.followingIds(id);

    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const whereInFollowingIds = {
      userId: { in: [...followingIds, id], notIn: blockingIds },
    };

    // フォローしているユーザを取得
    const timelines = await this.postRepository.fetchTimeline(
      pagingOptionsQuery,
      whereInFollowingIds,
    );

    // TODO: pagingOptionsをつけてなくて、自分のタイムラインと全体のタイムラインを全部返す処理は必要ですか?
    if (timelines.length !== 0) {
      await this.addFavAndIsMembership(currentUser, timelines);
      this.addIsFollowing(timelines, true, id);

      return timelines;
    }

    // フォローしていないユーザを取得
    const whereNotInFollowingIds = {
      userId: { notIn: [...followingIds, ...blockingIds, id] },
    };
    const myTimelineTotalCounts = await this.postRepository.timelineCounts(whereInFollowingIds);
    const timelinePagingOptionsQuery = getPagingOptionsQuery(pagingOptions, myTimelineTotalCounts);

    const notFollowingTimelines = await this.postRepository.fetchTimeline(
      timelinePagingOptionsQuery,
      whereNotInFollowingIds,
    );

    await this.addFavAndIsMembership(currentUser, notFollowingTimelines);
    this.addIsFollowing(notFollowingTimelines, false, id);

    return notFollowingTimelines;
  }

  async findById(
    postId: number,
    currentUser?: User,
  ): Promise<
    | (Post & { isFollowing: boolean; isMyPost: boolean })
    | (Post & { currentUserFollowings: number[] })
  > {
    const post = await this.postRepository.findById(postId, currentUser?.id);
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }
    if (!currentUser) {
      return this.addIsFollowingMap(post, false);
    }
    let isMyPost = false;
    if (post?.user?.id === currentUser.id) {
      isMyPost = true;
    }

    const currentUserFollowings = await this.followingIds(currentUser.id);
    const currentUserIsMembershipPost = await this.getCurrentUserIsMembershipPost(
      currentUser.id,
      post,
    );
    const postUser = {
      ...post.user,
      isFollowing: currentUserFollowings.includes(post.userId),
      isMyPost,
    } as User;

    return { ...currentUserIsMembershipPost, currentUserFollowings, user: postUser };
  }

  async findPostsByUserId(
    userId: number,
    pagingOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<Post[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const whereUserPost = {
      userId,
    };
    const posts = await this.postRepository.fetchTimeline(pagingOptionsQuery, whereUserPost);
    if (!currentUser) {
      this.addIsFollowing(posts, false);

      return posts as (Post & { isFollowing: boolean })[];
    }
    const currentUserFollowings = await this.followingIds(currentUser.id);
    const isFollowing = currentUserFollowings.includes(userId);

    await this.addFavAndIsMembership(currentUser, posts);
    this.addIsFollowing(posts, isFollowing, currentUser.id);

    return posts;
  }

  async findPostsByHashTag(
    hashTagId: number,
    pagintOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<Post[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagintOptions);
    const whereInput = {
      hashtags: {
        some: {
          id: hashTagId,
        },
      },
    };
    const posts = await this.postRepository.fetchTimeline(pagingOptionsQuery, whereInput);
    if (!currentUser) return posts;

    await this.addFavAndIsMembership(currentUser, posts);
    this.addIsFollowing(posts, true, currentUser.id);

    return posts;
  }

  async findPostsByTag(
    tagId: number,
    pagintOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<Post[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagintOptions);
    const whereInput = {
      tags: {
        some: {
          id: tagId,
        },
      },
    };
    const posts = await this.postRepository.fetchTimeline(pagingOptionsQuery, whereInput);
    if (!currentUser) return posts;

    await this.addFavAndIsMembership(currentUser, posts);
    this.addIsFollowing(posts, true, currentUser.id);

    return posts;
  }

  async portfolios(
    userId: number,
    pagingOptions?: PagingOptionsInput,
    currentUser?: User,
  ): Promise<Post[]> {
    const posts = await this.postRepository.fetchPortfolios(userId, pagingOptions);
    if (!currentUser) return posts;

    await this.addFavAndIsMembership(currentUser, posts);
    this.addIsFollowing(posts, true, currentUser.id);

    return posts;
  }

  getImageSignedUrl(
    currentUser: User,
    getImageSignedUrlArg: GetImageSignedUrlArg,
  ): GetImageSignedUrlResponse {
    const { id } = currentUser;
    const { signedUrl, filename } = this.s3Provider.getImageSignedUrl(id, getImageSignedUrlArg);

    return {
      url: signedUrl,
      filename,
    };
  }

  async getMultipartSignedUrls(
    currentUser: User,
    getMultipartSignedUrlsArg: GetMultipartSignedUrlsArg,
  ): Promise<GetVideoSignedUrlResponse> {
    const { id } = currentUser;

    return await this.s3Provider.getMultipartSignedUrls(id, getMultipartSignedUrlsArg);
  }

  async findFavorites(currentUser: User, pagingOptions?: PagingOptionsInput): Promise<Post[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const whereInput = {
      favs: {
        some: {
          userId: currentUser.id,
        },
      },
    };
    const posts = await this.postRepository.fetchTimeline(pagingOptionsQuery, whereInput);

    await this.addFavAndIsMembership(currentUser, posts);
    this.addIsFollowing(posts, false, currentUser.id);

    return posts;
  }

  async addFav(
    currentUser: User,
    addFavInput: AddFavInput,
  ): Promise<Post & { isFollowing: boolean }> {
    const { id } = currentUser;
    const { postId } = addFavInput;
    try {
      const fav = await this.prisma.fav.findFirst({
        where: {
          userId: id,
          postId,
        },
      });
      if (fav) {
        throw Error(`user has already added fav.`);
      }

      const newFav = await this.prisma.fav.create({
        data: {
          userId: id,
          postId,
        },
      });
      const updated = await this.prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          favs: {
            connect: [{ id: newFav.id }],
          },
        },
        include: {
          favs: true,
          user: true,
          tags: true,
        },
      });
      const isFollowing = await this.isCurrentUserFollowing(currentUser, updated.userId);

      await this.scoreLogService.fav(postId);
      await this.notificationService.createNotification(id, updated.userId, InfoType.FAV, postId);

      // タグ付けされたユーザへのいいね
      const tagUsers = updated.tags.filter((tag) => tag.userId) as Array<Tag & { userId: number }>;
      Promise.all(
        tagUsers.map(async (tagUser) => {
          await this.notificationService.createNotification(
            id,
            tagUser.userId,
            InfoType.TAG_FAV,
            updated.id,
          );
        }),
      );

      return { ...updated, isFollowing };
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`cannot add fav to the post. message: ${message} postId: ${postId}.`);
    }
  }

  async removeFav(
    currentUser: User,
    removeFavInput: RemoveFavInput,
  ): Promise<Post & { isFollowing: boolean }> {
    const { id } = currentUser;
    const { postId } = removeFavInput;
    const fav = await this.prisma.fav.findFirst({
      where: {
        userId: id,
        postId,
      },
    });
    if (!fav) {
      throw Error(`fav does not exist. postId: ${postId}.`);
    }

    try {
      const updated = await this.prisma.post.update({
        where: {
          id: fav.postId,
        },
        data: {
          favs: {
            delete: { id: fav.id },
          },
        },
      });
      await this.scoreLogService.fav(fav.postId, false);

      const isFollowing = await this.isCurrentUserFollowing(currentUser, updated.userId);

      return { ...updated, isFollowing };
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`cannot remove fav from the post. postId: ${postId} message: ${message}.`);
    }
  }

  async createPost(
    currentUser: User,
    createPostInput: CreatePostInput | CreateVideoPostInput,
    isImage = true,
  ): Promise<Post> {
    const { id } = currentUser;
    const {
      caption,
      tagUserIds,
      tagEventIds,
      disclosureRange,
      commentAble,
      isSNSPost,
    } = createPostInput;
    const uploadedFilenames = this.getUploadedFilenames(createPostInput, isImage);
    if (!isImage) {
      await this.processMultiupload(createPostInput);
    }

    const parsed = parseHashTags(caption);
    const hashTags = await this.hashTagService.findOrCreate(parsed);
    const tags = await this.tagService.findOrCreate({ tagUserIds, tagEventIds });
    const newPost = await this.prisma.post.create({
      data: {
        userId: id,
        caption,
        disclosureRange,
        commentAble,
        photos: {
          create: uploadedFilenames.map((uploadFilename) => ({ image: uploadFilename })),
        },
      },
    });

    const post = await this.prisma.post.update({
      where: { id: newPost.id },
      data: {
        hashtags: {
          connect: hashTags.map((hashTag) => ({ id: hashTag.id })),
        },
        tags: {
          connect: tags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    // SNSへの同時投稿を行う
    if (isSNSPost) {
      await this.userPrivateService.tweetPost(
        id,
        generateTwitterPostMessage(post.id, post.caption),
      );
    }

    await this.notificationService.createNotifications(
      tagUserIds.map((tagUserId) => ({
        senderId: id,
        receivedId: tagUserId,
        infoType: InfoType.TAG,
        postId: post.id,
      })),
    );

    // 投稿範囲がメンバーシップ限定の場合は、メンバーシップ会員に通知を行う
    if (disclosureRange === DisclosureRange.MEMBERSHIP) {
      const memberships = await this.prisma.subscription.findMany({
        select: {
          buyerId: true,
        },
        where: {
          sellerId: id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      });
      const membershipIds = memberships.map((m) => m.buyerId);

      await this.notificationService.createNotifications(
        membershipIds.map((membershipId) => ({
          senderId: id,
          receivedId: membershipId!,
          infoType: InfoType.MEMBERSHIP_NEW_POST,
          postId: post.id,
        })),
      );
    }

    const eventType = isImage ? SqsSendEvent.postImage : SqsSendEvent.postVideo;

    Promise.all(
      uploadedFilenames.map(async (filename) => {
        const params = SqsService.generateMessageAttribute(eventType, filename);

        await this.sqsService.sendQueue({
          MessageAttributes: params,
          MessageBody: `post image compression. filename ${filename} postId: ${post.id}.`,
          QueueUrl: sqsImageCompressionQueueUrl,
        });
      }),
    );

    return this.addIsFollowingMap(post, false);
  }

  async updatePost(
    updatePostInput: UpdatePostInput | UpdateVideoPostInput,
    currentUser: User,
    isImage = true,
  ): Promise<Post> {
    const { id } = currentUser;
    const {
      postId,
      caption,
      disclosureRange,
      commentAble,
      tagEventIds,
      tagUserIds,
    } = updatePostInput;
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        hashtags: true,
        tags: true,
        photos: true,
      },
    });
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }
    const uploadedFilenames = this.getUploadedFilenames(updatePostInput, isImage);
    const dataChange = {
      caption: caption ? caption : null,
      disclosureRange,
      commentAble,
      photos: {
        create: uploadedFilenames.map((uploadFilename) => ({ image: uploadFilename })),
      },
    };
    const { hashtags: oldHashTags } = post;
    const { tags: oldTags } = post;
    const { photos: oldPhotos } = post;
    const parsed = parseHashTags(caption);
    const newHashTags = await this.hashTagService.findOrCreate(parsed);
    if (!isImage) {
      const { uploadId } = updatePostInput as UpdateVideoPostInput;
      if (uploadId) {
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const i in oldPhotos) {
          await this.photoRepository.deletedPhotoById(oldPhotos[i].id);
        }
        await this.processMultiupload(updatePostInput);
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete dataChange['photos'];
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-for-in-array
      for (const i in oldPhotos) {
        await this.photoRepository.deletedPhotoById(oldPhotos[i].id);
      }
    }
    const { createItems, deleteItems } = getCreateAndDeleteItems<HashTag>(oldHashTags, newHashTags);
    const newTags = await this.tagService.findOrCreate({ tagUserIds, tagEventIds });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...dataChange,
        hashtags: {
          disconnect: deleteItems.length !== 0 ? deleteItems : [],
          connect: createItems.length !== 0 ? createItems : [],
        },
        tags: {
          disconnect: oldTags.map((tag) => ({ id: tag.id })),
          connect: newTags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    await this.notificationService.createNotifications(
      tagUserIds.map((tagUserId) => ({
        senderId: id,
        receivedId: tagUserId,
        infoType: InfoType.TAG,
        postId: post.id,
      })),
    );

    // 投稿範囲がメンバーシップ限定の場合は、メンバーシップ会員に通知を行う
    if (disclosureRange === DisclosureRange.MEMBERSHIP) {
      const memberships = await this.prisma.subscription.findMany({
        select: {
          buyerId: true,
        },
        where: {
          sellerId: id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      });
      const membershipIds = memberships.map((m) => m.buyerId);

      await this.notificationService.createNotifications(
        membershipIds.map((membershipId) => ({
          senderId: id,
          receivedId: membershipId!,
          infoType: InfoType.MEMBERSHIP_NEW_POST,
          postId: post.id,
        })),
      );
    }

    const eventType = isImage ? SqsSendEvent.postImage : SqsSendEvent.postVideo;

    Promise.all(
      uploadedFilenames.map(async (filename) => {
        const params = SqsService.generateMessageAttribute(eventType, filename);

        await this.sqsService.sendQueue({
          MessageAttributes: params,
          MessageBody: `post image compression. filename ${filename} postId: ${post.id}.`,
          QueueUrl: sqsImageCompressionQueueUrl,
        });
      }),
    );

    return this.addIsFollowingMap(updated, false);
  }

  async updatePostImageVideo(
    updatePostInput: UpdatePostInput | UpdateVideoPostInput,
    currentUser: User,
    isImage = true,
  ): Promise<Post> {
    const { id } = currentUser;
    const {
      postId,
      caption,
      disclosureRange,
      commentAble,
      tagEventIds,
      tagUserIds,
    } = updatePostInput;
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        hashtags: true,
        tags: true,
        photos: true,
      },
    });
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }
    const uploadedFilenames = this.getUploadedFilenames(updatePostInput, isImage);
    const dataChange = {
      caption: caption ? caption : null,
      disclosureRange,
      commentAble,
      photos: {
        create: uploadedFilenames.map((uploadFilename) => ({ image: uploadFilename })),
      },
    };
    const { hashtags: oldHashTags } = post;
    const { tags: oldTags } = post;
    const { photos: oldPhotos } = post;
    const parsed = parseHashTags(caption);
    const newHashTags = await this.hashTagService.findOrCreate(parsed);
    if (!isImage) {
      const { uploadId } = updatePostInput as UpdateVideoPostInput;
      if (uploadId) {
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const i in oldPhotos) {
          await this.photoRepository.deletedPhotoById(oldPhotos[i].id);
        }
        await this.processMultiupload(updatePostInput);
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete dataChange['photos'];
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-for-in-array
      for (const i in oldPhotos) {
        await this.photoRepository.deletedPhotoById(oldPhotos[i].id);
      }
    }
    const { createItems, deleteItems } = getCreateAndDeleteItems<HashTag>(oldHashTags, newHashTags);
    const newTags = await this.tagService.findOrCreate({ tagUserIds, tagEventIds });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...dataChange,
        hashtags: {
          disconnect: deleteItems.length !== 0 ? deleteItems : [],
          connect: createItems.length !== 0 ? createItems : [],
        },
        tags: {
          disconnect: oldTags.map((tag) => ({ id: tag.id })),
          connect: newTags.map((tag) => ({ id: tag.id })),
        },
      },
    });

    await this.notificationService.createNotifications(
      tagUserIds.map((tagUserId) => ({
        senderId: id,
        receivedId: tagUserId,
        infoType: InfoType.TAG,
        postId: post.id,
      })),
    );

    // 投稿範囲がメンバーシップ限定の場合は、メンバーシップ会員に通知を行う
    if (disclosureRange === DisclosureRange.MEMBERSHIP) {
      const memberships = await this.prisma.subscription.findMany({
        select: {
          buyerId: true,
        },
        where: {
          sellerId: id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      });
      const membershipIds = memberships.map((m) => m.buyerId);

      await this.notificationService.createNotifications(
        membershipIds.map((membershipId) => ({
          senderId: id,
          receivedId: membershipId!,
          infoType: InfoType.MEMBERSHIP_NEW_POST,
          postId: post.id,
        })),
      );
    }

    const eventType = isImage ? SqsSendEvent.postImage : SqsSendEvent.postVideo;

    Promise.all(
      uploadedFilenames.map(async (filename) => {
        const params = SqsService.generateMessageAttribute(eventType, filename);

        await this.sqsService.sendQueue({
          MessageAttributes: params,
          MessageBody: `post image compression. filename ${filename} postId: ${post.id}.`,
          QueueUrl: sqsImageCompressionQueueUrl,
        });
      }),
    );

    return this.addIsFollowingMap(updated, false);
  }

  async deletePost(input: DeletePostInput): Promise<number> {
    const { postId } = input;
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        photos: true,
      },
    });
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }

    // TODO: https://github.com/prisma/prisma/discussions/2610
    await this.prisma.$executeRaw<Post[]>(`DELETE FROM "public"."Post" WHERE id = $1;`, postId);

    const { photos } = post;
    Promise.all(
      photos.map(async (photo) => {
        await this.s3Provider.deleteFile(photo.image);
      }),
    );

    return postId;
  }

  private filterComments(post: Post, currentUser: User): Post {
    if (!currentUser) return post;
    if (post.userId !== currentUser.id) return post;
    if (!post.comments) return post;

    const { blockedBy, blocking } = currentUser;
    const blocks = getBlockIds(blockedBy, blocking);

    return {
      ...post,
      comments: post.comments.filter((comment) => blocks.indexOf(comment.userId) === -1),
    };
  }

  addIsFollowing(posts: Post[], isFollowing: boolean, currentUserId?: number): void {
    const added = posts.map((post) => this.addIsFollowingMap(post, isFollowing, currentUserId));

    posts.splice(0, posts.length, ...added);
  }

  addIsFollowingWithFollowingIds(
    posts: Post[],
    followingIds: number[],
    currentUserId?: number,
  ): void {
    const setFollowingIds = new Set(followingIds);
    const added = posts.map((post) =>
      this.addIsFollowingMap(post, setFollowingIds.has(post?.user?.id as number), currentUserId),
    );

    posts.splice(0, posts.length, ...added);
  }

  addIsFollowingMap(
    post: Post,
    isFollowing: boolean,
    currentUserId?: number,
  ): Post & { isFollowing: boolean; isMyPost: boolean } {
    if (!currentUserId) return { ...post, isFollowing, isMyPost: false };
    if (post?.user?.id === currentUserId) return { ...post, isFollowing: false, isMyPost: true };

    return { ...post, isFollowing, isMyPost: false };
  }

  private async isCurrentUserFollowing(currentUser: User, userId: number) {
    const currentUserFollowings = await this.followingIds(currentUser.id);

    return currentUserFollowings.indexOf(userId) !== -1;
  }

  addFavAndIsMembership = async (currentUser: User, timelines: Post[]): Promise<void> => {
    const added = await this.getCurrentUserIsMembershipPosts(
      currentUser.id,
      await this.addCurrentUserFavs(
        currentUser.id,
        timelines.map((timeline) => this.filterComments(timeline, currentUser)),
      ),
    );

    timelines.splice(0, timelines.length, ...added);
  };

  private async addCurrentUserFav(userId: number, post: Post): Promise<Post> {
    const favs = await this.prisma.fav.findMany({
      where: {
        userId,
        postId: post.id,
      },
    });

    return {
      ...post,
      isFav: !!favs,
    };
  }

  private async addCurrentUserFavs(userId: number, posts: Post[]): Promise<Post[]> {
    const postIds = posts.map(extractIds);
    const favs = await this.prisma.fav.findMany({
      where: {
        userId,
        postId: {
          in: postIds,
        },
      },
    });
    const favPostIds = favs.map(extractPostIds);

    return posts.map((post) => {
      const isFav = favPostIds.indexOf(post.id) !== -1;

      return {
        ...post,
        isFav,
      };
    });
  }

  private getCurrentUserIsMembershipPost = async (
    userId: number,
    post: Post,
    // eslint-disable-next-line prettier/prettier
  ): Promise<
    Omit<Post, 'user'> | (Post & { user: User & { currentUserIsMembership: boolean } })
  > => {
    const { user } = post;
    if (!user) return post;
    if (user.id === userId) {
      return {
        ...post,
        user: {
          ...user,
          currentUserIsMembership: true,
        },
      };
    }
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        buyerId: userId,
        sellerId: post.userId,
      },
    });
    const currentUserIsMembership = !!subscription;

    return {
      ...post,
      user: {
        ...user,
        currentUserIsMembership,
      },
    };
  };

  private getCurrentUserIsMembershipPosts = async (
    userId: number,
    posts: Post[],
  ): Promise<Post[]> => {
    const postUserIds = posts.map(extractUserIds);
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        buyerId: userId,
        sellerId: {
          in: postUserIds,
        },
      },
    });
    const sellerIds = subscriptions.map((subscription) => extractValue(subscription, 'sellerId'));

    return posts.map((post) => {
      const { user } = post;
      if (!user) return post;
      const currentUserIsMembership = sellerIds.indexOf(post.userId) !== -1;

      return {
        ...post,
        user: {
          ...user,
          currentUserIsMembership,
        },
      };
    });
  };

  private followingIds = async (userId: number): Promise<number[]> => {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        following: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!user) {
      throw Error(`cannot get followingIds. userId: ${userId}.`);
    }

    const following = user?.following || [];

    return following.map(extractIds);
  };

  private getUploadedFilenames = (
    createPostInput:
      | CreatePostInput
      | CreateVideoPostInput
      | UpdatePostInput
      | UpdateVideoPostInput,
    isImage: boolean,
  ): string[] => {
    if (isImage) {
      return (createPostInput as CreatePostInput).uploadedFilenames;
    }

    return [(createPostInput as CreateVideoPostInput).uploadedFilename];
  };

  private processMultiupload = async (
    createPostInput:
      | CreatePostInput
      | CreateVideoPostInput
      | UpdatePostInput
      | UpdateVideoPostInput,
  ): Promise<void> => {
    const { uploadId, uploadedFilename, multiparts } = createPostInput as CreateVideoPostInput;

    await this.s3Provider.completeMultiupload(uploadId, uploadedFilename, multiparts);
  };
}
