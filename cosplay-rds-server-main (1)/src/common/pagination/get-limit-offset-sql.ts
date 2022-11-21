import { PagingOptionsInput } from '@common/pagination/paging-options.input';

export const getLimitOffsetSql = (pagingOptions?: PagingOptionsInput | undefined): string => {
  let sql = '';
  if (!pagingOptions) return sql;

  const { limit, offset } = pagingOptions;
  if (limit && typeof limit === 'number') {
    sql = `LIMIT ${limit} `;
  }

  if (offset && typeof offset === 'number') {
    sql = `${sql}OFFSET ${offset}`;
  }

  return sql;
};
