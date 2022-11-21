import { extractIds, extractUserIds, extractPostIds, extractValue } from '@common/util/extract-ids';

describe('extract', () => {
  it('extract id.', () => {
    const item = {
      id: 1,
    };
    const id = extractIds(item);

    expect(id).toBe(1);
  });

  it('extract userId.', () => {
    const item = {
      userId: 1,
    };
    const id = extractUserIds(item);

    expect(id).toBe(1);
  });

  it('extract postId.', () => {
    const item = {
      postId: 1,
    };
    const id = extractPostIds(item);

    expect(id).toBe(1);
  });

  it('extract value.', () => {
    const item = {
      key: 'testKey',
    };
    const result = extractValue(item, 'key');

    expect(result).toBe('testKey');
  });
});
