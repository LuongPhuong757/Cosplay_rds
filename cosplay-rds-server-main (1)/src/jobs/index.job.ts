/* eslint-disable @typescript-eslint/no-misused-promises */
import config from '@config';
import schedule from 'node-schedule';
import { rankingJob } from './ranking.job';
import { rankingCotJob } from './rankingCot.job';

const { createRankingTime } = config.scheduler;
const { getCotTime } = config.scheduler;

export const registerJobs = (): void => {
  console.log(`app registered jobs.`);

  schedule.scheduleJob(createRankingTime, async () => rankingJob.processJob());
  schedule.scheduleJob(getCotTime, async () => rankingCotJob.processJob());
};
