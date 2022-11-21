import { SUBSCRIPTION_STATUS } from '@prisma/client';
import 'reflect-metadata';
import SQS from 'aws-sdk/clients/sqs';
import { Result } from '../../../src/common/response/result.enum';
import { NotificationService } from '../../../src/modules/notification/notification.service';
import { ScoreLogRepository } from '../../../src/modules/score-log/score-log.repository';
import { ScoreLogService } from '../../../src/modules/score-log/score-log.service';
import { SubscriptionService } from '../../../src/modules/subscription/subscription.service';
import { User } from '../../../src/modules/user/user.model';
import { StripeService } from '../../../src/providers/stripe.provider';
import { prisma } from '../../prisma-instance';

export const mockMessageAttributes = (): SQS.MessageBodyAttributeMap => {
  return {
    buyerAuth0Id: {
      StringValue: 'test-buyerAuth0Id',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
    sellerId: {
      StringValue: 'test-sellerId',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'Number',
    },
    stripeCustomerId: {
      StringValue: 'test-stripeCustomerId',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
    subscriptionId: {
      StringValue: 'test-subscriptionId',
      StringListValues: [],
      BinaryListValues: [],
      DataType: 'String',
    },
  };
};

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let stripeService: StripeService;
  let firstUser: User;
  let secondUser: User;

  const setup = () => {
    const mockedFunctions = {
      mockCancel: jest.fn().mockResolvedValue(true),
    };
    stripeService.cancelCustomerSubscription = mockedFunctions.mockCancel;

    return mockedFunctions;
  };

  const createNewSubscription = async (stripeSubscriptionKey: string, membershipId: number) => {
    const subscription = await prisma.subscription.create({
      data: {
        buyerId: firstUser.id,
        sellerId: secondUser.id,
        status: SUBSCRIPTION_STATUS.PENDING,
        stripeSubscriptionKey,
        membershipId,
      },
    });

    return {
      firstUser,
      secondUser,
      subscription,
    };
  };

  const deleteSubscription = async (subscriptionId: number) => {
    await prisma.subscription.delete({
      where: {
        id: subscriptionId,
      },
    });
  };

  beforeAll(async () => {
    stripeService = new StripeService();
    const scoreLogRepository = new ScoreLogRepository(prisma);
    const scoreLogService = new ScoreLogService(scoreLogRepository);
    const notificationService = new NotificationService(prisma);
    subscriptionService = new SubscriptionService(
      prisma,
      stripeService,
      scoreLogService,
      notificationService,
    );

    const price1 = await prisma.price.create({
      data: {
        amount: 100,
        currency: 'jpy',
        jpy: 100,
      },
    });
    const price2 = await prisma.price.create({
      data: {
        amount: 200,
        currency: 'jpy',
        jpy: 100,
      },
    });

    firstUser = await prisma.user.create({
      data: {
        auth0Id: 'sub1-auth0Id',
        account: 'sub1-account',
        name: 'sub1-name',
        userPrivate: {
          create: {
            stripeCustomerId: 'sub1-stripe-customer-id',
            email: 'sub1-email@a.com',
          },
        },
        membership: {
          create: {
            priceId: price1.id,
            stripePriceId: 'sub1-stripePriceId',
            stripeProductId: 'sub1-stripeProductId',
          },
        },
      },
      include: {
        membership: true,
      },
    });

    secondUser = await prisma.user.create({
      data: {
        auth0Id: 'sub2-auth0Id',
        account: 'sub2-account',
        name: 'sub2-name',
        userPrivate: {
          create: {
            stripeCustomerId: 'sub2-stripe-customer-id',
            email: 'sub2-email@a.com',
          },
        },
        membership: {
          create: {
            priceId: price2.id,
            stripePriceId: 'sub2-stripePriceId',
            stripeProductId: 'sub2-stripeProductId',
          },
        },
      },
      include: {
        membership: true,
      },
    });
  });

  describe('cancelSubscription', () => {
    it('not found subsucription.', async () => {
      const result = await subscriptionService.cancelSubscription(firstUser, 10000);

      expect(result.result).toBe(Result.ng);
    });

    it('canceled subsucription.', async () => {
      setup();
      const { subscription } = await createNewSubscription(
        'stripeSubscriptionKey0',
        firstUser?.membership?.id as number,
      );

      const result = await subscriptionService.cancelSubscription(firstUser, secondUser.id);
      const updated = await prisma.subscription.findUnique({
        where: {
          id: subscription.id,
        },
      });

      expect(result.result).toBe(Result.ok);
      expect(updated?.status).toBe(SUBSCRIPTION_STATUS.CANCELED);

      await deleteSubscription(subscription.id);
    });
  });

  describe('checkoutSessionCompleted', () => {
    it('not found buyer.', async () => {
      const input = mockMessageAttributes();
      input.buyerAuth0Id.StringValue = 'no-found-auth0Id';
      const result = await subscriptionService.checkoutSessionCompleted(input);

      expect(result).toBe(false);
    });

    it('membership not found.', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'subscription-test1-name',
          account: 'subscription-test1-account',
          auth0Id: 'subscription-test1-auth0Id',
        },
      });

      const input = mockMessageAttributes();
      input.buyerAuth0Id.StringValue = user.auth0Id;
      const result = await subscriptionService.checkoutSessionCompleted(input);

      expect(result).toBe(false);
    });

    it('checkout session compleleted.', async () => {
      const { subscription } = await createNewSubscription(
        'stripeSubscriptionKey1',
        firstUser?.membership?.id as number,
      );
      const input = mockMessageAttributes();
      input.buyerAuth0Id.StringValue = firstUser.auth0Id;
      input.sellerId.StringValue = String(secondUser.id);
      const result = await subscriptionService.checkoutSessionCompleted(input);

      expect(result).toBe(true);
      expect(subscription?.status).toBe(SUBSCRIPTION_STATUS.PENDING);
    });
  });

  describe('invoicePaid', () => {
    it('status is changed to ACTIVE.', async () => {
      const input = mockMessageAttributes();
      const { subscription } = await createNewSubscription(
        'stripeSubscriptionKey2',
        firstUser?.membership?.id as number,
      );
      input.subscriptionId.StringValue = subscription.stripeSubscriptionKey;
      input.stripeCustomerId.StringValue = 'sub1-stripe-customer-id';
      const result = await subscriptionService.invoicePaid(input);
      const updated = await prisma.subscription.findUnique({
        where: {
          id: subscription.id,
        },
      });

      expect(result).toBe(true);
      expect(updated?.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);

      await deleteSubscription(subscription.id);
    });
  });

  describe('invoicePaymentFailed', () => {
    it('status is changed to EXPIRED.', async () => {
      const input = mockMessageAttributes();
      const { subscription } = await createNewSubscription(
        'stripeSubscriptionKey3',
        firstUser?.membership?.id as number,
      );
      input.subscriptionId.StringValue = subscription.stripeSubscriptionKey;
      input.stripeCustomerId.StringValue = 'sub1-stripe-customer-id';
      const result = await subscriptionService.invoicePaymentFailed(input);
      const updated = await prisma.subscription.findUnique({
        where: {
          id: subscription.id,
        },
      });

      expect(result).toBe(true);
      expect(updated?.status).toBe(SUBSCRIPTION_STATUS.EXPIRED);

      await deleteSubscription(subscription.id);
    });
  });

  describe('customerSubscriptionDeleted', () => {
    it('status is changed to EXPIRED.', async () => {
      const input = mockMessageAttributes();
      const { subscription } = await createNewSubscription(
        'stripeSubscriptionKey4',
        firstUser?.membership?.id as number,
      );
      input.subscriptionId.StringValue = subscription.stripeSubscriptionKey;
      input.stripeCustomerId.StringValue = 'sub1-stripe-customer-id';
      const result = await subscriptionService.customerSubscriptionDeleted(input);
      const updated = await prisma.subscription.findUnique({
        where: {
          id: subscription.id,
        },
      });

      expect(result).toBe(true);
      expect(updated?.status).toBe(SUBSCRIPTION_STATUS.CANCELED);

      await deleteSubscription(subscription.id);
    });
  });
});
