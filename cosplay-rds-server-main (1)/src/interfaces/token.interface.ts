import { TokenName } from '@providers/coingecko.provider';

export type TokenInfo = {
  jpy: number;
  change24h: number;
};

export type TokenListRecord = Record<TokenName, TokenInfo>;
