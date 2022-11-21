import { TokenInfo, TokenListRecord } from '@interfaces';
import { CoingeckoProvider, COIN_TYPE } from '@providers/coingecko.provider';
import { MaticProvider } from '@providers/matic.provider';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import { Service } from 'typedi';
import { TokenInfoListResponse } from './dto/response/token-info-list';

@Service()
export class TokenInfoService {
  constructor(
    private readonly coingeckoProvider: CoingeckoProvider,
    private readonly maticProvider: MaticProvider,
  ) {}

  async tokenInfoList(): Promise<TokenInfoListResponse> {
    const tokenInfoRecord = await this.coingeckoProvider.getTokenListInfo();

    const tokenInfoList = this.convertToResponse(tokenInfoRecord);
    tokenInfoList.lpCot = await this.lpcotTokenInfo(tokenInfoList.cot, tokenInfoList.usdc);

    return tokenInfoList;
  }

  private async lpcotTokenInfo(cotInfo: TokenInfo, usdcInfo: TokenInfo): Promise<TokenInfo> {
    const reserves: {
      reserve0: ethers.BigNumber;
      reserve1: ethers.BigNumber;
      // eslint-disable-next-line  @typescript-eslint/no-unsafe-call
    } = (await this.maticProvider.lpcot.functions.getReserves()) as {
      reserve0: ethers.BigNumber;
      reserve1: ethers.BigNumber;
    };

    const reserveUsdc = this.shift6(new BigNumber(reserves.reserve0.toString()));
    const reserveCot = this.shift18(new BigNumber(reserves.reserve1.toString()));

    // eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment
    const _totalSupply: ethers.BigNumber = (await this.maticProvider.lpcot.functions.totalSupply()) as ethers.BigNumber;

    const totalSupply = this.shift18(new BigNumber(_totalSupply.toString()));

    const tvl = reserveUsdc.times(usdcInfo.jpy).plus(reserveCot.times(cotInfo.jpy));
    const lpCotPrice = tvl.div(totalSupply);

    const preTvl = reserveUsdc
      .times(new BigNumber(usdcInfo.jpy).div(1 + usdcInfo.change24h))
      .plus(reserveCot.times(new BigNumber(cotInfo.jpy).div(1 + cotInfo.change24h)));
    const preLpCotPrice = preTvl.div(totalSupply);

    const change24h = lpCotPrice.div(preLpCotPrice).minus(1);

    return {
      jpy: lpCotPrice.toNumber(),
      change24h: change24h.toNumber(),
    };
  }

  shift18(a: BigNumber): BigNumber {
    return a.div(new BigNumber(10).pow(18));
  }

  shift6(a: BigNumber): BigNumber {
    return a.div(new BigNumber(10).pow(6));
  }

  convertToResponse(tokenInfoRecord: TokenListRecord): TokenInfoListResponse {
    return {
      eth: tokenInfoRecord[COIN_TYPE.ETH_COIN_NAME],
      cot: tokenInfoRecord[COIN_TYPE.COT_COIN_NAME],
      matic: tokenInfoRecord[COIN_TYPE.MATIC_COIN_NAME],
      usdc: tokenInfoRecord[COIN_TYPE.USDC_COIN_NAME],
    } as TokenInfoListResponse;
  }
}
