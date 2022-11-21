import * as fs from 'fs';
import { resolve } from 'path';
import config from '@config';
import AWS from 'aws-sdk';

const awsConfig = 'aws_config.json';
const awsConfigPath = resolve(process.cwd(), awsConfig);

if (fs.existsSync(awsConfigPath)) {
  // For local
  AWS.config.loadFromPath(awsConfigPath);
} else {
  // For ECS
  AWS.config.update({
    credentials: config.aws.credentials,
    region: config.aws.region,
  });
}

export { AWS as Aws };
