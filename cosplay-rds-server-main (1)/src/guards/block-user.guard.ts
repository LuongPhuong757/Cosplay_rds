import { extractIds } from '@common/util/extract-ids';
import { CosplayContext } from '@interfaces';
import { ForbiddenError } from 'apollo-server-express';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

/**
 * 指定したResolverをブロックされているユーザが実行できないようにします。
 *
 * Basic usage example: GetBlockUsersとセットで使います。
 * ```ts
 * @UseMiddleware(GetBlockUsers)
 * @UseMiddleware(BlockUserGuard)
 * function() {}
 * ```
 *
 * @param _ - ResolverData
 * @param next - NextFn
 * @returns - void
 */
export const BlockUserGuard: MiddlewareFn = async (_: ResolverData, next: NextFn) => {
  const context = _.context as CosplayContext;
  const args = _.args as { [key: string]: number };

  const { currentUser } = context;
  if (!currentUser || !currentUser.blockedBy) return next();

  const { userId } = args;
  if (currentUser.blockedBy.map(extractIds).indexOf(userId) !== -1) {
    throw new ForbiddenError('you have been blocked.');
  }

  return next();
};
