import { helmet } from '@middlewares/helmet.middleware';
import { applyLog4js } from '@middlewares/log4js.middleware';
import { limiter } from '@middlewares/rate-limit.middleware';
import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import { connectGraphqlServer } from './core/graphql-server';

export const createServer = async (): Promise<Application> => {
  const app: Application = express();

  app.use(cors());
  app.use(helmet);
  app.use(compression());
  app.use(limiter);

  applyLog4js(app);

  await connectGraphqlServer(app);

  return app;
};
