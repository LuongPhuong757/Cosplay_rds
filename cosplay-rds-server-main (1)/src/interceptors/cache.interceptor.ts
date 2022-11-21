import { CacheContext, TokenListRecord } from '@interfaces';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';
import { cache } from '../cache';

// NOTE: 今のところCoingeckoProviderAPI専用
export const CacheInterceptor: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const context = _.context as CacheContext<TokenListRecord>;
  const { fieldName } = _.info;

  const value = cache.get(fieldName);
  context.cacheData = value;
  context.fieldName = fieldName;

  return next();
};
