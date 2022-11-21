import { getSqsMessageAttribute } from '@common/util/get-sqs-message-attribute-map';
import { mockMessageAttributes } from '../../helper';

describe('getSqsMessageAttribute', () => {
  it('get maps', () => {
    const input = mockMessageAttributes();
    const { objStr, objNum } = getSqsMessageAttribute(input);

    expect(typeof objStr.auth0Id === 'string').toBe(true);
    expect(typeof objNum.amount === 'number').toBe(true);
  });
});
