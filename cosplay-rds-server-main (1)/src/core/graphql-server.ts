import * as path from 'path';
import { buildFederatedSchema } from '@common/schema/build-federated-schema';
import { authChecker } from '@middlewares/auth-checker.middleware';
import { getAuth } from '@middlewares/get-auth.middleware';
import { PrismaClient } from '@prisma/client';
import { ApolloServer, AuthenticationError, ExpressContext } from 'apollo-server-express';
import { Application } from 'express';
import { Container } from 'typedi';

export const connectGraphqlServer = async (app: Application): Promise<void> => {
  const prisma = new PrismaClient();

  const schema = await buildFederatedSchema({
    resolvers: [path.resolve(__dirname, '../modules/**/*.resolver.{ts,js}')],
    authChecker,
    container: Container,
    validate: true,
  });

  const server = new ApolloServer({
    schema,
    context: async (ctx: ExpressContext) => {
      const params = {
        prisma,
        ctx,
      };

      if (ctx.req.headers.user) {
        const auth = await getAuth(ctx, prisma);
        if (auth) {
          return {
            ...params,
            currentUser: auth.currentUser,
            auth0Id: auth.auth0Id,
          };
        }
      }

      return params;
    },
    formatError: (err) => {
      if (err.message === 'Access denied! You need to be authorized to perform this action!') {
        return new AuthenticationError('An authentication error occuered.');
      }

      return err;
    },
  });

  await server.start();

  server.applyMiddleware({ app });
};
