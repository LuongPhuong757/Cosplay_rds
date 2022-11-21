import 'reflect-metadata';
import { Result } from '@common/response/result.enum';
import { InfoType } from '@modules/notification/enum/info-type';
import { NotificationService } from '@modules/notification/notification.service';
import { SettingValue } from '@modules/user-private/enum/setting-value';
import { User } from '@modules/user/user.model';
import { fetchTestUser, fetchFirstTestUser, fetchSecondTestUser, dayBefore } from '../../helper';
import { prisma } from '../../prisma-instance';

describe('NotificationService', () => {
  const notificationService = new NotificationService(prisma);
  let firstUser: User;
  let secondUser: User;

  beforeAll(async () => {
    await setup();
  });

  const setup = async () => {
    firstUser = await prisma.user.create({
      data: {
        name: 'noti1-name',
        account: 'noti1-account',
        auth0Id: 'noti1-auth0Id',
        userPrivate: {
          create: {
            email: 'noti1@gmail.com',
            readTime: dayBefore(1),
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });

    secondUser = await prisma.user.create({
      data: {
        name: 'noti2-name',
        account: 'noti2-account',
        auth0Id: 'noti2-auth0Id',
        userPrivate: {
          create: {
            email: 'noti2@gmail.com',
            readTime: dayBefore(1),
          },
        },
      },
    });
  };

  describe('notifications', () => {
    it('returns notifications', async () => {
      await notificationService.createNotification(secondUser.id, firstUser.id, InfoType.FOLLOW);
      await prisma.notification.create({
        data: {
          receivedId: firstUser.id,
          senderId: secondUser.id,
          infoType: InfoType.FOLLOW,
          created: dayBefore(10),
        },
      });

      const notifications = await notificationService.notifications(firstUser);

      expect(
        notifications.filter((notification) => notification.unread).length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        notifications.filter((notification) => !notification.unread).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('returns topPriority notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          senderId: secondUser.id,
          infoType: InfoType.ANNOUNCEMENT,
          created: dayBefore(10),
        },
      });

      const notifications = await notificationService.notifications(firstUser);

      expect(notifications[0].infoType).toBe(InfoType.ANNOUNCEMENT);

      await prisma.notification.delete({
        where: {
          id: notification.id,
        },
      });
    });

    it('returns annoucement notifications that are created 2weeks ago', async () => {
      const notification = await prisma.notification.create({
        data: {
          senderId: secondUser.id,
          infoType: InfoType.ANNOUNCEMENT,
          created: dayBefore(30),
        },
      });

      const notifications = await notificationService.notifications(firstUser);

      expect(notifications[0].infoType).not.toBe(InfoType.ANNOUNCEMENT);

      await prisma.notification.delete({
        where: {
          id: notification.id,
        },
      });
    });

    it('returns annoucement notifications with query', async () => {
      await prisma.notification.create({
        data: {
          senderId: secondUser.id,
          infoType: InfoType.ANNOUNCEMENT,
          created: dayBefore(10),
        },
      });

      const notifications = await notificationService.notifications(firstUser, { offset: 1 });

      expect(notifications[0].infoType).not.toBe(InfoType.ANNOUNCEMENT);
    });

    it('returns only notifications except from annoucement', async () => {
      await prisma.notification.create({
        data: {
          senderId: secondUser.id,
          infoType: InfoType.ANNOUNCEMENT,
          created: dayBefore(10),
        },
      });

      const updateUser = await prisma.user.update({
        where: {
          id: firstUser.id,
        },
        data: {
          userPrivate: {
            update: {
              setting: {
                announcement: false,
              },
            },
          },
        },
        include: {
          userPrivate: true,
        },
      });

      const notifications = await notificationService.notifications(updateUser);

      expect(notifications[0].infoType).not.toBe(InfoType.ANNOUNCEMENT);
    });
  });

  describe('readNotification', () => {
    it('returns ok', async () => {
      const oldReadTime = firstUser?.userPrivate?.readTime;
      const result = await notificationService.readNotification(firstUser);
      const user = await prisma.user.findFirst({
        where: {
          id: firstUser.id,
        },
        include: {
          userPrivate: true,
        },
      });

      expect(result.result).toBe(Result.ok);
      expect(oldReadTime).not.toBe(user?.userPrivate?.readTime);
    });
  });

  describe('totalUnreadNotification', () => {
    it('returns totalUnread', async () => {
      await notificationService.createNotification(secondUser.id, firstUser.id, InfoType.FAV);
      const user = (await prisma.user.findFirst({
        where: { id: firstUser.id },
        include: { userPrivate: true },
      })) as User;

      const total = await notificationService.totalUnreadNotification(user);

      expect(total.totalUnread).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createNotification', () => {
    it('create notification', async () => {
      const f = await fetchFirstTestUser();
      const s = await fetchSecondTestUser();
      const newNotification = await notificationService.createNotification(
        f.id,
        s.id,
        InfoType.FAV,
      );

      expect(newNotification).toHaveProperty('id');
      expect(newNotification).toHaveProperty('infoType');
      expect(newNotification).toHaveProperty('receivedId');
      expect(newNotification).toHaveProperty('senderId');
      expect(newNotification).toHaveProperty('created');
      expect(newNotification?.postId).toBe(null);
    });

    it('create notification with postId', async () => {
      const f = await fetchFirstTestUser();
      const s = await fetchSecondTestUser();
      const postId = 1;

      const newNotification = await notificationService.createNotification(
        f.id,
        s.id,
        InfoType.FAV,
        postId,
      );

      expect(newNotification?.postId).toBe(1);
    });

    it('SettingValue.All', async () => {
      const f = await fetchTestUser(firstUser.name);
      const s = await fetchTestUser(secondUser.name);
      const postId = 1;

      await prisma.user.update({
        where: {
          id: s.id,
        },
        data: {
          userPrivate: {
            update: {
              setting: { fav: SettingValue.ALL },
            },
          },
        },
      });

      const newNotification = await notificationService.createNotification(
        f.id,
        s.id,
        InfoType.FAV,
        postId,
      );

      expect(newNotification?.postId).toBe(1);
    });

    it('SettingValue.Follow when user does not follow', async () => {
      const f = await fetchTestUser(firstUser.name);
      const s = await fetchTestUser(secondUser.name);
      const postId = 1;

      await prisma.user.update({
        where: {
          id: s.id,
        },
        data: {
          userPrivate: {
            update: {
              setting: { fav: SettingValue.FOLLOW },
            },
          },
        },
      });

      const newNotification = await notificationService.createNotification(
        f.id,
        s.id,
        InfoType.FAV,
        postId,
      );

      expect(newNotification).toBeNull();
    });

    it('SettingValue.Follow when user follow', async () => {
      const f = await fetchTestUser(firstUser.name);
      const s = await fetchTestUser(secondUser.name);
      const postId = 1;

      await prisma.user.update({
        where: {
          id: s.id,
        },
        data: {
          following: {
            connect: {
              id: f.id,
            },
          },
          userPrivate: {
            update: {
              setting: { fav: SettingValue.FOLLOW },
            },
          },
        },
      });

      const newNotification = await notificationService.createNotification(
        f.id,
        s.id,
        InfoType.FAV,
        postId,
      );

      expect(newNotification?.postId).toBe(1);
    });

    it('SettingValue.OFF', async () => {
      const f = await fetchTestUser(firstUser.name);
      const s = await fetchTestUser(secondUser.name);
      const postId = 1;

      await prisma.user.update({
        where: {
          id: s.id,
        },
        data: {
          userPrivate: {
            update: {
              setting: { fav: SettingValue.OFF },
            },
          },
        },
      });

      const newNotification = await notificationService.createNotification(
        f.id,
        s.id,
        InfoType.FAV,
        postId,
      );

      expect(newNotification).toBeNull();
    });

    it('throws exception on self action', async () => {
      const user = await fetchFirstTestUser();

      const newNotification = await notificationService.createNotification(
        user.id,
        user.id,
        InfoType.FAV,
      );

      expect(newNotification).toBe(null);
    });

    it('throw user no exists', async () => {
      await expect(
        notificationService.createNotification(1000, 2000, InfoType.FAV),
      ).rejects.toThrow();
    });
  });
});
