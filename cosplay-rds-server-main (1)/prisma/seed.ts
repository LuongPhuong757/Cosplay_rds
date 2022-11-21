import { createUsers, createPosts } from './seeds';
import {
  firstUser,
  secondUser,
  thirdUser,
  firstHashTag,
  firstPost,
  secondPost,
  firstCurrentEvent,
} from '../test/data';
import { prisma } from '../test/prisma-instance';

const Nft_TEXT = 'Nft';

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const cleanupDatabase = async (): Promise<void> => {
  // skip on ci environment
  if (process.env.CI) {
    return;
  }
  const propertyNames = Object.getOwnPropertyNames(prisma);
  const modelNames = propertyNames
    .filter((propertyName) => !propertyName.startsWith('_'))
    .map(capitalize).map((model) => model.replace(Nft_TEXT, 'NFT'));

  await Promise.all(
    modelNames.map((model) => prisma.$executeRaw(`DELETE FROM "public"."${model}"`)),
  );
};

async function main(): Promise<void> {
  await cleanupDatabase();

  await createUsers(prisma);
  await createPosts(prisma);

  //
  // TODO
  //
  const user1 = await prisma.user.create({
    data: firstUser,
  });

  const user2 = await prisma.user.create({
    data: secondUser,
  });

  const user3 = await prisma.user.create({
    data: thirdUser,
  });

  const hashTag1 = await prisma.hashTag.create({
    data: firstHashTag,
  });

  const post1 = await prisma.post.create({
    data: {
      userId: user1.id,
      caption: firstPost.caption,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      userId: user1.id,
      caption: secondPost.caption,
    },
  });

  const tag1 = await prisma.tag.create({
    data: {
      userId: user1.id,
    },
  });

  const event1 = await prisma.event.create({
    data: {
      ...firstCurrentEvent,
    },
  });

  const tag2 = await prisma.tag.create({
    data: {
      eventId: event1.id,
    },
  });

  await prisma.post.update({
    where: { id: post1.id },
    data: {
      hashtags: {
        connect: [{ id: hashTag1.id }],
      },
      tags: {
        connect: [{ id: tag1.id }, { id: tag2.id }],
      },
      photos: {
        create: {
          image: 'test.png',
        },
      },
    },
  });

  const price1 = await prisma.price.create({
    data: {
      currency: 'jpy',
      amount: 100,
      jpy: 100,
    },
  });

  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      comment: 'testComment',
      userId: user1.id,
    },
  });

  await prisma.superchat.create({
    data: {
      price: {
        connect: { id: price1.id },
      },
      comment: {
        connect: { id: comment1.id },
      },
      user: {
        connect: { id: user1.id },
      },
    },
  });
}

main().finally(
  async (): Promise<void> => {
    await prisma.$disconnect();
  },
);
