import { Comment } from '@modules/comment/comment.model';

// 降順ソート
export const commentsSort = (a: Comment, b: Comment): number => {
  const res = (b.superChat?.price?.jpy ?? 0) - (a.superChat?.price?.jpy ?? 0);
  if (res) return res;

  return b.created.getTime() - a.created.getTime();
};
