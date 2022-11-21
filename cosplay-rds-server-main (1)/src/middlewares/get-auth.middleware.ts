import { injectDefaultPrivateSetting } from '@common/inject/inject-user-private-setting';
import { AuthUser } from '@interfaces';
import { PrismaClient, User } from '@prisma/client';
import { ExpressContext, ForbiddenError } from 'apollo-server-express';

declare module 'http' {
  interface IncomingHttpHeaders {
    user: string;
  }
}

export const getAuth = async (
  ctx: ExpressContext,
  prisma: PrismaClient,
): Promise<{ currentUser?: User; auth0Id: string } | null> => {
  if (ctx.req.headers.user) {
    const { auth0Id } = JSON.parse(ctx.req.headers.user) as AuthUser;
    const user = await prisma.user.findFirst({
      where: { auth0Id },
      include: { userPrivate: true },
    });

    if (!user) {
      return {
        auth0Id,
      };
    }

    if (user.isBan) {
      throw new ForbiddenError('you have been banned.');
    }

    const currentUser = injectDefaultPrivateSetting(user);

    return {
      currentUser,
      auth0Id,
    };
  }

  return null;
};
