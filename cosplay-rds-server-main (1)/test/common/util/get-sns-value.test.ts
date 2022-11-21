import { getSnsValue } from '@common/util/get-sns-value';

describe('getSnsValue', () => {
  it('add sns value.', () => {
    const snsInfo = {
      facebook: 'testFacebook',
    };
    const sns = { instagram: 'testInstagram' };
    const result = getSnsValue(snsInfo, sns);

    expect(result).toEqual({ facebook: 'testFacebook', instagram: 'testInstagram' });
  });

  it('update sns value.', () => {
    const snsInfo = {
      facebook: 'testFacebook',
    };
    const sns = { facebook: 'updateFacebook' };
    const result = getSnsValue(snsInfo, sns);

    expect(result).toEqual({ facebook: 'updateFacebook' });
  });

  it('not update if value is undefined.', () => {
    const snsInfo = {
      facebook: 'testFacebook',
    };
    const sns = { facebook: undefined };
    const result = getSnsValue(snsInfo, sns);

    expect(result).toEqual({ facebook: 'testFacebook' });
  });
});
