import 'reflect-metadata';
import { SUBSCRIPTION_STATUS } from '@prisma/client';
import { Membership } from '../../../src/modules/membership/membership.model';
import { MembershipService } from '../../../src/modules/membership/membership.service';
import { Price } from '../../../src/modules/price/price.model';
import { User } from '../../../src/modules/user/user.model';
import { StripeService } from '../../../src/providers/stripe.provider';
import { prisma } from '../../prisma-instance';

describe('membershipService', () => {
  let membershipService: MembershipService;
  let stripeService: StripeService;
  let firstUser: User;
  let secondUser: User;

  const setup = async () => {
    const mockedFunctions = {
      mockCreateProduct: jest.fn().mockResolvedValue('testStripeProductId'),
      mockCreatePrice: jest.fn().mockResolvedValue('testStripePriceId'),
    };

    stripeService.createProduct = mockedFunctions.mockCreateProduct;
    stripeService.createPrice = mockedFunctions.mockCreatePrice;

    firstUser = await prisma.user.create({
      data: {
        name: 'mem1-name',
        account: 'mem1-account',
        auth0Id: 'mem1-auth0Id',
      },
    });
    secondUser = await prisma.user.create({
      data: {
        name: 'mem2-name',
        account: 'mem2-account',
        auth0Id: 'mem2-auth0Id',
      },
    });
    const price = await prisma.price.create({
      data: {
        amount: 100,
        currency: 'jpy',
        jpy: 100,
      },
    });
    const membership = await prisma.membership.create({
      data: {
        userId: firstUser.id,
        priceId: price.id,
        stripePriceId: 'mem1-priceId',
        stripeProductId: 'mem1-productId',
      },
    });
    await prisma.subscription.create({
      data: {
        stripeSubscriptionKey: 'mem1-sub',
        status: SUBSCRIPTION_STATUS.ACTIVE,
        buyerId: firstUser.id,
        sellerId: secondUser.id,
        membershipId: membership.id,
      },
    });

    return mockedFunctions;
  };

  beforeAll(async () => {
    stripeService = new StripeService();
    membershipService = new MembershipService(prisma, stripeService);

    await setup();
  });

  describe('memberships', () => {
    it('return memberships.', async () => {
      const result = await membershipService.memberships(firstUser.id);

      const user = result[0];
      expect(user.account).toBe(secondUser.account);
    });
  });

  describe('membershippedBy', () => {
    it('return users that join user membership club..', async () => {
      const result = await membershipService.membershippedBy(secondUser.id);

      const user = result[0];
      expect(user.account).toBe(firstUser.account);
    });
  });

  describe('updateMembershipPrice', () => {
    it('result ok.', async () => {
      const user = await prisma.user.create({
        data: {
          auth0Id: 'membership_auth0Id',
          name: 'membership_name',
          account: 'membership_account',
          icon: 'membership_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      const price = (await prisma.price.create({
        data: {
          amount: 100,
          jpy: 100,
          currency: 'jpy',
        },
      })) as Price;
      await prisma.membership.create({
        data: {
          userId: user.id,
          stripePriceId: 'mem1-stripePriceId',
          stripeProductId: 'mem1-stripeProductId',
          priceId: price.id,
        },
      });
      const updateMembershipPriceInput = {
        amount: 1000,
        currency: 'jpy',
        jpy: 1000,
      };

      const result = await membershipService.updateMembershipPrice(
        user,
        updateMembershipPriceInput,
      );

      const newMembership = (await prisma.membership.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          membershipPrice: true,
        },
      })) as Membership;
      const membershipPrice = newMembership.membershipPrice as Price;

      expect(result.result).toBe('ok');
      expect(membershipPrice.amount).toBe(1000);
      expect(membershipPrice.currency).toBe('jpy');
    });
  });

  describe('getMembershipStripePriceInfo', () => {
    it('return stripePriceId.', async () => {
      const user = (await prisma.user.findFirst({
        where: {
          auth0Id: 'membership_auth0Id',
        },
      })) as User;

      const result = await membershipService.getMembershipStripePriceInfo(user.id);

      expect(result).toHaveProperty('stripePriceId');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('currency');
    });

    it('return null.', async () => {
      const result = await membershipService.getMembershipStripePriceInfo(10000);

      expect(result).toBe(null);
    });
  });
});
