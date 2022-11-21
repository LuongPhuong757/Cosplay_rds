import { extractIds } from '@common/util/extract-ids';
import { getCreateAndDeleteItems } from '@common/util/get-create-and-delete-items';

describe('getCreateAndDeleteItems', () => {
  it('get delete and create items.', () => {
    const oldItems = [
      {
        id: 1,
      },
      {
        id: 2,
      },
    ];

    const newItems = [
      {
        id: 2,
      },
      {
        id: 3,
      },
    ];

    const { deleteItems, createItems } = getCreateAndDeleteItems(oldItems, newItems);

    expect(deleteItems.map(extractIds)).toEqual([1]);
    expect(createItems.map(extractIds)).toEqual([3]);
  });
});
