import { NetworkType } from '@modules/user-private/enum/network-type';
import { TransactionType } from '@modules/user-private/enum/transaction-type';

export type TxResult = {
  blockNumber: string;
  value: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

export type TxInfo = TxResult & { networkType: NetworkType };

export type TxListInfo = TxInfo & { transactionType: TransactionType };

export type ExplorerTxList = {
  status: string;
  message: string;
  result: TxResult[];
};

export type ExplorerBlockNumber = {
  status: string;
  message: string;
  result: string;
};
