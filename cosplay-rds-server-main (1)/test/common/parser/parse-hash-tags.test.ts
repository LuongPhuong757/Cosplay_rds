import { parseHashTags } from '@common/parser/parse-hash-tags';

describe('parseHashTags', () => {
  it('empty.', () => {
    const caption = 'test test';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(0);
  });

  it('even in the middle.', () => {
    const caption = 'test #hello123 test #world';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(2);
  });

  it('contains symbol.', () => {
    const caption = 'test #hello123..-1 #world';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(2);
  });

  it('in a row.', () => {
    const caption = 'test ##hello123..-1 #world';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(2);
  });

  it('hiragana.', () => {
    const caption = 'test #てすと';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(1);
  });

  it('katakana.', () => {
    const caption = 'test #テスト';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(1);
  });

  it('kanji.', () => {
    const caption = 'test #漢字';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(1);
  });

  it('middle point.', () => {
    const caption = 'test #て・と';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(1);
  });

  it('all.', () => {
    const caption = 'test #漢字テストてすと';
    const parsed = parseHashTags(caption);

    expect(parsed).toHaveLength(1);
  });
});
