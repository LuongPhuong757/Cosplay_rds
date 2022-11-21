import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { ResultResponse } from '@common/response/result.response';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Resolver, Query, Arg, Mutation, Authorized, FieldResolver, Root, Int } from 'type-graphql';
import { Service } from 'typedi';
import { NotificationResponse } from './dto/response/notification';
import { TotalUnreadNotificationResponse } from './dto/response/total-unread-noitfication';
import { Notification } from './notification.model';
import { NotificationService } from './notification.service';

@Service()
@Resolver((of) => NotificationResponse)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query((returns) => [NotificationResponse], {
    description: '通知一覧を取得する。',
  })
  @Authorized()
  async notifications(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Array<Notification & { sender?: User; unread: boolean }>> {
    return await this.notificationService.notifications(currentUser, pagingOptions);
  }

  @Mutation((returns) => ResultResponse, {
    description: '最後に通知を閲覧した時間を更新する。',
  })
  @Authorized()
  async readNotification(@GetCurrentUser() currentUser: User): Promise<ResultResponse> {
    return await this.notificationService.readNotification(currentUser);
  }

  @Query((returns) => TotalUnreadNotificationResponse, {
    description: '未読の通知の総数を返却する。',
  })
  @Authorized()
  async totalUnreadNotification(
    @GetCurrentUser() currentUser: User,
  ): Promise<TotalUnreadNotificationResponse> {
    return await this.notificationService.totalUnreadNotification(currentUser);
  }

  @FieldResolver((returns) => Int, {
    description: 'receiverIdを返すFieldResolver',
  })
  receivedId(@GetCurrentUser() { id }: User, @Root() { receivedId }: Notification): number {
    return receivedId ?? id;
  }
}
