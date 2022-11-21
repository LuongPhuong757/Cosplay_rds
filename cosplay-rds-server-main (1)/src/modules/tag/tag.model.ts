import { Event } from '@modules/event/event.model';
import { Post } from '@modules/post/post.model';
import { User } from '@modules/user/user.model';
import { Tag as PrismaTag } from '@prisma/client';

export type Tag = {
  user?: User | null;
  event?: Event | null;
  posts?: Post[];
} & PrismaTag;
