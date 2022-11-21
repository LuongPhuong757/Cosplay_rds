import 'reflect-metadata';
import { injectDefaultPrivateSetting } from '@common/inject/inject-user-private-setting';
import defaultPrivate from '@configs/default-private-setting';
import { UserPrivateSetting } from '@modules/user-private/user-private-setting.model';
import { prisma } from '../../prisma-instance';

describe('injectDefaultPrivateSetting', () => {
  const createPrivateUser = async () => {
    const user = await prisma.user.findFirst({
      where: {
        account: 'authAccount',
      },
      include: {
        userPrivate: true,
      },
    });
    if (user) return user;

    return await prisma.user.create({
      data: {
        auth0Id: 'authPrivate',
        name: 'authName',
        account: 'authAccount',
        userPrivate: {
          create: {
            email: 'auth@email.com',
            setting: {
              fav: 0,
            },
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
  };

  it('when user does not have userPrivate.', async () => {
    const user = await prisma.user.create({
      data: {
        auth0Id: 'notUserPrivate',
        name: 'notUserPrivate',
        account: 'notUserPrivate',
      },
    });
    const injectedUser = injectDefaultPrivateSetting(user);

    expect(injectedUser.userPrivate).toBe(undefined);
  });

  it('user does not have setting.', async () => {
    const privateUser = await createPrivateUser();
    if (privateUser.userPrivate) privateUser.userPrivate.setting = null;
    const { userPrivate } = injectDefaultPrivateSetting(privateUser);
    if (!userPrivate) {
      throw Error('no test');
    }
    const setting = userPrivate.setting as UserPrivateSetting;

    expect(setting.fav).toBe(defaultPrivate.fav);
    expect(setting.tag).toBe(defaultPrivate.tag);
    expect(setting.tagFav).toBe(defaultPrivate.tagFav);
    expect(setting.comment).toBe(defaultPrivate.comment);
    expect(setting.follow).toBe(defaultPrivate.follow);
    expect(setting.membershipNewPost).toBe(defaultPrivate.membershipNewPost);
    expect(setting.membership).toBe(defaultPrivate.membership);
    expect(setting.mention).toBe(defaultPrivate.mention);
    expect(setting.announcement).toBe(defaultPrivate.announcement);
    expect(setting.allowTags).toBe(defaultPrivate.allowTags);
  });

  it('user has setting.', async () => {
    const privateUser = await createPrivateUser();
    const { userPrivate } = injectDefaultPrivateSetting(privateUser);

    if (!userPrivate) {
      throw Error('no test');
    }
    const setting = userPrivate.setting as UserPrivateSetting;

    expect(setting.fav).toBe(0);
    expect(setting.tag).toBe(defaultPrivate.tag);
  });
});
