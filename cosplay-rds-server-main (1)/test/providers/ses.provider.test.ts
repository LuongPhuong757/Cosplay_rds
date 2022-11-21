import 'reflect-metadata';
import { WebhookEvent } from '../../src/interfaces';
import { SESService } from '../../src/providers/ses.provider';
import { SqsService } from '../../src/providers/sqs.provider';
import { GeneratorService } from '../../src/services/generator.service';
import { LanguageService } from '../../src/services/language.service';

describe('SESService', () => {
  const generatorService = new GeneratorService();
  const languageService = new LanguageService();
  let sESService: SESService;

  beforeEach(() => {
    sESService = new SESService(generatorService, languageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    const mockedFunctions = {
      mockThrow: jest.fn().mockImplementationOnce(() => {
        throw new Error('error');
      }),
      sendEmail: jest.fn().mockImplementation(() => ({ promise: () => true })),
    };

    sESService._ses.sendEmail = mockedFunctions.sendEmail;

    return mockedFunctions;
  };

  describe('sendVerifyEmail', () => {
    it('send email', async () => {
      const { sendEmail } = setup();
      const payload = {
        email: 'mock@example.com',
        emailVerifyLink: 'https://dev.curecos.net',
        lang: 'en',
      };
      const messageAttributes = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.updateEmail,
        JSON.stringify(payload),
      );
      const result = await sESService.sendVerifyEmail(messageAttributes);

      expect(result).toBe(true);
      expect(sendEmail).toBeCalled();
    });

    it('throw error', async () => {
      const payload = {
        email: 'mock@example.com',
        emailVerifyLink: 'https://dev.curecos.net',
      };
      const messageAttributes = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.updateEmail,
        JSON.stringify(payload),
      );
      const result = await sESService.sendVerifyEmail(messageAttributes);

      expect(result).toBe(false);
    });

    it('throw sendEmail error', async () => {
      const { mockThrow } = setup();
      const payload = {
        email: 'mock@example.com',
        emailVerifyLink: 'https://dev.curecos.net',
        lang: 'en',
      };
      sESService.sendEmail = mockThrow;
      const messageAttributes = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.updateEmail,
        JSON.stringify(payload),
      );
      const result = await sESService.sendVerifyEmail(messageAttributes);

      expect(result).toBe(false);
    });
  });

  describe('sendExecuteNftPrivilegeEmail', () => {
    it('send email', async () => {
      const { sendEmail } = setup();
      const payload = {
        userName: 'mockUser',
        userEmail: 'mockUser@example.com',
        ownerName: 'mockOwner',
        ownerEmail: 'mockOwner@example.com',
        title: 'nftPrivilegeNftTitle',
        emailBody: 'nftPrivilegeNftBody',
      };
      const messageAttributes = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.executePrivilege,
        JSON.stringify(payload),
      );
      const result = await sESService.sendExecuteNftPrivilegeEmails(messageAttributes);

      expect(result).toBe(true);
      expect(sendEmail).toBeCalledTimes(3);
    });

    it('throw error', async () => {
      const payload = {
        userEmail: 'mockUser@example.com',
        ownerEmail: 'mockOwner@example.com',
      };
      const messageAttributes = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.executePrivilege,
        JSON.stringify(payload),
      );
      const result = await sESService.sendExecuteNftPrivilegeEmails(messageAttributes);

      expect(result).toBe(false);
    });

    it('throw sendEmail error', async () => {
      const { mockThrow } = setup();
      const payload = {
        userName: 'mockUser',
        userEmail: 'mockUser@example.com',
        ownerName: 'mockOwner',
        ownerEmail: 'mockOwner@example.com',
        title: 'nftPrivilegeNftTitle',
        emailBody: 'nftPrivilegeNftBody',
      };
      sESService.sendEmail = mockThrow;
      const messageAttributes = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.executePrivilege,
        JSON.stringify(payload),
      );
      const result = await sESService.sendExecuteNftPrivilegeEmails(messageAttributes);

      expect(result).toBe(false);
    });
  });
});
