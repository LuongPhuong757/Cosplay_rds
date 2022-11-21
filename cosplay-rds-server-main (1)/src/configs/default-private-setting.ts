import { SettingValue } from '@modules/user-private/enum/setting-value';
import { UserPrivateSetting } from '@modules/user-private/user-private-setting.model';

export default {
  fav: SettingValue.ALL,
  tag: SettingValue.ALL,
  tagFav: SettingValue.ALL,
  comment: true,
  follow: true,
  membershipNewPost: true,
  membership: true,
  mention: true,
  announcement: true,
  allowTags: SettingValue.ALL,
} as UserPrivateSetting;
