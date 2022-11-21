import { ACCOUNT_REG_EXP } from '@configs/constant';

export const getFindUserWhereQuery = (userId?: number, account?: string): string => {
  if (userId && typeof userId === 'number') {
    return `where "u"."id" = '${userId}'`;
  }
  if (account && ACCOUNT_REG_EXP.exec(account)) {
    return `where "u"."account" = '${account}'`;
  }
  throw Error('args have to be defined.');
};
