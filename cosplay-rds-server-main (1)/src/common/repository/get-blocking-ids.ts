import { extractIds } from '@common/util/extract-ids';
import { UserFollow } from '@modules/user/user-follow.model';

export const getBlockIds = (blockedBy?: UserFollow[], blocking?: UserFollow[]): number[] => {
  const blockIds = [];
  if (blockedBy) {
    blockIds.push(...blockedBy.map(extractIds));
  }
  if (blocking) {
    blockIds.push(...blocking.map(extractIds));
  }

  return blockIds;
};
