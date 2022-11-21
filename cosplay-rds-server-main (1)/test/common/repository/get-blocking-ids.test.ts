import { getBlockIds } from '@common/repository/get-blocking-ids';

describe('getBlockIds', () => {
  const blockedBy = [
    { id: 1, account: 'account1', name: 'name1', icon: 'http://localhost/icon1.png' },
    { id: 2, account: 'account2', name: 'name2', icon: 'http://localhost/icon2.png' },
  ];
  const blocking = [
    { id: 3, account: 'account1', name: 'name1', icon: 'http://localhost/icon1.png' },
    { id: 4, account: 'account2', name: 'name2', icon: 'http://localhost/icon2.png' },
  ];

  it('empty', () => {
    const blockIds = getBlockIds();

    expect(blockIds).toEqual([]);
  });

  it('only blockedBy', () => {
    const blockIds = getBlockIds(blockedBy, []);

    expect(blockIds).toEqual([1, 2]);
  });

  it('only blocking', () => {
    const blockIds = getBlockIds([], blocking);

    expect(blockIds).toEqual([3, 4]);
  });

  it('both blockedBy and blocking', () => {
    const blockIds = getBlockIds(blockedBy, blocking);

    expect(blockIds).toEqual([1, 2, 3, 4]);
  });
});
