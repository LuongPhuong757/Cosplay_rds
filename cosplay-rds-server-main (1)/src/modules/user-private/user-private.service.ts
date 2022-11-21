/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { TxListInfo } from '@interfaces';
import { User } from '@modules/user/user.model';
import { UserRepository } from '@modules/user/user.repository';
import { ExplorerService } from '@providers/explorer.provider';
import { TwitterService } from '@providers/twitter.provider';
import { BigNumber } from 'bignumber.js';
import { IOAuth2RequestTokenResult } from 'twitter-api-v2';
import { Service } from 'typedi';
import { UpdateUserTotalCotInput } from './dto/input/update-user-total-cot';
import { VerifyTwitterAuthInput } from './dto/input/verify-twitter-auth';
import { CotReceiveHistoryResponse } from './dto/response/cot-receive-history';
import { CotHistoryType } from './enum/cot-history-type';
import { TransactionType } from './enum/transaction-type';
import { UserPrivate } from './user-private.model';
import { UserPrivateRepository } from './user-private.repository';

@Service()
export class UserPrivateService {
  constructor(
    private readonly userPrivateRepository: UserPrivateRepository,
    private readonly userRepository: UserRepository,
    private readonly twitterService: TwitterService,
    private readonly explorerService: ExplorerService,
  ) {}

