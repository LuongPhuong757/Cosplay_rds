/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import config from '@config';
import { TwitterApi, IOAuth2RequestTokenResult, UserV2 } from 'twitter-api-v2';
import { Service } from 'typedi';

const { clientId, clientSecret, callbackUrl } = config.twitter;

interface TwitterOAuthToken {
  accessToken: string;
  refreshToken: string;
}

@Service()
export class TwitterService {
  private client: TwitterApi;
  private scope = ['tweet.write', 'offline.access', 'tweet.read', 'users.read']; // 後半２つはme取得に必要
  static EXPIRE_OAUTH_TOKEN_CODE: 401;

  constructor() {
    this.client = new TwitterApi({ clientId, clientSecret });
  }

  generateAuthLink(): IOAuth2RequestTokenResult {
    const authLink = this.client.generateOAuth2AuthLink(callbackUrl, { scope: this.scope });

    return authLink;
  }

  async verify(code: string, codeVerifier: string): Promise<TwitterOAuthToken> {
    const result = await this.client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackUrl,
    });

    return result as { accessToken: string; refreshToken: string };
  }

  async me(accessToken: string): Promise<UserV2> {
    const client = new TwitterApi(accessToken);
    const { data: userObject } = await client.v2.me();

    return userObject;
  }

  async tweet(content: string, accessToken: string): Promise<ResultResponse> {
    const client = new TwitterApi(accessToken);
    await client.v2.tweet(content);

    return {
      result: Result.ok,
    };
  }

  async refreshOAuthToken(refreshToken: string): Promise<TwitterOAuthToken> {
    const { accessToken, refreshToken: newRefreshToken } = await this.client.refreshOAuth2Token(
      refreshToken,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken!,
    };
  }
}
