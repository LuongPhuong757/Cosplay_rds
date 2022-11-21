import { getSqsMessageAttribute } from '@common/util/get-sqs-message-attribute-map';
import { jsonParseSqsBody, jsonParseSqsBodyQu } from '@common/util/json-parse-sqs-body';
import { GeneratorService } from '@services/generator.service';
import { LanguageService } from '@services/language.service';
import SQS from 'aws-sdk/clients/sqs';
import { Service } from 'typedi';

// TODO: 多分どちらもsupport2@curecos.comを使うはず。
const FROM_EMAIL = 'noreplay <support2@curecos.com>';
const CURECOS_CONTACT_EMAIL = 'support2@curecos.com';

@Service()
export abstract class SendEmailService {
  protected constructor(
    protected readonly generatorService: GeneratorService,
    protected readonly languageService: LanguageService,
  ) {}

  abstract sendEmail(email: string[], subject: string, body: string): Promise<void>;

  async sendVerifyEmail(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    try {
      const { objStr } = getSqsMessageAttribute(messageAttributes);
      const { payload } = objStr;
      const { emailVerifyLink, email, lang } = jsonParseSqsBody<{
        emailVerifyLink: string;
        email: string;
        lang: string;
      }>(payload, ['emailVerifyLink', 'email', 'lang']);

      const htmlTitle = this.generatorService.generateEmailTitle('email-verify', lang);
      const htmlBody = await this.generatorService.generateHtml('email-verify', 'main', {
        user: {
          user_metadata: {
            lang: this.languageService.getLanguage(lang),
          },
        },
        email,
        url: emailVerifyLink,
      });

      await this.sendEmail([email], htmlTitle, htmlBody);

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot send verify email. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  async sendInquiryEmail(messageAttributes: SQS.MessageBodyAttributeMap): Promise<boolean> {
    try {
      const { objStr } = getSqsMessageAttribute(messageAttributes);
      const { payload } = objStr;
      const {
        email,
        name,
        inquiryItem,
        nameFurigana,
        content,
        lang,
        time,
        userUrl,
        device,
        userAgent,
        userIp,
      } = jsonParseSqsBodyQu<{
        email: string;
        name: string;
        inquiryItem: string;
        nameFurigana: string;
        content: string;
        time: string;
        userUrl: string;
        device: string;
        userAgent: string;
        userIp: string;
        lang: string;
      }>(payload, [
        'email',
        'userUrl',
        'device',
        'userAgent',
        'userIp',
        'name',
        'inquiryItem',
        'nameFurigana',
        'content',
        'time',
        'lang',
      ]);
      const sendEmailArgs = [
        {
          email: email,
          body: 'user',
          htmlBodyOptions: {
            email,
            name,
            inquiryItem,
            nameFurigana,
            content,
            userUrl,
            device,
            userAgent,
            lang,
          },
        },
        {
          email: CURECOS_CONTACT_EMAIL,
          body: 'admin',
          htmlBodyOptions: {
            email,
            name,
            inquiryItem,
            nameFurigana,
            content,
            userUrl,
            device,
            time,
            userIp,
            userAgent,
            lang,
          },
        },
      ];
      const promises = sendEmailArgs.map(async (sendEmailArg) => {
        let htmlTitle = '';
        if (sendEmailArg.body === 'admin') {
          if (lang === 'ja') {
            htmlTitle = `Curecos 問い合わせがありました　[${time}]`;
          } else {
            htmlTitle = `Curecos I received an inquiry [${time}]`;
          }
        } else {
          htmlTitle = this.generatorService.generateEmailTitle('inquiry', lang);
        }
        const htmlBody = await this.generatorService.generateHtml(
          'inquiry',
          sendEmailArg.body,
          sendEmailArg.htmlBodyOptions,
        );

        this.sendEmail([sendEmailArg.email], htmlTitle, htmlBody);
      });
      await Promise.all(promises);

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot send execute privilege email. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }

  async sendExecuteNftPrivilegeEmails(
    messageAttributes: SQS.MessageBodyAttributeMap,
  ): Promise<boolean> {
    try {
      const { objStr } = getSqsMessageAttribute(messageAttributes);
      const { payload } = objStr;
      const { userName, userEmail, ownerName, ownerEmail, title, emailBody } = jsonParseSqsBody<{
        userName: string;
        userEmail: string;
        ownerName: string;
        ownerEmail: string;
        title: string;
        emailBody: string;
      }>(payload, ['userName', 'userEmail', 'ownerName', 'ownerEmail', 'title', 'emailBody']);

      const sendEmailArgs = [
        {
          email: userEmail,
          body: 'user',
          htmlBodyOptions: {
            userName,
            title,
            emailBody,
          },
        },
        {
          email: ownerEmail,
          body: 'owner',
          htmlBodyOptions: {
            ownerName,
            userName,
            title,
            emailBody,
          },
        },
        {
          email: CURECOS_CONTACT_EMAIL,
          body: 'admin',
          htmlBodyOptions: {
            ownerEmail,
            userEmail,
            title,
            emailBody,
          },
        },
      ];

      const promises = sendEmailArgs.map(async (sendEmailArg) => {
        const htmlTitle = this.generatorService.generateEmailTitle('execute-privilege', 'user');
        const htmlBody = await this.generatorService.generateHtml(
          'execute-privilege',
          sendEmailArg.body,
          sendEmailArg.htmlBodyOptions,
        );

        this.sendEmail([sendEmailArg.email], htmlTitle, htmlBody);
      });
      await Promise.all(promises);

      return true;
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot send execute privilege email. message: ${message} messageAttributes: ${JSON.stringify(
          messageAttributes,
        )}.`,
      );

      return false;
    }
  }
}
