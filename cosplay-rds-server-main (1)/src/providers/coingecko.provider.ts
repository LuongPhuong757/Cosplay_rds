import { CoinGeckoClient } from 'coingecko-api-v3';
import { Service } from 'typedi';
import { TokenInfo, TokenListRecord } from '@interfaces';

// https://docs.google.com/spreadsheets/d/1wTTuxXt8n9q7C4NDXqQpI3wpKu1_5bGVmP9Xz0XGSyU/edit
export const COIN_TYPE = {
  ETH_COIN_NAME: 'ethereum',
  COT_COIN_NAME: 'cosplay-token-2',
  MATIC_COIN_NAME: 'matic-network',
  USDC_COIN_NAME: 'usd-coin',
} as const;
export const BINANCE_COIN_NAME = 'binancecoin';
export type TokenName = typeof COIN_TYPE[keyof typeof COIN_TYPE];
export const tokenList = [
  COIN_TYPE.ETH_COIN_NAME,
  COIN_TYPE.COT_COIN_NAME,
  COIN_TYPE.MATIC_COIN_NAME,
  COIN_TYPE.USDC_COIN_NAME,
];

@Service()
export class CoingeckoProvider {
  client: CoinGeckoClient;

  constructor() {
    this.client = new CoinGeckoClient({
      timeout: 15000,
      autoRetry: true,
    });
  }

  public async getTokenListInfo(): Promise<TokenListRecord> {
    const res = await this.client.simplePrice({
      ids: tokenList.join(','),
      vs_currencies: 'jpy',
      include_24hr_change: true,
    });

    const entries = Object.entries(res).map(([tokenName, { jpy, jpy_24h_change: change24h }]) => {
      return [
        tokenName,
        {
          jpy,
          change24h
        } as TokenInfo,
      ];
    });

    return Object.fromEntries(entries);
  }
}
