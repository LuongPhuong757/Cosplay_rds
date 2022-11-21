import defaultPrivateSetting from '@configs/default-private-setting';
import { User } from '@modules/user/user.model';

export const injectDefaultPrivateSetting = (user: User): User => {
  const { userPrivate } = user;

  if (!userPrivate) return user;
  const { setting } = userPrivate;

  if (setting && typeof setting === 'object') {
    const newSetting = {
      ...defaultPrivateSetting,
      ...setting,
    };
    const newUserPrivate = {
      ...userPrivate,
      setting: newSetting,
    };

    return {
      ...user,
      userPrivate: newUserPrivate,
    };
  }

  const newUserPrivate = {
    ...userPrivate,
    setting: defaultPrivateSetting,
  };

  return {
    ...user,
    userPrivate: newUserPrivate,
  };
};
