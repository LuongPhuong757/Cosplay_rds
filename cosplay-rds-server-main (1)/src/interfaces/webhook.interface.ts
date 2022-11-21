export const WebhookEvent = {
  paymentIntentSucceeded: 'payment_intent.succeeded',
  checkoutSessionCompleted: 'checkout.session.completed',
  invoicePaid: 'invoice.paid',
  invoicePaymentFailed: 'invoice.payment_failed',
  customerSubscriptionDeleted: 'customer.subscription.deleted',
  updateEmail: 'updateEmail',
  inquiry: 'inquiry',
  executePrivilege: 'executePrivilege',
  chargeRefunded: 'charge.refunded',
} as const;

export type WebhookEventType = typeof WebhookEvent[keyof typeof WebhookEvent];

export type CreateSuperchatPayloadType = {
  auth0Id: string;
  postId: number;
  comment?: string;
  replyId?: number;
  amount: number;
  currency: string;
  paymentIntentId: string;
};

export type RefundSuperchatPayloadType = {
  paymentIntentId: string;
};
