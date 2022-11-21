import { CosplayContext } from '@interfaces';
import { ForbiddenError } from 'apollo-server-express';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

export const CommentGuard: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const { prisma, currentUser } = _.context as CosplayContext;
  const { commentId } = _.args.input as { commentId: number };
  if (!currentUser) throw Error('you need to be logged in.');

  const { id } = currentUser;

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      userId: id,
    },
  });
  if (!comment) {
    throw new ForbiddenError('you cannot access the data.');
  }

  return next();
};
