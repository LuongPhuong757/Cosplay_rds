import { getFindUserWhereQuery } from '@common/util/get-find-user-where-query';

describe('getFindUserWhereQuery', () => {
  it('get userId query.', () => {
    const userId = 1;
    const query = getFindUserWhereQuery(userId);

    expect(query).toBe('where "u"."id" = \'1\'');
  });

  it('get account query.', () => {
    const account = 'testAccount';
    const query = getFindUserWhereQuery(undefined, account);

    expect(query).toBe('where "u"."account" = \'testAccount\'');
  });

  it('no pass argument.', () => {
    expect(() => {
      getFindUserWhereQuery(undefined, undefined);
    }).toThrow();
  });
});
