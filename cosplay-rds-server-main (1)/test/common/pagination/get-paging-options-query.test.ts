import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';

describe('getPagingOptionsQuery', () => {
  it('missing args.', () => {
    const query = getPagingOptionsQuery();

    expect(Object.keys(query).length === 0).toBe(true);
  });

  it('has take.', () => {
    const query = getPagingOptionsQuery({ limit: 1 });

    expect(query.hasOwnProperty('take')).toBe(true);
  });

  it('has skip.', () => {
    const query = getPagingOptionsQuery({ offset: 1 });

    expect(query.hasOwnProperty('skip')).toBe(true);
  });

  it('has both.', () => {
    const query = getPagingOptionsQuery({ limit: 1, offset: 1 });

    expect(query.hasOwnProperty('take')).toBe(true);
    expect(query.hasOwnProperty('skip')).toBe(true);
  });

  it('totalCount && offset.', () => {
    const query = getPagingOptionsQuery({ limit: 1, offset: 1 }, 10);

    expect(query.hasOwnProperty('take')).toBe(true);
    expect(query.hasOwnProperty('skip')).toBe(true);
  });
});
