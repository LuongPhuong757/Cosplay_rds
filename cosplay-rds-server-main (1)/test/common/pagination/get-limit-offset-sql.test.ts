import { getLimitOffsetSql } from '@common/pagination/get-limit-offset-sql';

describe('getLimitOffsetSql', () => {
  it('pagingOptions is undefined.', () => {
    const sql = getLimitOffsetSql(undefined);

    expect(sql).toBe('');
  });

  it('limit is defined.', () => {
    const pagingOptions = { limit: 10 };
    const sql = getLimitOffsetSql(pagingOptions);

    expect(sql).toBe('LIMIT 10 ');
  });

  it('offset is defined.', () => {
    const pagingOptions = { offset: 10 };
    const sql = getLimitOffsetSql(pagingOptions);

    expect(sql).toBe('OFFSET 10');
  });

  it('both of that is defined.', () => {
    const pagingOptions = { limit: 10, offset: 10 };
    const sql = getLimitOffsetSql(pagingOptions);

    expect(sql).toBe('LIMIT 10 OFFSET 10');
  });
});
