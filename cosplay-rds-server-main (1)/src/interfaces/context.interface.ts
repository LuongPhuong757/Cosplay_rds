import { User } from '@modules/user/user.model';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { ExpressContext } from 'apollo-server-express';

export type CacheContext<T> = Context & {
  cacheData: T | unknown;
  fieldName: string;
};

export type Context = {
  currentUser: PrismaUser;
  auth0Id: string;
};

export interface CosplayContext {
  prisma: PrismaClient;
  ctx: ExpressContext;
  currentUser?: User;
  auth0Id?: string;
}
