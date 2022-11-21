import { CosplayContext } from '@interfaces';
import { ForbiddenError } from 'apollo-server-express';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

export const PostGuard: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const { prisma, currentUser } = _.context as CosplayContext;
  const { postId } = _.args.input as { postId: number };
  if (!currentUser) throw Error('you need to be logged in.');

  const { id } = currentUser;
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId: id,
    },
  });
  if (!post) {
    throw new ForbiddenError('you cannot access the data.');
  }

  return next();
};
