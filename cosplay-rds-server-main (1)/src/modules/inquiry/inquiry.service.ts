import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { WebhookEvent } from '@interfaces';
import { InquiryInput } from '@modules/inquiry/dto/input/inquiry';
import { NotificationService } from '@modules/notification/notification.service';
import { SqsService } from '@providers/sqs.provider';
import { Service } from 'typedi';
import config from '../../configs';
import { GeneratorService } from '../../services/generator.service';

const { sqsWebhookStripeQueueUrl } = config.aws;
@Service()
export class InquiryService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly generatorService: GeneratorService,
    private readonly sqsService: SqsService,
  ) {}

  async sendmailInquiry(input: InquiryInput): Promise<ResultResponse> {
    try {
      const payload = JSON.stringify({
        email: input.email,
        name: input.name,
        inquiryItem: input.inquiryItem,
        nameFurigana: input.nameFurigana,
        content: input.content,
        userIp: input.userIp,
        userAgent: input.userAgent,
        device: input.device,
        userUrl: input.userUrl,
        time: input.time,
        lang: input.lang,
      });
      const params = SqsService.generatePayloadMessageAttribute(WebhookEvent.inquiry, payload);
      const uuid = this.generatorService.getRandomString(10);
      await this.sqsService.sendQueue({
        MessageAttributes: params,
        MessageBody: `inquiry`,
        QueueUrl: sqsWebhookStripeQueueUrl,
        MessageGroupId: `inpuiry_${uuid}`,
        MessageDeduplicationId: uuid,
      });

      return {
        result: Result.ok,
      };
    } catch (error) {
      const { message } = <Error>error;
      console.error(`cannot generate email verify token ${message}`);

      return {
        result: Result.ng,
        message,
      };
    }
  }
}
