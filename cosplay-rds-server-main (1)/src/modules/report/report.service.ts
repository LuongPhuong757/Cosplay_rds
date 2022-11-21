import { User } from '@modules/user/user.model';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { CreatePostReportInput } from './dto/input/create-post-report';
import { CreateUserReportInput } from './dto/input/create-user-report';

@Service()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserReport(
    currentUser: User,
    createUserReportInput: CreateUserReportInput,
  ): Promise<number> {
    const { id } = currentUser;
    const { userId, comment } = createUserReportInput;
    try {
      await this.prisma.report.create({
        data: {
          senderId: id,
          reportDetail: {
            create: {
              userId,
              comment,
            },
          },
        },
      });

      return userId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`cannot send report of user. message: ${message} senderId: ${id}.`);
    }
  }

  async createPostReport(
    currentUser: User,
    createPostReportInput: CreatePostReportInput,
  ): Promise<number> {
    const { id } = currentUser;
    const { postId, comment } = createPostReportInput;
    try {
      await this.prisma.report.create({
        data: {
          senderId: id,
          reportDetail: {
            create: {
              postId,
              comment,
            },
          },
        },
      });

      return postId;
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`cannot send report of post. message: ${message} senderId: ${id}.`);
    }
  }
}
