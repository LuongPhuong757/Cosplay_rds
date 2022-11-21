import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { getSqsMessageAttribute } from '@common/util/get-sqs-message-attribute-map';
import { InfoType } from '@modules/notification/enum/info-type';
import { NotificationService } from '@modules/notification/notification.service';
import { ScoreLogService } from '@modules/score-log/score-log.service';
import { User } from '@modules/user/user.model';
import { SUBSCRIPTION_STATUS } from '@prisma/client';
import { StripeService } from '@providers/stripe.provider';
import { PrismaService } from '@services/prisma.service';
import SQS from 'aws-sdk/clients/sqs';
import { Service } from 'typedi';

@Service()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly scoreLogService: ScoreLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async cancelSubscription(currentUser: User, userId: number): Promise<ResultResponse> {
    const { id } = currentUser;
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          buyerId: id,
          sellerId: userId,
        },
      });
      if (!subscription) {
        throw Error(`subscription does not exist. buyerId: ${id} sellerId: ${userId}.`);
      }

      await this.stripeService.cancelCustomerSubscription(subscription.stripeSubscriptionKey);

      console.log(
        `cancel customer stripe subscription successfully. subscriptionId: ${subscription.id}.`,
      );

      await this.prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SUBSCRIPTION_STATUS.CANCELED,
        },
      });

      console.log(`deleted subscription successfully. subscriptionId: ${subscription.id}.`);

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      return {
        result: Result.ng,
      };
    }
  }

  // Stripeにてメンバーシップのsubscription決済をした後にqueueによって処理を行う
  async checkoutSessionCompleted(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    const { objStr, objNum } = getSqsMessageAttribute(messageAttributes);
    const { subscriptionId, stripeCustomerId, buyerAuth0Id, stripePriceId } = objStr;
    const { sellerId } = objNum;
    try {
      const buyer = await this.prisma.user.findFirst({
        where: {
          auth0Id: buyerAuth0Id,
        },
        include: {
          userPrivate: {
            select: {
              id: true,
              stripeCustomerId: true,
            },
          },
        },
      });
      if (!buyer) {
        throw Error(`user does not exist. buyerAuth0Id: ${buyerAuth0Id}.`);
      }

      // StripeCustomerIdがない場合は、追加する。
      if (buyer.userPrivate && !buyer.userPrivate.stripeCustomerId) {
        await this.prisma.userPrivate.update({
          where: {
            id: buyer.userPrivate.id,
          },
          data: {
            stripeCustomerId,
          },
        });
      }

      const membership = await this.prisma.membership.findFirst({
        where: {
          stripePriceId,
        },
      });
      if (!membership) {
        throw Error(`membership does not exist. stripePriceId: ${stripePriceId}.`);
      }

      const subscription = await this.prisma.subscription.create({
        data: {
          stripeSubscriptionKey: subscriptionId,
          buyerId: buyer.id,
          sellerId,
          status: SUBSCRIPTION_STATUS.PENDING,
          membershipId: membership.id,
        },
      });

      await this.notificationService.createNotification(buyer.id, sellerId, InfoType.MEMBERSHIP);

      console.log(
        `created checkoutSessionCompleted subscription successfully. subscriptionId: ${subscription.id}.`,
      );

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot create checkoutSessionCompleted subscription. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  async invoicePaid(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    const { objStr } = getSqsMessageAttribute(messageAttributes);
    const { subscriptionId, stripeCustomerId } = objStr;
    try {
      const subscription = await this.getSubscription(subscriptionId, stripeCustomerId);
      const amount = await this.getAmount(subscription.membershipId);

      await this.prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
      });

      await this.scoreLogService.membership(subscription.sellerId, subscription.buyerId, amount);

      console.log(
        `updated invoicePaid subscription successfully. subscription.id: ${subscription.id}.`,
      );

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot update invoicePaid subscription. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  async invoicePaymentFailed(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    const { objStr } = getSqsMessageAttribute(messageAttributes);
    const { subscriptionId, stripeCustomerId } = objStr;
    try {
      const subscription = await this.getSubscription(subscriptionId, stripeCustomerId);

      await this.prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SUBSCRIPTION_STATUS.EXPIRED,
        },
      });

      console.log(
        `updated invoicePaymentFailed subscription successfully. subscription.id: ${subscription.id}.`,
      );

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot update invoicePaymentFailed subscription. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  async customerSubscriptionDeleted(
    messageAttributes: SQS.MessageBodyAttributeMap,
  ): Promise<boolean> {
    const { objStr } = getSqsMessageAttribute(messageAttributes);
    const { subscriptionId, stripeCustomerId } = objStr;
    try {
      const subscription = await this.getSubscription(subscriptionId, stripeCustomerId);

      await this.prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: SUBSCRIPTION_STATUS.CANCELED,
        },
      });

      console.log(
        `updated customerSubscriptionDeleted subscription successfully. subscription.id: ${subscription.id}.`,
      );

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot update customerSubscriptionDeleted subscription. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  private getSubscription = async (
    subscriptionId: string,
    stripeCustomerId: string,
  ): Promise<{ id: number; buyerId: number; sellerId: number; membershipId: number }> => {
    const buyer = await this.prisma.user.findFirst({
      where: {
        userPrivate: {
          stripeCustomerId,
        },
      },
    });
    if (!buyer) {
      throw Error(`user does not exist. stripeCustomerId: ${stripeCustomerId}.`);
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeSubscriptionKey: subscriptionId,
      },
    });
    if (!subscription) {
      throw Error(`subscription does not exist. subscriptionId: ${subscriptionId}.`);
    }
    if (!subscription.buyerId) {
      throw Error(`buyerId does not exist. subscriptionId: ${subscriptionId}.`);
    }
    if (!subscription.sellerId) {
      throw Error(`sellerId does not exist. subscriptionId: ${subscriptionId}.`);
    }

    return {
      id: subscription.id,
      buyerId: subscription.buyerId,
      sellerId: subscription.sellerId,
      membershipId: subscription.membershipId,
    };
  };

  private getAmount = async (membershipId: number): Promise<number> => {
    const membership = await this.prisma.membership.findUnique({
      where: {
        id: membershipId,
      },
      include: {
        membershipPrice: {
          select: {
            amount: true,
            jpy: true,
          },
        },
      },
    });
    if (!membership) {
      throw Error(`membership does not exist. membershipId: ${membershipId}.`);
    }

    return membership.membershipPrice.amount;
  };
}
