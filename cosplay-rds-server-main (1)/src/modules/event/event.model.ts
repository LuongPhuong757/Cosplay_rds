import { Tag } from '@modules/tag/tag.model';
import { Event as PrismaEvent } from '@prisma/client';

export type Event = {
  tag?: Tag | null;
} & PrismaEvent;
