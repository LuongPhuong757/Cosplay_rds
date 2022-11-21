import * as crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import config from '@config';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Liquid } from 'liquidjs';
import { Service } from 'typedi';

const { frontUrl, jwtSecret } = config.app;

const EMAIL_TEMPLATE_DIRECTORY = 'emails';
const EMAIL_TITLE_FILENAME = 'title.json';

@Service()
export class GeneratorService {
  getRandomString(stringLength = 8): string {
    const randomStr = crypto.randomBytes(64).toString('hex');

    return randomStr.substring(0, stringLength);
  }

  generateEmailTitle(pathname: string, lang: string): string {
    const filepath = resolve(
      process.cwd(),
      EMAIL_TEMPLATE_DIRECTORY,
      pathname,
      EMAIL_TITLE_FILENAME,
    );
    if (!existsSync(filepath)) {
      throw new Error('no file exist');
    }
    const json = readFileSync(filepath);
    const parsed = JSON.parse(json.toString()) as Record<string, string>;
    if (!parsed.hasOwnProperty(lang)) {
      throw new Error(`invalid lang ${lang}`);
    }

    return parsed[lang];
  }

  async generateHtml(
    pathname: string,
    filename: string,
    options: Record<string, Record<string, Record<string, string>> | string | undefined>,
  ): Promise<string> {
    const filepath = resolve(
      process.cwd(),
      EMAIL_TEMPLATE_DIRECTORY,
      pathname,
      `${filename}.liquid`,
    );
    if (!existsSync(filepath)) {
      throw new Error('no file exist');
    }
    const engine = new Liquid({
      root: resolve(process.cwd(), EMAIL_TEMPLATE_DIRECTORY, pathname),
      extname: '.liquid',
    });

    return (await engine.renderFile(filename, options)) as Promise<string>;
  }

  generateEmailVerifyLink(token: string): string {
    return `${frontUrl}emailVerify?token=${token}`;
  }

  generateToken(payload: Record<string, string>, options: { expiresIn: string }): string {
    return jwt.sign(payload, jwtSecret, options);
  }

  decodeToken<T>(token: string): T {
    try {
      const decoded = jwt.verify(token, jwtSecret);

      return decoded as T;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new Error('token is expired');
      }

      throw new Error('invalid token');
    }
  }
}
