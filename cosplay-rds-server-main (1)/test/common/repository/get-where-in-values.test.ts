import { getWhereInValues } from '@common/repository/get-where-in-values';

describe('getWhereInValues', () => {
  it('pass where values', () => {
    const result = getWhereInValues([1, 2]);

    expect(result).toBe('1,2');
  });

  it('pass not number', () => {
    expect(() => {
      getWhereInValues(['hello', 'world'] as never);
    }).toThrow();
  });
});
