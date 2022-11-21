/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { removeHeadHashTag } from '@common/parser/remove-head-hash-tag';
import { HASH_TAG_REG_EXP } from '@configs/constant';

export const parseHashTags = (caption: string | null | undefined): string[] => {
  if (typeof caption !== 'string') {
    return [];
  }

  const mached = caption.match(HASH_TAG_REG_EXP);
  if (!mached) return [];

  return mached.map(removeHeadHashTag);
};
