import { COTTipRepository } from '@modules/cot-tip/cot-tip.repository';
import { DepositNftHistoryRepository } from '@modules/despoit-nft-history/deposit-nft-history.respository';
import { DepositNftHistoryService } from '@modules/despoit-nft-history/deposit-nft-history.service';
import { NftRepository } from '@modules/nft/nft.repository';
import { NftService } from '@modules/nft/nft.service';
import { NotificationService } from '@modules/notification/notification.service';
import { TagRepository } from '@modules/tag/tag.repository';
import { TagService } from '@modules/tag/tag.service';
import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import { UserPrivateRepository } from '@modules/user-private/user-private.repository';
import { UserPrivateService } from '@modules/user-private/user-private.service';
import { UserRepository } from '@modules/user/user.repository';
import { Auth0Provider } from '@providers/auth0.provider';
import { ExplorerService } from '@providers/explorer.provider';
import { MaticProvider } from '@providers/matic.provider';
import { S3Provider } from '@providers/s3.provider';
import { SqsService } from '@providers/sqs.provider';
import { StripeService } from '@providers/stripe.provider';
import { TwitterService } from '@providers/twitter.provider';
import { GeneratorService } from '@services/generator.service';
import { prisma } from './prisma-instance';

//
// Provider
//
const generatorService = new GeneratorService();
const s3Provider = new S3Provider(generatorService);
const auth0Provider = new Auth0Provider();
const twitterService = new TwitterService();
const maticProvider = new MaticProvider();
const explorerService = new ExplorerService();

//
// Repository
//
const tagRepository = new TagRepository(prisma);
const nftRepository = new NftRepository(prisma);
const userHasNftRepository = new UserHasNftRepository(prisma);
const depositNftHistoryRepository = new DepositNftHistoryRepository(prisma);
const cotTipRepository = new COTTipRepository(prisma);

//
// Service
//
const tagService = new TagService(prisma, tagRepository);
const nftService = new NftService(nftRepository, userHasNftRepository);
const stripeService = new StripeService();
const notificationService = new NotificationService(prisma);
const sqsService = new SqsService();
const userRepository = new UserRepository(prisma, generatorService);
const userPrivateRepository = new UserPrivateRepository(prisma);
const depositNftHistoryService = new DepositNftHistoryService(
  depositNftHistoryRepository,
  userHasNftRepository,
  userRepository,
  nftRepository,
  prisma,
  maticProvider,
);
const userPrivateService = new UserPrivateService(
  userPrivateRepository,
  userRepository,
  twitterService,
  explorerService,
);

export {
  // Provider
  s3Provider,
  auth0Provider,
  twitterService,
  maticProvider,
  // Repository
  nftRepository,
  userHasNftRepository,
  depositNftHistoryRepository,
  userRepository,
  tagRepository,
  cotTipRepository,
  userPrivateRepository,
  // Service
  nftService,
  depositNftHistoryService,
  tagService,
  stripeService,
  sqsService,
  notificationService,
  generatorService,
  userPrivateService,
};
