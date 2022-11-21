import { User } from './user.model';

export type UserRankingNew = {
  rank: number;
  user: User;
  score: number;
  totalFollowing: number;
  totalFollowedBy: number;
  totalPosts: number;
  isFollowing: boolean | false;
  profileRanking: { [key: string]: number | null };
};

export type UserRanking = {
  rank: number;
  user: User;
  score: number;
  totalFollowing: number;
  totalFollowedBy: number;
};
