export const extractIds = <T extends { id: number }>(item: T): number => item.id;

export const extractUserIds = <T extends { userId: number }>(item: T): number => item.userId;

export const extractPostIds = <T extends { postId: number }>(item: T): number => item.postId;

export const extractValue = <T, K extends keyof T>(obj: T, key: K): T[K] => obj[key];
