import config from '@config';
import { Aws } from '@core/aws';
import { WebhookEvent } from '@interfaces';
import { SubscriptionService } from '@modules/subscription/subscription.service';
import { SuperchatService } from '@modules/superchat/superchat.service';
import { Consumer, SQSMessage } from 'sqs-consumer';
import { Container, Service } from 'typedi';
import { SqsSendEventType } from './enum/sqs-send-event';
//import { SESService } from './ses.provider';
import { SendGridService } from './sendgrid.provider';

type QueueParams = {
  MessageAttributes: Aws.SQS.MessageBodyAttributeMap;
  MessageBody: string;
  QueueUrl: string;
  MessageGroupId?: string;
  MessageDeduplicationId?: string;
};

const { sqsWebhookStripeQueueUrl } = config.aws;

@Service()
export class SqsService {
  readonly _sqs: Aws.SQS;
  readonly consumer: Consumer;

  constructor() {
    this._sqs = new Aws.SQS({ apiVersion: '2012-11-05' });
    this.consumer = Consumer.create({
      queueUrl: sqsWebhookStripeQueueUrl,
      messageAttributeNames: ['All'],
      handleMessage: async (message: SQSMessage) => {
        await this.handleMessage(message);
      },
      sqs: this._sqs,
    });
  }

  start(cb: (url: string) => void): void {
    this.consumer.on('error', (err: Error) => {
      console.error(`consumer on error ${err.message}`);
    });
    this.consumer.on('processing_error', (err: Error) => {
      console.error(`consumer on processing_error ${err.message}`);
    });
    this.consumer.start();

    cb(sqsWebhookStripeQueueUrl);
  }

  async sendQueue(params: QueueParams): Promise<void> {
    try {
      const res = await this._sqs.sendMessage(params).promise();
      const { MessageId } = res;

      console.log(`Send queue MessageId: ${MessageId || 'no messageId'}.`);
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw new Error(`fail to send queue ${message}.`);
    }
  }

  private handleMessage = async (message: SQSMessage): Promise<void> => {
    const { MessageAttributes } = message;
    if (!MessageAttributes) {
      throw Error(`sqs has no message attributes ${JSON.stringify(message)}.`);
    }

    const result = await this.process(MessageAttributes);
    if (result) {
      console.log(`sqs process message ${JSON.stringify(message)} successfully.`);
    }
  };

  private process = async (
    MessageAttributes: Aws.SQS.MessageBodyAttributeMap,
  ): Promise<boolean> => {
    const superchatService = Container.get(SuperchatService);
    const subscriptionService = Container.get(SubscriptionService);
    const sendGridService = Container.get(SendGridService);

    console.log('sqs provider get messageAttributes:', MessageAttributes);

    const eventType = MessageAttributes.eventType.StringValue;

    switch (eventType) {
      case WebhookEvent.paymentIntentSucceeded:
        return await superchatService.createSuperchat(MessageAttributes);
      case WebhookEvent.checkoutSessionCompleted:
        return await subscriptionService.checkoutSessionCompleted(MessageAttributes);
      case WebhookEvent.invoicePaid:
        return await subscriptionService.invoicePaid(MessageAttributes);
      case WebhookEvent.invoicePaymentFailed:
        return await subscriptionService.invoicePaymentFailed(MessageAttributes);
      case WebhookEvent.customerSubscriptionDeleted:
        return await subscriptionService.customerSubscriptionDeleted(MessageAttributes);
      case WebhookEvent.updateEmail:
        return await sendGridService.sendVerifyEmail(MessageAttributes);
      case WebhookEvent.inquiry:
        return await sendGridService.sendInquiryEmail(MessageAttributes);
      case WebhookEvent.executePrivilege:
        return await sendGridService.sendExecuteNftPrivilegeEmails(MessageAttributes);
      case WebhookEvent.chargeRefunded:
        return await superchatService.refundSuperchat(MessageAttributes);
      default:
        throw Error('unsupported stripe webhook type.');
    }
  };

  static generateMessageAttribute(
    sqsSendEvent: SqsSendEventType,
    filename: string,
  ): Aws.SQS.MessageBodyAttributeMap {
    const params: Aws.SQS.MessageBodyAttributeMap = {
      eventType: {
        DataType: 'String',
        StringValue: sqsSendEvent,
      },
      filename: {
        DataType: 'String',
        StringValue: filename,
      },
    };

    return params;
  }

  // TODO: 全てのQueue処理でpayloadを使うようにまとめたい
  static generatePayloadMessageAttribute(
    sqsSendEvent: SqsSendEventType,
    payload: string,
  ): Aws.SQS.MessageBodyAttributeMap {
    const params: Aws.SQS.MessageBodyAttributeMap = {
      eventType: {
        DataType: 'String',
        StringValue: sqsSendEvent,
      },
      payload: {
        DataType: 'String',
        StringValue: payload,
      },
    };

    return params;
  }
}
