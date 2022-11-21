import { SendEmailService } from '@providers/sendemail.provider';
import { GeneratorService } from '@services/generator.service';
import { LanguageService } from '@services/language.service';
import AWS from 'aws-sdk';
import { Service } from 'typedi';
import { Aws } from 'core/aws';

const FROM_EMAIL = 'noreplay <support2@curecos.com>';

@Service()
export class SESService extends SendEmailService {
  readonly _ses: Aws.SES;

  constructor(
    protected readonly generatorService: GeneratorService,
    protected readonly languageService: LanguageService,
  ) {
    super(generatorService, languageService);
    this._ses = new AWS.SES({ apiVersion: '2010-12-01' });
  }

  async sendEmail(email: string[], subject: string, body: string): Promise<void> {
    const params = {
      Destination: {
        ToAddresses: email,
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: FROM_EMAIL,
    };

    try {
      const sendPromise = await this._ses.sendEmail(params).promise();

      console.log(`Message sent successfully! MessageId: ${sendPromise.MessageId}.`);
    } catch (err) {
      const { message } = <Error>err;

      console.error(`cannot send email. email: ${email.join(',')} message :${message}`);
    }
  }
}
