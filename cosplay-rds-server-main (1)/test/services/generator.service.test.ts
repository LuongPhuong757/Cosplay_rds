import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { GeneratorService } from '../../src/services/generator.service';

describe('GeneratorService', () => {
  const generatorService = new GeneratorService();

  describe('getRandomString', () => {
    it('returns default length random string', () => {
      const randomString = generatorService.getRandomString();

      expect(randomString).toHaveLength(8);
    });

    it('returns random string depends on the passing argument', () => {
      const randomString = generatorService.getRandomString(20);

      expect(randomString).toHaveLength(20);
    });

    it('returns max length string', () => {
      const randomString = generatorService.getRandomString(1000);

      expect(randomString).toHaveLength(128);
    });
  });

  describe('generateEmailTitle', () => {
    it('returns email title', () => {
      const emailTitle = generatorService.generateEmailTitle('base', 'en');

      expect(emailTitle).toBe('Example Title');
    });

    it('throw no file exist', () => {
      expect(() => generatorService.generateEmailTitle('hello', 'ng')).toThrow('no file exist');
    });

    it('throw invalid lang when parsed does not have supported lang', () => {
      expect(() => generatorService.generateEmailTitle('base', 'ng')).toThrow('invalid lang ng');
    });
  });

  describe('generateHtml', () => {
    it('returns email html', async () => {
      const emailHtml = await generatorService.generateHtml('base', 'example', { user: 'hello' });

      expect(typeof emailHtml).toBe('string');
    });

    it('throw no file exist', async () => {
      await expect(() =>
        generatorService.generateHtml('nofile', 'ng', { user: 'hello' }),
      ).rejects.toThrow('no file exist');
    });
  });

  describe('token method', () => {
    const token = 'hello test token';

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('can encode and decode', () => {
      const encoded = generatorService.generateToken({ token }, { expiresIn: '1h' });
      const decoded = generatorService.decodeToken<{ token: string }>(encoded);

      expect(decoded.token).toBe(token);
    });

    it('throw general error', () => {
      expect(() => generatorService.decodeToken<{ token: string }>('hellotoken')).toThrow(
        'invalid token',
      );
    });

    it('throw token expired error', () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new TokenExpiredError('token is expired', new Date());
      });
      const encoded = generatorService.generateToken({ token }, { expiresIn: '1h' });
      expect(() => generatorService.decodeToken<{ token: string }>(encoded)).toThrow(
        'token is expired',
      );
    });
  });
});
