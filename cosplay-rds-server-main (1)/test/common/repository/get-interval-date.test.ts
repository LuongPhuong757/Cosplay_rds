import 'reflect-metadata';
import { getIntervalDate } from '@common/repository/get-interval-date';
import { RankingInterval } from '@modules/ranking/enum/ranking-interval';

describe('getIntervalDate', () => {
  it('pass valid interval', () => {
    const daily = getIntervalDate(RankingInterval.DAILY);
    const weekly = getIntervalDate(RankingInterval.WEEKLY);
    const monthly = getIntervalDate(RankingInterval.MONTHLY);
    const all = getIntervalDate('all');

    expect(typeof daily).toBe('string');
    expect(typeof weekly).toBe('string');
    expect(typeof monthly).toBe('string');
    expect(typeof all).toBe('string');
  });

  it('invalid interval', () => {
    expect(() => {
      getIntervalDate('some-interval' as never);
    }).toThrow();
  });
});
