import { CommentRepository } from '@modules/comment/comment.repository';
import { CommentService } from '@modules/comment/comment.service';
import { NotificationService } from '@modules/notification/notification.service';
import { ScoreLogRepository } from '@modules/score-log/score-log.repository';
import { ScoreLogService } from '@modules/score-log/score-log.service';
import { User } from '@modules/user/user.model';
import { INFO_TYPE } from '@prisma/client';
import {
  fetchFirstTestUser,
  fetchFirstTestPost,
  fetchTestComment,
  generatePageOptionsInput,
  addFirstReplyComment,
  addFirstTestComment,
} from '../../helper';
import { prisma } from '../../prisma-instance';

describe('CommentService', () => {
  const commentRepository = new CommentRepository(prisma);
  const notificationService = new NotificationService(prisma);
  const scoreLogRepository = new ScoreLogRepository(prisma);
  const scoreLogService = new ScoreLogService(scoreLogRepository);
  const commentService = new CommentService(
    prisma,
    commentRepository,
    notificationService,
    scoreLogService,
  );
  let firstUser: User;

  beforeAll(async () => {
    await setup();
  });

  const setup = async () => {
    firstUser = await prisma.user.create({
      data: {
        name: 'com1-name',
        account: 'com1-account',
        auth0Id: 'com1-auth0Id',
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
  };

  describe('get comments', () => {
    it('get comments.', async () => {
      const user = await fetchFirstTestUser();
      const { id: postId } = await fetchFirstTestPost();
      const paging = generatePageOptionsInput();
      const result = await commentService.comments(user, paging, postId);

      for (const res of result) {
        expect(res.replyId).toBeNull();
      }
    });

    it('get reply comments.', async () => {
      const user = await fetchFirstTestUser();
      const { id: postId } = await fetchFirstTestPost();
      await addFirstTestComment();
      const replied = await addFirstReplyComment();
      const paging = generatePageOptionsInput();
      const result = await commentService.comments(user, paging, postId, replied.replyId || 0);

      expect(result.length).toBe(1);
    });

    it('filter reply comments.', async () => {
      const user = await fetchFirstTestUser();
      const { id: postId } = await fetchFirstTestPost();
      const paging = generatePageOptionsInput();
      const result = await commentService.comments(user, paging, postId);

      await addFirstReplyComment();
      const resultAfterReplied = await commentService.comments(user, paging, postId);

      expect(result.length).toBe(resultAfterReplied.length);
      for (const res of resultAfterReplied) {
        expect(res.replyId).toBeNull();
      }
    });
  });

  describe('createComment', () => {
    it('create comment beloging to user and post with notification.', async () => {
      const post = await fetchFirstTestPost();
      const comment = 'hello comment';

      const newComment = await commentService.createComment(firstUser, {
        postId: post.id,
        comment,
      });

      const notification = await prisma.notification.findFirst({
        orderBy: {
          created: 'desc',
        },
        where: {
          receivedId: post.userId,
          postId: post.id,
        },
      });

      expect(newComment).toEqual(
        expect.objectContaining({ userId: firstUser.id, postId: post.id }),
      );
      expect(notification?.infoType).toBe(INFO_TYPE.COMMENT);
    });
  });

  describe('replyComment', () => {
    it('reply comment with notification.', async () => {
      const post = await fetchFirstTestPost();
      const comment = 'hello comment';

      const finded = await fetchTestComment(comment);

      const replyComment = await commentService.replyComment(firstUser, {
        postId: post.id,
        comment: 'hello comment test',
        commentId: finded.id,
      });

      const notification = await prisma.notification.findFirst({
        orderBy: {
          created: 'desc',
        },
        where: {
          receivedId: post.userId,
          postId: post.id,
        },
      });

      expect(replyComment).toEqual(
        expect.objectContaining({ userId: firstUser.id, postId: post.id, replyId: finded.id }),
      );
      expect(replyComment).toEqual(
        expect.objectContaining({ userId: firstUser.id, postId: post.id, replyId: finded.id }),
      );
      expect(notification?.infoType).toBe(INFO_TYPE.MENTION);
    });
  });

  describe('deleteComment', () => {
    it('delete comment.', async () => {
      const comment = 'hello comment';
      const finded = await fetchTestComment(comment);

      const result = await commentService.deleteComment({ commentId: finded.id });

      expect(result).toBe(finded.id);
    });
  });
});
