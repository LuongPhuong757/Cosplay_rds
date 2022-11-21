import config from '@config';
import { CosplayContext } from '@interfaces';
import { ForbiddenError } from 'apollo-server-express';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

const { xApiKey } = config.app;

export const XApiKeyGuard: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const context = _.context as CosplayContext;
  const headerXApiKey = context.ctx.req.headers['x-api-key'];
  if (headerXApiKey !== xApiKey) {
    console.error('x-api key is wrong. headers:', context.ctx.req.headers);

    throw new ForbiddenError('x-api-key is wrong.');
  }

  return next();
};
