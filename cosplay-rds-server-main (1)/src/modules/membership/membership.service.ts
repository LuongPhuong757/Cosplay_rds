import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { User } from '@modules/user/user.model';
import { SUBSCRIPTION_STATUS } from '@prisma/client';
import { StripeService } from '@providers/stripe.provider';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { UpdateMembershipPriceInput } from './dto/input/update-membership-price';
import { GetStripePriceInfoResponse } from './dto/response/get-membership-stripe-price-info';

@Service()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async memberships(id: number, pagingOptions?: PagingOptionsInput): Promise<User[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const memberships = await this.prisma.subscription.findMany({
      ...pagingOptionsQuery,
      where: {
        buyerId: id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      include: {
        seller: true,
      },
    });

    return memberships.map((membership) => membership?.seller as User);
  }

  async membershippedBy(id: number, pagingOptions?: PagingOptionsInput): Promise<User[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const memberships = await this.prisma.subscription.findMany({
      ...pagingOptionsQuery,
      where: {
        sellerId: id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      include: {
        buyer: true,
      },
    });

    return memberships.map((membership) => membership?.buyer as User);
  }

  async updateMembershipPrice(
    currentUser: User,
    updateMembershipPriceInput: UpdateMembershipPriceInput,
  ): Promise<ResultResponse> {
    const { id } = currentUser;
    const { amount, currency } = updateMembershipPriceInput;
    try {
      const myInfo = await this.prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          membership: {
            include: {
              membershipPrice: true,
            },
          },
        },
      });
      if (!myInfo) {
        throw Error(`myInfo does not exist. userId: ${id}.`);
      }

      const { membership } = myInfo;
      if (
        amount === membership?.membershipPrice.amount &&
        currency === membership?.membershipPrice.currency
      ) {
        console.log(`not update membership price. amount is same. userId: ${id}.`);

        return {
          result: Result.ok,
        };
      }

      const stripeProductId = await this.getStripeProductId(myInfo);
      const stripePriceId = await this.stripeService.createPrice(amount, currency, stripeProductId);
      if (!membership) {
        return await this.createNewMembership(id, amount, currency, stripeProductId, stripePriceId);
      }

      const { priceId } = membership;
      const price = await this.prisma.price.update({
        where: {
          id: priceId,
        },
        data: {
          amount,
          currency,
          jpy: amount,
        },
      });

      await this.prisma.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          stripePriceId,
          priceId: price.id,
        },
      });
      console.log(`update membership price successfully. userId: ${id}.`);

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `membership price is unabled to be updated. message: ${message} userId: ${id}.`,
      );

      return {
        result: Result.ng,
      };
    }
  }

  async getMembershipStripePriceInfo(userId: number): Promise<GetStripePriceInfoResponse | null> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
      },
      include: {
        membershipPrice: true,
      },
    });
    if (!membership) return null;
    const { stripePriceId, membershipPrice } = membership;
    const { amount, currency } = membershipPrice;

    return { stripePriceId, amount, currency };
  }

  private getStripeProductId = async (myInfo: User): Promise<string> => {
    const { account } = myInfo;
    if (myInfo.membership) {
      return myInfo.membership.stripeProductId;
    }
    const stripeProductId = await this.stripeService.createProduct(`@${account}`);

    return stripeProductId;
  };

  private createNewMembership = async (
    id: number,
    amount: number,
    currency: string,
    stripeProductId: string,
    stripePriceId: string,
  ): Promise<ResultResponse> => {
    const price = await this.prisma.price.create({
      data: {
        amount,
        currency,
        jpy: amount,
      },
    });
    await this.prisma.membership.create({
      data: {
        userId: id,
        stripeProductId,
        stripePriceId,
        priceId: price.id,
      },
    });

    console.log(`created membership price successfully. userId: ${id}.`);

    return {
      result: Result.ok,
    };
  };
}
