import { Post } from '@modules/post/post.model';
import { UserPrivate } from '@modules/user-private/user-private.model';
import { UserProfileRanking } from './user-profile-ranking.model';

export type UserFollow = {
  id: number;
  account: string;
  name: string;
  icon: string | null;
  userPrivate?: UserPrivate | null;
  posts?: Post[];
  following?: UserFollow[];
  followedBy?: UserFollow[];
  UserProfileRanking?: UserProfileRanking | null;
};
