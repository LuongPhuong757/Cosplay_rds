import { CosplayContext } from '@interfaces';
import { User } from '@modules/user/user.model';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

export const GetBlockUsers: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const context = _.context as CosplayContext;

  const { prisma, currentUser } = context;
  if (!currentUser) return next();

  const { id } = currentUser;
  const user = (await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      blocking: {
        select: {
          id: true,
        },
      },
      blockedBy: {
        select: {
          id: true,
        },
      },
    },
  })) as User & { blocking: { id: number }[]; blockedBy: { id: number }[] };

  if (!user) next();

  currentUser.blocking = user.blocking;
  currentUser.blockedBy = user.blockedBy;

  return next();
};
