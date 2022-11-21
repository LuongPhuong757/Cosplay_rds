import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

export const between = (before: Date, after: Date): boolean => {
  return dayjs(new Date()).isBetween(before, dayjs(after));
};
