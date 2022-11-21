import { CosplayContext } from '@interfaces';
import { ForbiddenError } from 'apollo-server-express';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

export const Auth0IdGuard: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const context = _.context as CosplayContext;
  const { auth0Id } = context;

  if (!auth0Id) {
    throw new ForbiddenError('you are not authorized.');
  }

  return next();
};
