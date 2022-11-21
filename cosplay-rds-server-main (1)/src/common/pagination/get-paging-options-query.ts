import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { PagingOptionsQuery } from '@interfaces';

export const getPagingOptionsQuery = (
  pagingOptions?: PagingOptionsInput | undefined,
  totalCount?: number,
): PagingOptionsQuery => {
  const pagingOptionsQuery: PagingOptionsQuery = {};
  if (!pagingOptions) return pagingOptionsQuery;

  const { limit, offset } = pagingOptions;
  if (limit) {
    pagingOptionsQuery.take = limit;
  }

  if (offset) {
    pagingOptionsQuery.skip = offset;
  }

  if (totalCount && offset) {
    const timelineOffset = offset - totalCount;
    pagingOptionsQuery.skip = timelineOffset > 0 ? timelineOffset : 0;
  }

  return pagingOptionsQuery;
};

export const getSubstractedPagingOptionsQuery = (
  inputPagingOptionsQuery: PagingOptionsQuery,
  totalCount: number,
): PagingOptionsQuery => {
  const pagingOptionsQuery: PagingOptionsQuery = {};
  if (!inputPagingOptionsQuery) return pagingOptionsQuery;

  const { take, skip } = inputPagingOptionsQuery;
  if (take) {
    pagingOptionsQuery.take = take - totalCount;
  }

  if (skip) {
    pagingOptionsQuery.skip = skip - totalCount > 0 ? skip - totalCount : 0;
  }

  return pagingOptionsQuery;
};
