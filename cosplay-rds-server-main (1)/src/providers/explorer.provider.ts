import config from '@config';
import { NetworkType } from '@modules/user-private/enum/network-type';
import { TransactionType } from '@modules/user-private/enum/transaction-type';
import dayjs from 'dayjs';
import qs from 'qs';
import { Service } from 'typedi';
import { cache } from '../cache';
import request from './request.provider';
import { ExplorerBlockNumber, ExplorerTxList, TxInfo, TxListInfo } from 'interfaces';

@Service()
export class ExplorerService {
  static API_URL = {
    [NetworkType.ETHEREUM]: 'https://api.etherscan.io/api',
    [NetworkType.POLYGON]: 'https://api.polygonscan.com/api',
  } as const;

  async getTxListFromDay(fromDay: number, address: string): Promise<TxListInfo[]> {
    const cacheName = this.getCacheName(fromDay, address);
    const value = cache.get(cacheName);
    if (value) {
      return value as TxListInfo[];
    }

    const fromTimestamp = dayjs().subtract(fromDay, 'day').unix();

    const promises = [NetworkType.ETHEREUM, NetworkType.POLYGON].map(
      async (networkType) => await this.getTxListFromExplorer(fromTimestamp, address, networkType),
    );
    const [ethereum, polygon] = await Promise.all(promises);

    const txs = [...ethereum, ...polygon];

    const toTxList = txs
      .filter((tx) => tx.to === address.toLowerCase())
      .map((tx) => ({ ...tx, transactionType: TransactionType.RECEIVE }));

    const fromTxList = txs
      .filter((tx) => tx.from === address.toLowerCase())
      .map((tx) => ({ ...tx, transactionType: TransactionType.SEND }));

    const txList = [...fromTxList, ...toTxList].sort(this.timeStampDescSort);

    cache.set(cacheName, txList);

    return txList;
  }

  private async getBlockNumber(timestamp: number, networkType: NetworkType): Promise<string> {
    const params = {
      module: 'block',
      action: 'getblocknobytime',
      timestamp,
      closest: 'after',
      apiKey: config.explorerApikey[networkType],
    };
    const query = qs.stringify(params);

    const res = await request.client.get(`${ExplorerService.API_URL[networkType]}?${query}`);
    const data = res.data as ExplorerBlockNumber;

    return data.result;
  }

  private async getTxListFromExplorer(
    timestamp: number,
    address: string,
    networkType: NetworkType,
  ): Promise<TxInfo[]> {
    const startBlock = await this.getBlockNumber(timestamp, networkType);

    const params = {
      module: 'account',
      action: 'tokentx',
      contractAddress: config.cotAddress[networkType],
      address,
      startBlock,
      sort: 'asc', // ascのみ取得
      apiKey: config.explorerApikey[networkType],
    };
    const query = qs.stringify(params);

    const res = await request.client.get(`${ExplorerService.API_URL[networkType]}?${query}`);
    const data = res.data as ExplorerTxList;

    return data.result.map((res) => ({ ...res, networkType }));
  }

  private timeStampDescSort = (a: TxInfo, b: TxInfo): number => {
    const timeStampA = a.timeStamp;
    const timeStampB = b.timeStamp;

    if (timeStampA < timeStampB) {
      return 1;
    }
    if (timeStampA > timeStampB) {
      return -1;
    }

    return 0;
  };

  private getCacheName(fromDay: number, address: string) {
    return `tx-list-${fromDay}-${address}`;
  }
}
