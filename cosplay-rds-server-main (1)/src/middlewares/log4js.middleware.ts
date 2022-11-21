import log from '@configs/log4js';
import { Application } from 'express';
import log4js from 'log4js';

export const applyLog4js = (app: Application): void => {
  // Setting log4js
  log4js.configure(log);
  const httpLogger = log4js.getLogger('http');
  const accessLogger = log4js.getLogger('access');

  app.use(log4js.connectLogger(accessLogger, { level: 'auto' }));
  app.use((req, res, next) => {
    if (
      typeof req === 'undefined' ||
      req === null ||
      typeof req.method === 'undefined' ||
      req.method === null ||
      typeof req.header === 'undefined' ||
      req.header === null
    ) {
      next();
    } else if (req.method === 'GET' || req.method === 'DELETE') {
      httpLogger.info(req.query);
    } else {
      httpLogger.info(req.body);
    }
    next();
  });
};
