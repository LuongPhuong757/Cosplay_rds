import { RankingInterval } from '@modules/ranking/enum/ranking-interval';
import dayjs from 'dayjs';

export const getIntervalDate = (interval: RankingInterval | 'all'): string => {
  switch (interval) {
    case RankingInterval.DAILY:
      return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    case RankingInterval.WEEKLY:
      return dayjs().subtract(1, 'week').format('YYYY-MM-DD');
    case RankingInterval.MONTHLY:
      return dayjs().subtract(1, 'month').format('YYYY-MM-DD');
    case 'all':
      return '2021-01-01'; // TODO: 開始時期を指定する。データを全て取得したい。
    default:
      throw Error(`invalid interval. interval: ${String(interval)}.`);
  }
};
