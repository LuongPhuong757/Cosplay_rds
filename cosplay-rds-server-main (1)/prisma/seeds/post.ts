import { PrismaClient, User } from '@prisma/client';
import { lorem } from 'faker';

export const createPosts = async (prisma: PrismaClient): Promise<void> => {
  const user = await prisma.user.findFirst() as User;

  const createPost = async () =>
    await prisma.post.create({
      data: {
        caption: lorem.words(),
        userId: user.id,
      },
    });

  await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      await createPost();
    }),
  );
};
