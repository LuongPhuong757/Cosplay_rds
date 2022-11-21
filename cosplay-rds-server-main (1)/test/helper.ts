import { User, Comment, HashTag, Superchat, Prisma } from '@prisma/client';
import SQS from 'aws-sdk/clients/sqs';
import { PagingOptionsInput } from '../src/common/pagination/paging-options.input';
import { CommentRepository } from '../src/modules/comment/comment.repository';
import { CommentService } from '../src/modules/comment/comment.service';
import { NotificationService } from '../src/modules/notification/notification.service';
import { Post } from '../src/modules/post/post.model';
import { ScoreLogRepository } from '../src/modules/score-log/score-log.repository';
import { ScoreLogService } from '../src/modules/score-log/score-log.service';
import { UserPrivate } from '../src/modules/user-private/user-private.model';
import { firstUser, secondUser, thirdUser, firstPost, secondPost } from './data';
import { prisma } from './prisma-instance';

interface UserType extends User {
  userPrivate: UserPrivate;
}

const FIRST_COMMENT = 'hello comment';

export const fetchTestUser = async (name: string): Promise<UserType> => {
  const user = (await prisma.user.findFirst({
    where: {
      name,
    },
  })) as UserType;

  return user;
};

export const fetchUser = async (args: Prisma.UserFindFirstArgs): Promise<UserType> => {
  const user = (await prisma.user.findFirst(args)) as UserType;

  return user;
};

export const deleteTestUserPrviate = async (id: number): Promise<void> => {
  const userPrivate = await prisma.userPrivate.findFirst({
    where: {
      userId: id,
    },
  });

  if (!userPrivate) {
    throw Error('no user private');
  }

  await prisma.userPrivate.delete({
    where: {
      id: userPrivate.id,
    },
  });
};

export const deleteTestUser = async (id: number): Promise<void> => {
  await prisma.user.delete({
    where: {
      id,
    },
  });
};

export const newCommentService = (): CommentService => {
  const commentRepository = new CommentRepository(prisma);
  const notificationService = new NotificationService(prisma);
  const scoreLogRepository = new ScoreLogRepository(prisma);
  const scoreLogService = new ScoreLogService(scoreLogRepository);

  return new CommentService(prisma, commentRepository, notificationService, scoreLogService);
};

export const addFirstTestComment = async (): Promise<Comment> => {
  const commentService = newCommentService();
  const user = await fetchFirstTestUser();
  const { id: postId } = await fetchFirstTestPost();

  const newComment = await commentService.createComment(user, { postId, comment: FIRST_COMMENT });

  return newComment;
};

export const addFirstReplyComment = async (): Promise<Comment> => {
  const commentService = newCommentService();
  const user = await fetchFirstTestUser();
  const { id: postId } = await fetchFirstTestPost();
  const comment = await fetchTestComment(FIRST_COMMENT);

  return await commentService.replyComment(user, {
    postId,
    comment: 'hello reply comment.',
    commentId: comment.id,
  });
};

export const fetchFirstTestUser = async (): Promise<UserType> => {
  const { name } = firstUser;

  const user = (await prisma.user.findFirst({
    where: {
      name,
    },
    include: {
      userPrivate: true,
    },
  })) as UserType;

  return user;
};

export const fetchHashTag = async (name: string): Promise<HashTag | null> => {
  const hashTag = (await prisma.hashTag.findFirst({
    where: {
      name,
    },
  })) as User;

  return hashTag;
};

export const fetchSecondTestUser = async (): Promise<UserType> => {
  const { name } = secondUser;

  const user = (await prisma.user.findFirst({
    where: {
      name,
    },
    include: {
      userPrivate: true,
    },
  })) as UserType;

  return user;
};

export const fetchFirstTestPost = async (): Promise<Post> => {
  const { caption } = firstPost;

  const post = (await prisma.post.findFirst({
    where: {
      caption,
    },
  })) as Post;

  return post;
};

export const fetchSecondTestPost = async (): Promise<Post> => {
  const { caption } = secondPost;

  const post = (await prisma.post.findFirst({
    where: {
      caption,
    },
  })) as Post;

  return post;
};

export const fetchTestComment = async (comment?: string): Promise<Comment> => {
  const finded = (await prisma.comment.findFirst({
    where: {
      comment: comment || FIRST_COMMENT,
    },
  })) as Comment;

  return finded;
};

export const fetchThirdTestUser = async (): Promise<UserType> => {
  const { name } = thirdUser;

  const user = (await prisma.user.findFirst({
    where: {
      name,
    },
  })) as UserType;

  return user;
};

export const deleteHashTag = async (id: number): Promise<void> => {
  await prisma.hashTag.delete({
    where: {
      id,
    },
  });
};

export const noExistUserId = 10000;

export const pagingOptions = { limit: 10, offset: 0 };

export const generatePageOptionsInput = (): PagingOptionsInput => {
  return {
    offset: 0,
    limit: 10,
  };
};

export const followTestUser = async (userA: User, userB: User): Promise<void> => {
  await prisma.user.update({
    where: {
      id: userA.id,
    },
    data: {
      following: {
        connect: {
          id: userB.id,
        },
      },
    },
  });
};

export const unFollowTestUser = async (userA: User, userB: User): Promise<void> => {
  await prisma.user.update({
    where: {
      id: userA.id,
    },
    data: {
      following: {
        disconnect: {
          id: userB.id,
        },
      },
    },
  });
};

export const createUser = async (input: {
  auth0Id: string;
  name: string;
  account: string;
  icon: string;
  isBan: boolean;
}): Promise<User> => {
  return await prisma.user.create({
    data: {
      ...input,
    },
  });
};

export const createPost = async (user: User, caption: string): Promise<Post> => {
  return await prisma.post.create({
    data: {
      userId: user.id,
      caption,
    },
  });
};

export const deletePost = async (postId: number): Promise<void> => {
  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

export const fetchPostFav = async (postId: number): Promise<Post> => {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
    },
    include: {
      favs: true,
      user: true,
    },
  });

  if (!post) {
    throw Error('not post');
  }

  return post;
};

export const fetchSuperChat = async (args: Prisma.SuperchatFindFirstArgs): Promise<Superchat> => {
  const superchat = await prisma.superchat.findFirst(args);
  if (!superchat) {
    throw Error('superchat is not found');
  }

  return superchat;
};

export const dayBefore = (days: number): Date => {
  return new Date(new Date().setDate(new Date().getDate() - days));
};

export const mockMessageAttributes = (): SQS.MessageBodyAttributeMap => {
  return {
    amount: {
      StringValue: '1400',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'Number',
    },
    auth0Id: {
      StringValue: '1',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
    comment: {
      StringValue: 'comment',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
    currency: {
      StringValue: 'usd',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
    postId: {
      StringValue: '1',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'Number',
    },
    replyId: {
      StringValue: '1',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'Number',
    },
    payload: {
      StringValue: '',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
  };
};

export const setFutureDistributedTimestamp = async (): Promise<void> => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  await prisma.distributedTimestamp.create({
    data: {
      timestamp: next,
    },
  });
};

export const setCots = async (userId: number, remain: number, received: number): Promise<void> => {
  await prisma.userPrivate.update({
    data: {
      remainCot: remain,
      receivedCot: received,
    },
    where: {
      id: userId,
    },
  });
};
