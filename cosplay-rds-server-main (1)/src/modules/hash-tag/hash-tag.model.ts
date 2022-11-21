import { Post } from '@modules/post/post.model';
import { HashTag as PrismaHashTag } from '@prisma/client';

export type HashTag = {
  posts?: Post[];
} & PrismaHashTag;

export type HashTagTrending = {
  totalPosts?: number;
} & PrismaHashTag;
