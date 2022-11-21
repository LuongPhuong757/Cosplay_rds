import { Superchat } from '@modules/superchat/superchat.model';
import { User } from '@modules/user/user.model';
import { Comment as PrismaComment } from '@prisma/client';

export type Comment = {
  user?: User;
  superChat?: Superchat | null;
} & PrismaComment;
