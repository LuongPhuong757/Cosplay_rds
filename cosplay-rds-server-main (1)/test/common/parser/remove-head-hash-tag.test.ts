import { removeHeadHashTag } from '@common/parser/remove-head-hash-tag';

describe('removeHeadHashTag', () => {
  it('remove "#" when first charactor is "#".', () => {
    const query = '#hello';
    const parsed = removeHeadHashTag(query);

    expect(parsed).toBe('hello');
  });

  it('query is just #.', () => {
    const query = '#';

    expect(() => {
      removeHeadHashTag(query);
    }).toThrow('you have to add other characters after "#".');
  });

  it('not remove.', () => {
    const query = 'hello';
    const parsed = removeHeadHashTag(query);

    expect(parsed).toBe(query);
  });
});
