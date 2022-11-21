import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@modules/user/user.model';
import { Resolver, Arg, Mutation, Authorized, Int } from 'type-graphql';
import { Service } from 'typedi';
import { CreatePostReportInput } from './dto/input/create-post-report';
import { CreateUserReportInput } from './dto/input/create-user-report';
import { ReportService } from './report.service';

@Service()
@Resolver()
export class ReportResolver {
  constructor(private readonly reportService: ReportService) {}

  @Mutation((returns) => Int, { description: 'ユーザを通報する。' })
  @Authorized()
  async createUserReport(
    @GetCurrentUser() currentUser: User,
    @Arg('input') createUserReportInput: CreateUserReportInput,
  ): Promise<number> {
    return await this.reportService.createUserReport(currentUser, createUserReportInput);
  }

  @Mutation((returns) => Int, { description: '投稿画像・動画を通報する。' })
  @Authorized()
  async createPostReport(
    @GetCurrentUser() currentUser: User,
    @Arg('input') createPostReportInput: CreatePostReportInput,
  ): Promise<number> {
    return await this.reportService.createPostReport(currentUser, createPostReportInput);
  }
}