  async getUsersWithPublicAddress(pagingOptions?: PagingOptionsInput): Promise<UserPrivate[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.userPrivateRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        NOT: {
          publicAddress: null,
        },
      },
      select: {
        id: true,
        publicAddress: true,
      },
    });
  }

  async updateUsersTotalCot(inputs: [UpdateUserTotalCotInput]): Promise<ResultResponse> {
    try {
      const promises = inputs.map(async ({ id, totalCot }) => {
        return await this.userPrivateRepository.update({
          where: {
            id,
          },
          data: {
            totalCot,
          },
        });
      });

      await Promise.all(promises);

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.log(`cannot update users total cot ${message}`);

      return {
        result: Result.ng,
      };
    }
  }

  async tweetPost(userId: number, postUrl: string): Promise<void> {
    const userPrivate = await this.userPrivateRepository.findFirst({
      where: {
        userId,
      },
    });
    if (!userPrivate?.twitterAccessToken || !userPrivate?.twitterRefreshToken) {
      return;
    }

    try {
      await this.twitterService.tweet(postUrl, userPrivate?.twitterAccessToken);
    } catch (e) {
      console.error(e);

      // AuthTokenの期限が切れているので対応する
      // if ((e as ApiResponseError).code === TwitterService.EXPIRE_OAUTH_TOKEN_CODE))
      // 現状とりあえずアップデートする
      const oAuthToken = await this.twitterService.refreshOAuthToken(
        userPrivate.twitterRefreshToken,
      );

      await this.userPrivateRepository.update({
        where: {
          userId,
        },
        data: {
          twitterAccessToken: oAuthToken.accessToken,
          twitterRefreshToken: oAuthToken.refreshToken,
        },
      });

      await this.twitterService.tweet(postUrl, oAuthToken.accessToken);
    }
  }

  async getCotReceiveHistory(
    cotHistoryType: CotHistoryType,
    fromDay: number,
    pagingOptions: PagingOptionsInput,
    address?: string | null,
  ): Promise<CotReceiveHistoryResponse[]> {
    if (!address) {
      return [];
    }

    try {
      const txList = await this.explorerService.getTxListFromDay(fromDay, address);
      if (txList.length === 0) {
        return [];
      }

      const addresses = [
        ...new Set(txList.map((tx) => tx.from)),
        ...new Set(txList.map((tx) => tx.to)),
      ];

      const users = await this.userRepository.findMany({
        where: {
          userPrivate: {
            publicAddress: {
              in: addresses,
              mode: 'insensitive',
            },
          },
        },
        include: {
          userPrivate: true,
        },
      });

      const cotReceiveHistories = txList.map((tx) => {
        const user = this.findTxUser(tx, users);

        return {
          user,
          transactionType: tx.transactionType,
          value: tx.value,
          timeStamp: tx.timeStamp,
          networkType: tx.networkType,
        };
      });

      if (cotHistoryType === CotHistoryType.TRANSACTION) {
        return this.getPaginatedList(pagingOptions, cotReceiveHistories);
      }

      const eachUsersCotHistories = this.getEachUser(
        cotReceiveHistories.filter(
          (history) => history.transactionType === TransactionType.RECEIVE,
        ),
      ).sort(this.valueDescSort);

      return this.getPaginatedList(pagingOptions, eachUsersCotHistories);
    } catch (e) {
      const { message } = <Error>e;
      console.error(`cannot get cot receive history ${message}`);

      throw new Error(message);
    }
  }

  private findTxUser(tx: TxListInfo, users: User[]): User | null {
    if (tx.transactionType === TransactionType.RECEIVE) {
      return users.find((u) => u.userPrivate?.publicAddress?.toLowerCase() === tx.from) || null;
    }

    return users.find((u) => u.userPrivate?.publicAddress?.toLowerCase() === tx.to) || null;
  }

  async generateTwitterAuthLink(userId: number): Promise<IOAuth2RequestTokenResult> {
    const userPrivate = await this.userPrivateRepository.findFirst({
      where: {
        userId,
      },
    });

    if (userPrivate?.twitterAccessToken) {
      throw new Error('you already have twitter access token');
    }

    const authLink = this.twitterService.generateAuthLink();
    const { state, codeVerifier } = authLink;

    await this.userPrivateRepository.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        twitterOAuthState: state,
        twitterCodeVerifier: codeVerifier,
      },
      update: {
        twitterOAuthState: state,
        twitterCodeVerifier: codeVerifier,
      },
    });

    return authLink;
  }

  async verifyTwitterOauth({ code, state }: VerifyTwitterAuthInput): Promise<ResultResponse> {
    try {
      const userPrivate = await this.userPrivateRepository.findFirst({
        where: {
          twitterOAuthState: state,
        },
      });
      if (!userPrivate) {
        throw new Error("invalid request you don't have user private.");
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const oAuthToken = await this.twitterService.verify(code, userPrivate.twitterCodeVerifier!);
      const userObject = await this.twitterService.me(oAuthToken.accessToken);

      await this.userPrivateRepository.update({
        where: {
          userId: userPrivate.userId,
        },
        data: {
          twitterAccessToken: oAuthToken.accessToken,
          twitterRefreshToken: oAuthToken.refreshToken,
          twitterAccount: userObject.username,
          twitterOAuthState: null,
          twitterCodeVerifier: null,
        },
      });

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(`cannot verify twitter oauth ${message}`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async revokeTwitterOauth(userId: number): Promise<ResultResponse> {
    try {
      await this.userPrivateRepository.update({
        where: {
          userId,
        },
        data: {
          twitterAccessToken: null,
          twitterRefreshToken: null,
          twitterAccount: null,
        },
      });

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(`cannot revoke twitter oauth ${message}`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  private getEachUser(cotReceiveHistories: CotReceiveHistoryResponse[]) {
    return cotReceiveHistories.reduce((acc: CotReceiveHistoryResponse[], history) => {
      if (acc.find((a) => a.user?.id === history.user?.id)) return acc.concat([]);

      const totalValue = cotReceiveHistories
        .filter((y) => y.user?.id === history.user?.id)
        .map((y) => y.value)
        .reduce((a, b) => new BigNumber(a).plus(new BigNumber(b)), new BigNumber(0));

      return acc.concat([
        {
          ...history,
          value: totalValue.toFixed(),
        },
      ]);
    }, []);
  }

  private valueDescSort = (a: CotReceiveHistoryResponse, b: CotReceiveHistoryResponse): number => {
    const valueA = new BigNumber(a.value);
    const valueB = new BigNumber(b.value);

    return valueB.comparedTo(valueA);
  };

  private getPaginatedList(
    pagingOptions: PagingOptionsInput,
    cotReceiveHistories: CotReceiveHistoryResponse[],
  ) {
    const { limit, offset = 0 } = pagingOptions;

    return cotReceiveHistories.slice(offset, offset + (limit ?? cotReceiveHistories.length));
  }
}
