import { ValidationError } from 'apollo-server-express';

export const removeHeadHashTag = (query: string): string => {
  const isHeadHashTag = /^[#＃].*/.exec(query);
  if (!isHeadHashTag) return query;

  const removed = query.substring(1);
  if (removed === '') {
    throw new ValidationError('you have to add other characters after "#".');
  }

  return removed;
};
