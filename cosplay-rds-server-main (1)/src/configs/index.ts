/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';

dotenv.config();

export default {
  app: {
    port: process.env.PORT ? Number(process.env.PORT) : 8080,
    isDev: process.env.NODE_ENV !== 'production', // 本番の場合は、明示的にAPP_ENV=productionを設定する
    xApiKey: process.env.X_API_KEY || 'hZuv^]:PSdRx$:O',
    frontUrl: process.env.FRONT_URL || 'https://dinner-swallow3.dev.curecos.net/',
    jwtSecret: process.env.JWT_SECRET || 'sxWK7p6hsy',
  },
  aws: {
    imageBucket: process.env.AWS_S3_IMAGE_BUCKET || '',
    sqsWebhookStripeQueueUrl: process.env.AWS_SQS_WEBHOOK_STRIPE_QUEUE_URL || '',
    sqsImageCompressionQueueUrl: process.env.AWS_SQS_IMAGE_COMPRESSION_QUEUE_URL || '',
    sqsDistributeNFTQueueUrl: process.env.AWS_SQS_DISTRIBUTE_NFT_QUEUE_URL || '',
    shipmentNFTQueueUrl: process.env.AWS_SQS_SHIPMENT_NFT_QUEUE_URL || '',
    sqsUploadDistributedNFTMetadataQueueUrl:
      process.env.AWS_SQS_UPLOAD_DISTRIBUTED_NFT_METADATA_QUEUE_URL || '',
    credentials:
      process.env.AWS_CONFIG_ACCESS_KEY_ID && process.env.AWS_CONFIG_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_CONFIG_SECRET_ACCESS_KEY,
          }
        : undefined,
    region: process.env.AWS_CONFIG_REGION || undefined,
  },
  file: {
    signedUrlExpires: 900, // 15 minutes
    photoDomain: process.env.PHOTO_DOMAIN || '',
  },
  auth0: {
    authHookSecret: process.env.AUTH0_HOOK_SECRET || '',
    apiEndPoint: process.env.AUTH0_API_END_POINT || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
    audience: process.env.AUTH0_AUDIENCE || '',
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    callbackUrl: process.env.TWITTER_CALLBACK_URL!,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
  scheduler: {
    createRankingTime: '0 4 * * *', // 4時
    getCotTime: '*/5 * * * *', // 2時
  },
  gacha: {
    eachAmount: Number(process.env.NFT_GACHA_EACH_AMOUNT) || 1000, // x円ごとにGachaを引ける
  },
  eth: {
    matic: {
      jsonRpcUrl: process.env.MATIC_JSON_RPC_URL,
      lpcot: process.env.MATIC_LP_COT_ADDRESS || '',
    },
  },
  sendGrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },
  explorerApikey: {
    ethereum: process.env.EXPLORER_ETHER_SCAN_API_KEY || '',
    polygon: process.env.EXPLORER_POLYGON_SCAN_API_KEY || '',
  },
  cotAddress: {
    ethereum: process.env.COT_ADDRESS_ETHEREUM || '',
    polygon: process.env.COT_ADDRESS_POLYGON || '',
  },
};
