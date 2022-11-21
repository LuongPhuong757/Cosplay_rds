import { extractIds } from './extract-ids';

export const getCreateAndDeleteItems = <T extends { id: number }>(
  oldItems: T[],
  newItems: T[],
): { deleteItems: { id: number }[]; createItems: { id: number }[] } => {
  const oldItemIds = oldItems.map(extractIds);
  const newItemIds = newItems.map(extractIds);

  const deleteItems = oldItemIds
    .filter((oldId) => !newItemIds.includes(oldId))
    .map((id) => ({ id }));

  const createItems = newItemIds
    .filter((newId) => !oldItemIds.includes(newId))
    .map((id) => ({ id }));

  return {
    deleteItems,
    createItems,
  };
};
