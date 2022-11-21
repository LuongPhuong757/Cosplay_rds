import { Post } from './post.model';

export type PostRankig = {
  post: Omit<Post, 'photos'>;
  rank: number;
  score: number;
};
