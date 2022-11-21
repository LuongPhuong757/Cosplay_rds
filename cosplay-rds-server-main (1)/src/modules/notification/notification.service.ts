import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { SettingValue } from '@modules/user-private/enum/setting-value';
import { UserPrivateSetting } from '@modules/user-private/user-private-setting.model';
import { User } from '@modules/user/user.model';
import { INFO_TYPE } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import dayjs from 'dayjs';
import { Service } from 'typedi';
import { TotalUnreadNotificationResponse } from './dto/response/total-unread-noitfication';
import { InfoType } from './enum/info-type';
import { Notification } from './notification.model';

@Service()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  // cacheに入れる
  // notificationを更新する度にcacheを削除する
  async notifications(
    currentUser: User,
    pagingOptions?: PagingOptionsInput,
  ): Promise<Array<Notification & { sender?: User; unread: boolean }>> {
    const { id } = currentUser;
    const readTime = currentUser.userPrivate?.readTime;
    const setting = currentUser.userPrivate?.setting as UserPrivateSetting;
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    // 運営からのお知らせがOFFの場合のみ
    if (!(setting?.announcement ?? true)) {
      const notifications = await this.prisma.notification.findMany({
        ...pagingOptionsQuery,
        orderBy: [
          {
            created: 'desc',
          },
        ],
        where: {
          receivedId: id,
          NOT: {
            infoType: INFO_TYPE.ANNOUNCEMENT,
          },
        },
        include: {
          sender: true,
        },
      });

      return this.addUnread(notifications, readTime);
    }

    const topPriorityNotificationsCount = await this.prisma.notification.count({
      where: {
        created: {
          gt: dayjs().subtract(2, 'weeks').toDate(),
        },
        infoType: INFO_TYPE.ANNOUNCEMENT,
      },
    });

    // 2週間以内の通知を取得
    const topPriorityNotifications = await this.prisma.notification.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          created: 'desc',
        },
      ],
      where: {
        created: {
          gt: dayjs().subtract(2, 'weeks').toDate(),
        },
        infoType: INFO_TYPE.ANNOUNCEMENT,
      },
      include: {
        sender: true,
      },
    });

    // 以下は、paginationと2週間以内の優先通知の処理を行っている
    if (topPriorityNotificationsCount < topPriorityNotifications.length) {
      return this.addUnread(topPriorityNotifications, readTime);
    }

    if (pagingOptionsQuery.take) {
      pagingOptionsQuery.take = pagingOptionsQuery.take - topPriorityNotifications.length;
    }

    if (pagingOptionsQuery.skip) {
      pagingOptionsQuery.skip =
        pagingOptionsQuery.skip - topPriorityNotificationsCount >= 0
          ? pagingOptionsQuery.skip - topPriorityNotificationsCount
          : 0;
    }

    const notifications = await this.prisma.notification.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          created: 'desc',
        },
      ],
      where: {
        OR: [
          {
            receivedId: id,
          },
          {
            infoType: INFO_TYPE.ANNOUNCEMENT,
            created: {
              lt: dayjs().subtract(2, 'weeks').toDate(),
            },
          },
        ],
      },
      include: {
        sender: true,
      },
    });

    return this.addUnread([...topPriorityNotifications, ...notifications], readTime);
  }

  async readNotification(currentUser: User): Promise<ResultResponse> {
    const { id } = currentUser;
    try {
      await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          userPrivate: {
            update: {
              readTime: new Date(),
            },
          },
        },
      });

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      return {
        result: Result.ng,
      };
    }
  }

  async totalUnreadNotification(currentUser: User): Promise<TotalUnreadNotificationResponse> {
    const readTime = currentUser.userPrivate?.readTime;
    try {
      const totalUnread = await this.prisma.notification.count({
        where: {
          receivedId: currentUser.id,
          created: {
            gte: readTime ?? new Date('2000'),
          },
        },
      });

      return {
        totalUnread,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`cannot return total unread. userId: ${currentUser.id}`);
    }
  }

  async createNotification(
    senderId: number,
    receivedId: number,
    infoType: InfoType,
    postId?: number,
  ): Promise<Notification | null> {
    try {
      const isNeedNotify = await this.needNotify(senderId, receivedId, infoType);
      if (!isNeedNotify) return null;

      return await this.prisma.notification.create({
        data: {
          senderId,
          receivedId,
          infoType,
          postId: postId ?? null,
        },
      });
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(
        `cannot create notification. message: ${message} senderId: ${senderId} receivedId: ${receivedId}`,
      );
    }
  }

  async createNotifications(
    inputs: {
      senderId: number;
      receivedId: number;
      infoType: InfoType;
      postId?: number;
    }[],
  ): Promise<number> {
    try {
      const promises = inputs.filter(async ({ senderId, receivedId, infoType }) => {
        return await this.needNotify(senderId, receivedId, infoType);
      });

      const parmas = await Promise.all(promises);
      const data = parmas.map((param) => ({
        senderId: param.senderId,
        receivedId: param.receivedId,
        infoType: param.infoType,
        postId: param.postId ?? null,
      }));

      const res = await this.prisma.notification.createMany({
        data,
        skipDuplicates: true,
      });

      return res.count;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `cannot create notification. message: ${message} inputs: ${JSON.stringify(inputs)}`,
      );

      return 0;
    }
  }

  private needNotify = async (
    senderId: number,
    receivedId: number,
    infoType: InfoType,
  ): Promise<boolean> => {
    if (senderId === receivedId) return false; // 自分の場合

    const user = await this.prisma.user.findFirst({
      where: {
        id: senderId,
      },
      include: {
        userPrivate: true,
      },
    });
    if (!user) {
      throw Error(`user does not exist.`);
    }

    return await this.judgeNotificationSetting(senderId, receivedId, infoType);
  };

  // TODO: ブロックしている人
  // 通知が必要かどうかを判定する
  private judgeNotificationSetting = async (
    senderId: number,
    receivedId: number,
    infoType: InfoType,
  ): Promise<boolean> => {
    const setting = await this.getReceivedUserSetting(receivedId);
    // 設定がない場合は通知する
    if (!setting) return true;

    switch (infoType) {
      // いいね
      case InfoType.FAV:
        return this.isFulfillCondition(senderId, receivedId, setting.fav);
      // 投稿にタグ付け (createPostから呼ばれる)
      case InfoType.TAG:
        return this.isFulfillCondition(senderId, receivedId, setting.tag);
      // タグ付けされた投稿へのいいね
      case InfoType.TAG_FAV:
        return this.isFulfillCondition(senderId, receivedId, setting.tagFav);
      // コメント
      case InfoType.COMMENT:
        return setting?.comment ?? true;
      // 新しくフォローされる
      case InfoType.FOLLOW:
        return setting?.follow ?? true;
      // 加入しているメンバーシップの新しい投稿の通知
      case InfoType.MEMBERSHIP_NEW_POST:
        return setting?.membershipNewPost ?? true;
      // 新しいメンバーシップ
      case InfoType.MEMBERSHIP:
        return setting?.membership ?? true;
      // コメントへのリプライ
      case InfoType.MENTION:
        return setting?.mention ?? true;
      default:
        return true;
    }
  };

  private isFulfillCondition = async (
    senderId: number,
    receivedId: number,
    settingValue: SettingValue = SettingValue.ALL, // 個別設定がない場合は通知する
  ): Promise<boolean> => {
    if (settingValue === SettingValue.FOLLOW) {
      const following = await this.prisma.user.findFirst({
        where: {
          id: receivedId,
          following: {
            some: {
              id: senderId,
            },
          },
        },
      });

      return !!following;
    }

    return settingValue === SettingValue.ALL ?? true;
  };

  private getReceivedUserSetting = async (userId: number): Promise<UserPrivateSetting | null> => {
    const userPrivate = await this.prisma.userPrivate.findFirst({
      where: {
        userId,
      },
    });
    if (!userPrivate?.setting) return null;

    return userPrivate.setting as UserPrivateSetting;
  };

  private addUnread = (
    notifications: Notification[],
    readTime?: Date | null,
  ): Array<Notification & { unread: boolean }> => {
    return notifications.map((notification) => {
      const unread = notification.created >= (readTime ?? new Date('2000'));

      return {
        ...notification,
        unread,
      };
    });
  };
}
