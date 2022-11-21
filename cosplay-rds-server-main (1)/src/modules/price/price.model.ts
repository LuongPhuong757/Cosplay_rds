import { Superchat } from '@modules/superchat/superchat.model';
import { User } from '@modules/user/user.model';
import { Price as PrismaPrice } from '@prisma/client';

export type Price = {
  superchat?: Superchat;
  menbership?: User;
} & PrismaPrice;
