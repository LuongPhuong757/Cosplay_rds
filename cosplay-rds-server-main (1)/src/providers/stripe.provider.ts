import config from '@config';
import Stripe from 'stripe';
import { Service } from 'typedi';

const { secretKey } = config.stripe;
const { isDev } = config.app;

const subscriptionInterval = isDev ? 'day' : 'month';

@Service()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(secretKey, { apiVersion: '2020-08-27' });
  }

  async createProduct(name: string): Promise<string> {
    const product = await this.stripe.products.create({
      name,
    });

    return product.id;
  }

  async updateProduct(stripeProductId: string, name: string): Promise<void> {
    await this.stripe.products.update(stripeProductId, {
      name: `@${name}`,
    });
  }

  async createPrice(amount: number, currency: string, stripeProductId: string): Promise<string> {
    const price = await this.stripe.prices.create({
      unit_amount: amount,
      currency,
      recurring: { interval: subscriptionInterval }, // TODO: debug時にはday。通常はmonth。
      product: stripeProductId,
    });

    return price.id;
  }

  async cancelCustomerSubscription(stripeSubscriptionKey: string): Promise<void> {
    const deleted = await this.stripe.subscriptions.del(stripeSubscriptionKey);

    console.log(`cancelCustomerSubscription. deleteId: ${deleted.id}.`);
  }
}
