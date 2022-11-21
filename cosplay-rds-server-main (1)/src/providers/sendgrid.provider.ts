import config from '@config';
import { SendEmailService } from '@providers/sendemail.provider';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import { MailService } from '@sendgrid/mail';
import { GeneratorService } from '@services/generator.service';
import { LanguageService } from '@services/language.service';
import { Service } from 'typedi';

const { apiKey } = config.sendGrid;

const FROM_EMAIL = 'noreplay <support2@curecos.com>';

@Service()
export class SendGridService extends SendEmailService {
  readonly _sendGrid: MailService;

  constructor(
    protected readonly generatorService: GeneratorService,
    protected readonly languageService: LanguageService,
  ) {
    super(generatorService, languageService);
    this._sendGrid = new MailService();
    this._sendGrid.setApiKey(apiKey);
  }

  async sendEmail(email: string[], subject: string, body: string): Promise<void> {
    const params = {
      from: FROM_EMAIL,
      to: email,
      subject,
      html: body,
    } as MailDataRequired;

    try {
      await this._sendGrid.send(params);

      console.log(`Message sent successfully! email: ${email.join(',')}`);
    } catch (err) {
      const { message } = <Error>err;

      console.error(`cannot send email. email: ${email.join(',')} message :${message}`);
    }
  }
}
