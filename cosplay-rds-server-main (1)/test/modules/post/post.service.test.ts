import 'reflect-metadata';
import { parseHashTags } from '@common/parser/parse-hash-tags';
import { HashTagService } from '@modules/hash-tag/hash-tag.service';
import { NotificationService } from '@modules/notification/notification.service';
import { PhotoRepository } from '@modules/photo/photo.repository';
import { Post } from '@modules/post/post.model';
import { PostRepository } from '@modules/post/post.repository';
import { PostService } from '@modules/post/post.service';
import { ScoreLogRepository } from '@modules/score-log/score-log.repository';
import { ScoreLogService } from '@modules/score-log/score-log.service';
import { Tag } from '@modules/tag/tag.model';
import { TagRepository } from '@modules/tag/tag.repository';
import { TagService } from '@modules/tag/tag.service';
import { User } from '@modules/user/user.model';
import { SUBSCRIPTION_STATUS } from '@prisma/client';
import { S3Provider } from '@providers/s3.provider';
import { SqsService } from '@providers/sqs.provider';
import { firstHashTag } from '../../data';
import {
  fetchFirstTestUser,
  fetchThirdTestUser,
  generatePageOptionsInput,
  createPost,
  deletePost,
  followTestUser,
  unFollowTestUser,
  fetchFirstTestPost,
  fetchPostFav,
  fetchHashTag,
} from '../../helper';
import { prisma } from '../../prisma-instance';
import { userPrivateService, generatorService } from '../../service-instance';

const posts = [
  {
    id: 1,
    photos: [{ image: 'testImage ' }],
    hashtags: [{ id: 1 }],
  },
];

