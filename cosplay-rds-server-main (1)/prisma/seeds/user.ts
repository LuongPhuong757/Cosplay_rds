import { PrismaClient } from '@prisma/client';
import faker from 'faker';

export const createUsers = async (prisma: PrismaClient): Promise<void> => {
  const createUser = async (isBan = false) =>
    await prisma.user.create({
      data: {
        auth0Id: faker.datatype.uuid(),
        name: faker.name.findName(),
        account: faker.internet.userName().toLocaleLowerCase(),
        icon: faker.system.fileName(),
        isBan,
        userPrivate: {
          create: {
            email: faker.internet.email(),
          },
        },
      },
    });

  await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      await createUser();
    }),
  );

  await createUser(true);
};
