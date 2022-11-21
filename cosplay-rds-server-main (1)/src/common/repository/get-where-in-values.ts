export const getWhereInValues = (values: number[]): string => {
  if (!values.every((value) => typeof value === 'number')) {
    throw Error('args must be number.');
  }

  return values.join(',');
};
