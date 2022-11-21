import 'reflect-metadata';
import config from '@config';
import { registerJobs } from '@jobs/index.job';
import { SqsService } from '@providers/sqs.provider';
import { createServer } from './server';

const { port } = config.app;

const bootstrap = async (): Promise<void> => {
  const app = await createServer();
  const sqs = new SqsService();

  app.listen(port, '0.0.0.0', () => {
    console.log(`Rds server listening on port ${port}.`);
    registerJobs();
  });

  sqs.start((queueUrl: string) => {
    console.log(`Start sqs subscriber with queueUrl: ${queueUrl}.`);
  });

  // When receives SIGINT event, gracefully close the process. (Without this, developers would have to kill the process)
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down from SIGINT (Ctrl-C)');
    process.exit(0);
  });
};
bootstrap().catch(console.error);
