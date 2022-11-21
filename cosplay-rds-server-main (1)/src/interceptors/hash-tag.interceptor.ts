import { removeHeadHashTag } from '@common/parser/remove-head-hash-tag';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

export const HashTagInterceptor: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const { args } = _;
  const { query } = args;
  const parsed = removeHeadHashTag(query);

  args.query = parsed;

  return next();
};
