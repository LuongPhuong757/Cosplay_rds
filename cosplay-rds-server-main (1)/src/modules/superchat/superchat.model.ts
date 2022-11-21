import { Price } from '@modules/price/price.model';
import { User } from '@modules/user/user.model';
import { Superchat as SuperchatPrisma } from '@prisma/client';

export type Superchat = {
  user?: User;
  price?: Price;
} & SuperchatPrisma;