describe('PostService', () => {
  let s3Provider: S3Provider;
  let postService: PostService;
  let hashTagService: HashTagService;
  let tagService: TagService;
  let notificationService: NotificationService;
  let scoreLogService: ScoreLogService;
  let postRepository: PostRepository;
  let photoRepository: PhotoRepository;
  let tagRepository: TagRepository;
  let scoreLogRepository: ScoreLogRepository;
  let sqsService: SqsService;
  let postUser: User;

  const setup = () => {
    const mockedFunctions = {
      mockFindFirst: jest.fn().mockImplementation((query: { where: { id: number } }) => {
        const filtered = posts.filter((post) => post.id === query.where.id);

        return filtered.length === 0 ? null : filtered[0];
      }),
      mockCreatePost: jest.fn().mockImplementation((caption: string) => ({ id: 1, caption })),
      mockUpdatePost: jest.fn().mockImplementation((caption: string) => ({ id: 1, caption })),
      mockFindOrCreate: jest.fn().mockResolvedValue([{ id: 1, name: 'testHashTag ' }]),
      mockExecuteRaw: jest.fn().mockResolvedValue(null),
      mockDeleteFile: jest.fn().mockResolvedValue(null),
      completeMultiupload: jest.fn().mockResolvedValue(null),
      sendQueue: jest.fn().mockResolvedValue(null),
    };

    prisma.post.findFirst = mockedFunctions.mockFindFirst;
    prisma.post.findUnique = mockedFunctions.mockFindFirst;
    prisma.post.create = mockedFunctions.mockCreatePost;
    prisma.post.update = mockedFunctions.mockUpdatePost;
    prisma.$executeRaw = mockedFunctions.mockExecuteRaw;
    hashTagService.findOrCreate = mockedFunctions.mockFindOrCreate;
    s3Provider.deleteFile = mockedFunctions.mockDeleteFile;
    s3Provider.completeMultiupload = mockedFunctions.completeMultiupload;
    sqsService.sendQueue = mockedFunctions.sendQueue;

    return mockedFunctions;
  };

  const createMockInputData = () => ({
    user: {
      id: 1,
      account: 'testAccount',
      auth0Id: 'testUserId',
      name: 'test',
      icon: 'testIcon',
      profile: 'testProfile',
      website: '1',
      priceId: 1,
      snsInfo: { twitter: 'url' },
      isBan: false,
      isCosplayer: false,
      manageOfficeId: null,
      belongOfficeId: null,
    },
    createPostInput: {
      uploadedFilenames: ['testImage1', 'testImage2'],
      caption: 'test test',
      tagUserIds: [],
      tagEventIds: [],
      disclosureRange: 0,
      commentAble: 0,
      isSNSPost: false,
    },
    createVideoInput: {
      uploadedFilename: 'testVideo1.mp4',
      uploadId: 'testUploadId',
      multiparts: [
        {
          ETag: 'etagTest',
          PartNumber: 1,
        },
      ],
      caption: 'test test video',
      tagUserIds: [],
      tagEventIds: [],
      disclosureRange: 0,
      commentAble: 0,
      isSNSPost: false,
    },
    updatePostInput: { postId: 1, caption: 'test test' },
    deletePostInput: { postId: 1 },
  });

  beforeAll(async () => {
    postUser = await prisma.user.create({
      data: {
        name: 'pos1-name',
        account: 'pos1-account',
        auth0Id: 'pos1-auth0Id',
        userPrivate: {
          create: {
            email: 'com1@gmail.com',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
  });

  beforeEach(() => {
    tagRepository = new TagRepository(prisma);
    s3Provider = new S3Provider(generatorService);
    hashTagService = new HashTagService(prisma);
    notificationService = new NotificationService(prisma);
    scoreLogRepository = new ScoreLogRepository(prisma);
    scoreLogService = new ScoreLogService(scoreLogRepository);
    sqsService = new SqsService();
    tagService = new TagService(prisma, tagRepository);
    postRepository = new PostRepository(prisma);
    photoRepository = new PhotoRepository(prisma);
    postService = new PostService(
      s3Provider,
      prisma,
      hashTagService,
      tagService,
      postRepository,
      photoRepository,
      notificationService,
      scoreLogService,
      sqsService,
      userPrivateService,
    );
  });

  describe('timeline', () => {
    it('return timelines.', async () => {
      const result = await postService.timeline();

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('with pagingOptions.', async () => {
      const pagingOptionsInput = generatePageOptionsInput();
      const result = await postService.timeline(undefined, pagingOptionsInput);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('timline line should have posts that no ban users upload.', async () => {
      const pagingOptionsInput = generatePageOptionsInput();
      const newUser = await prisma.user.create({
        data: {
          name: 'timeline-isban-name',
          account: 'timeline-isban-account',
          auth0Id: 'timeline-isban-auth0Id',
          isBan: true,
        },
      });
      const prevResult = await postService.timeline(undefined, pagingOptionsInput);
      await prisma.post.create({
        data: {
          caption: 'timeline-isban-caption',
          userId: newUser.id,
        },
      });
      const nextResult = await postService.timeline(undefined, pagingOptionsInput);

      expect(prevResult.length === nextResult.length).toBe(true);
    });
  });

  describe('getPostById', () => {
    it('return post.', async () => {
      const posts = await prisma.post.findMany();
      const result = await postService.findById(posts[0].id);

      expect(result).not.toBeUndefined();
      expect(result).toHaveProperty('isFav');
      // eslint-disable-next-line
      expect((result as any)?._count).toHaveProperty('comments');
    });

    it('not found post because of isBan.', async () => {
      const post = (await prisma.post.findFirst({
        where: {
          caption: 'timeline-isban-caption',
        },
      })) as Post;

      await expect(postService.findById(post.id)).rejects.toThrow();
    });
  });

  describe('myTimeline', () => {
    it('return timelines.', async () => {
      const firstUser = await fetchFirstTestUser();
      const thirdUser = await fetchThirdTestUser();
      await followTestUser(thirdUser, firstUser);
      const newPost = await createPost(thirdUser, 'hello caption here');
      const resultFirst = await postService.myTimeline(firstUser);
      const resultThird = await postService.myTimeline(thirdUser);

      expect(resultFirst.length).not.toBe(resultThird.length);

      await deletePost(newPost.id);
      await unFollowTestUser(thirdUser, firstUser);
    });

    it('currentUserIsMembership true.', async () => {
      const firstUser = await fetchFirstTestUser();
      const thirdUser = await fetchThirdTestUser();
      await followTestUser(firstUser, thirdUser);
      const newPost = await createPost(thirdUser, 'hello caption #here');
      const price = await prisma.price.create({
        data: {
          amount: 100,
          jpy: 100,
          currency: 'jpy',
        },
      });
      const membership = await prisma.membership.create({
        data: {
          priceId: price.id,
          stripePriceId: 'currentUserIsMembership-test-stripePriceId',
          stripeProductId: 'currentUserIsMembership-test-stripeProductId',
          userId: thirdUser.id,
        },
      });
      const subscription = await prisma.subscription.create({
        data: {
          membershipId: membership.id,
          sellerId: thirdUser.id,
          buyerId: firstUser.id,
          stripeSubscriptionKey: 'currentUserIsMembership-test-stripeSubscriptionKey',
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      });

      const result = await postService.myTimeline(firstUser);
      const post = result[0];
      const user = post.user as User & { currentUserIsMembership: boolean };
      expect(user.currentUserIsMembership).toBe(true);

      await deletePost(newPost.id);
      await unFollowTestUser(firstUser, thirdUser);
      await prisma.subscription.delete({ where: { id: subscription.id } });
      await prisma.membership.delete({ where: { id: membership.id } });
    });
  });

  describe('portfolios', () => {
    it('return empty array', async () => {
      const noUserId = 1000;
      const result = await postService.portfolios(noUserId);

      expect(result).toHaveLength(0);
    });

    it('return portfolios', async () => {
      const firstUser = await fetchFirstTestUser();
      const firstPost = await fetchFirstTestPost();
      const tag = await prisma.tag.create({
        data: {
          userId: firstUser.id,
        },
      });
      await prisma.post.update({
        where: {
          id: firstPost.id,
        },
        data: {
          tags: {
            connect: [{ id: tag.id }],
          },
        },
      });
      const result = await postService.portfolios(firstUser.id);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('addFav', () => {
    it('create relationship', async () => {
      const firstPost = await fetchFirstTestPost();
      await postService.addFav(postUser, { postId: firstPost.id });

      const post = await fetchPostFav(firstPost.id);

      const favs = post?.favs ?? [];
      const fav = favs[0];

      expect(fav.userId).toBe(postUser.id);
      expect(fav.postId).toBe(firstPost.id);
    });

    it('duplicated error', async () => {
      const firstPost = await fetchFirstTestPost();

      await expect(postService.addFav(postUser, { postId: firstPost.id })).rejects.toThrow();
    });
  });

  describe('findFavorites', () => {
    it('returns only favorites posts', async () => {
      const firstUser = await fetchFirstTestUser();
      const posts = await postService.findFavorites(firstUser);

      posts.map((post) => expect(post.isFav).toBe(true));
    });
  });

  describe('removeFav', () => {
    it('delete relationship', async () => {
      const firstPost = await fetchFirstTestPost();

      const fav = await prisma.fav.findFirst({
        where: { userId: postUser.id, postId: firstPost.id },
      });

      if (!fav) {
        throw Error('not found fav');
      }

      const post = await postService.removeFav(postUser, {
        postId: firstPost.id,
      });

      expect(post.favs).toBe(undefined);
    });

    it('throw error', async () => {
      const firstUser = await fetchFirstTestUser();

      await expect(postService.removeFav(firstUser, { postId: 10000 })).rejects.toThrow();
    });
  });

  describe('findPostsByUserId', () => {
    it('get posts that the user has.', async () => {
      const { id } = await fetchFirstTestUser();

      const posts = await postService.findPostsByUserId(id);

      expect(posts[0].userId).toBe(id);
    });
  });

  describe('findPostsByHashTagId', () => {
    it('get posts that the user has.', async () => {
      const hashTag = await fetchHashTag(firstHashTag.name);
      const posts = await postService.findPostsByHashTag(hashTag?.id ?? -1);

      const hashtags = parseHashTags(posts[0].caption);
      expect(hashtags[0]).toBe(firstHashTag.name);
    });
  });

  describe('findPostsByTag', () => {
    it('returns posts that has one or more relationship with specified tag.', async () => {
      const firstUser = await fetchFirstTestUser();
      const newPost = await createPost(firstUser, 'findPostsByTagCaption');
      const tag = await prisma.tag.create({
        data: {
          posts: {
            connect: [{ id: newPost.id }],
          },
          user: {
            connect: {
              id: firstUser.id,
            },
          },
        },
      });

      const posts = await postService.findPostsByTag(tag.id);

      posts.map((post) => {
        expect((post.tags as Tag[]).some((t) => t.id === tag.id));
      });
    });
  });

  describe('createPost', () => {
    it('with uploading file.', async () => {
      const { mockCreatePost } = setup();
      const { user, createPostInput } = createMockInputData();

      await postService.createPost(user, createPostInput);

      expect(mockCreatePost).toBeCalled();
    });

    it('with hashTags.', async () => {
      const { mockUpdatePost } = setup();
      const { user, createPostInput } = createMockInputData();
      createPostInput.caption = 'hello #hashtag';

      await postService.createPost(user, createPostInput);

      expect(mockUpdatePost).toBeCalled();
    });

    it('upload video file.', async () => {
      const { mockCreatePost, completeMultiupload, sendQueue } = setup();
      const { user, createVideoInput } = createMockInputData();

      await postService.createPost(user, createVideoInput, false);

      expect(mockCreatePost).toBeCalled();
      expect(completeMultiupload).toBeCalled();
      expect(sendQueue).toBeCalled();
    });
  });

  // describe('updatePost', () => {
  //   it('no post.', async () => {
  //     const { updatePostInput } = createMockInputData();
  //
  //     updatePostInput.postId = 2;
  //
  //     await expect(postService.updatePost(updatePostInput)).rejects.toThrow(
  //       `post does not exist. postId: 2.`,
  //     );
  //   });
  //
  //   it('update post.', async () => {
  //     const { mockUpdatePost } = setup();
  //     const { updatePostInput } = createMockInputData();
  //
  //     await postService.updatePost(updatePostInput);
  //
  //     expect(mockUpdatePost).toBeCalled();
  //   });
  // });

  describe('deletePost', () => {
    it('not delete.', async () => {
      const { mockExecuteRaw } = setup();

      const postId = 2;
      const { deletePostInput } = createMockInputData();
      deletePostInput.postId = postId;

      await expect(postService.deletePost(deletePostInput)).rejects.toThrow(
        `post does not exist. postId: 2.`,
      );

      expect(mockExecuteRaw).not.toHaveBeenCalled();
    });

    it('delete photos.', async () => {
      const { mockExecuteRaw } = setup();

      const postId = 1;
      const { deletePostInput } = createMockInputData();
      deletePostInput.postId = postId;

      await postService.deletePost(deletePostInput);

      expect(mockExecuteRaw).toHaveBeenCalled();
    });
  });
});
