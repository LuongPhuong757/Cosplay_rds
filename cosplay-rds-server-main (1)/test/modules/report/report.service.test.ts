import { ReportDetail } from '@prisma/client';
import { Post } from '../../../src/modules/post/post.model';
import { ReportService } from '../../../src/modules/report/report.service';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';

describe('ReportService', () => {
  let reportService: ReportService;
  let firstUser: User;
  let secondUser: User;
  let post: Post;

  beforeAll(async () => {
    reportService = new ReportService(prisma);
    firstUser = ((await prisma.user.findMany()) as User[])[0];
    secondUser = ((await prisma.user.findMany()) as User[])[1];
    post = ((await prisma.post.findMany()) as Post[])[0];
  });

  describe('createUserReport', () => {
    it('create report of user that has correct property.', async () => {
      const result = await reportService.createUserReport(firstUser, {
        userId: secondUser.id,
        comment: 'this is report of user.',
      });
      const reportDetail = (await prisma.reportDetail.findFirst({
        orderBy: {
          created: 'desc',
        },
      })) as ReportDetail;

      expect(result).toBe(secondUser.id);
      expect(reportDetail).toHaveProperty('id');
      expect(reportDetail).toHaveProperty('comment');
      expect(reportDetail).toHaveProperty('userId');
      expect(reportDetail.postId).toBe(null);
      expect(reportDetail).toHaveProperty('created');
      expect(reportDetail).toHaveProperty('reportId');
    });

    it('throw error because user does not exist.', async () => {
      await expect(
        reportService.createUserReport(firstUser, {
          userId: 10000,
          comment: 'this is report of no exist user.',
        }),
      ).rejects.toThrow();
    });
  });

  describe('createPostReport', () => {
    it('create report of post that has correct property.', async () => {
      const result = await reportService.createPostReport(firstUser, {
        postId: post.id,
        comment: 'this is report of post.',
      });
      const reportDetail = (await prisma.reportDetail.findFirst({
        orderBy: {
          created: 'desc',
        },
      })) as ReportDetail;

      expect(result).toBe(post.id);
      expect(reportDetail).toHaveProperty('id');
      expect(reportDetail).toHaveProperty('comment');
      expect(reportDetail.userId).toBe(null);
      expect(reportDetail).toHaveProperty('postId');
      expect(reportDetail).toHaveProperty('created');
      expect(reportDetail).toHaveProperty('reportId');
    });

    it('throw error because post does not exist.', async () => {
      await expect(
        reportService.createPostReport(firstUser, {
          postId: 10000,
          comment: 'this is report of no exist post.',
        }),
      ).rejects.toThrow();
    });
  });
});
