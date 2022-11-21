import { SettingValue } from './enum/setting-value';

export type UserPrivateSetting = {
  fav: SettingValue;
  tag: SettingValue;
  tagFav: SettingValue;
  comment: boolean;
  follow: boolean;
  membershipNewPost: boolean;
  membership: boolean;
  mention: boolean;
  announcement: boolean;
  allowTags: SettingValue;
};
