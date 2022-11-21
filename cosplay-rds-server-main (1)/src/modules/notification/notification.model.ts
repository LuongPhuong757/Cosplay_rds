import { User } from '@modules/user/user.model';
import { Notification as PrismaNotification } from '@prisma/client';

export type Notification = {
  sender?: User;
} & PrismaNotification;
