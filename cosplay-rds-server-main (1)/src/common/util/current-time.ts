import dayjs from 'dayjs';

export const getCurrentTime = (): string => dayjs().format('YYYY-MM-DD HH:mm:ss');
