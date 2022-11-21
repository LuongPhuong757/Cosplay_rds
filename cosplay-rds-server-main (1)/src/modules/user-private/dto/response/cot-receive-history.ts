import { NetworkType } from '@modules/user-private/enum/network-type';
import { TransactionType } from '@modules/user-private/enum/transaction-type';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'COTの投げ銭の履歴情報の返却スキーマ' })
export class CotReceiveHistoryResponse {
  @Field((type) => String, { description: '受け取ったCOTの量' })
  value: string;

  @Field((type) => String, { description: 'COTを受け取ったunixtimestamp' })
  timeStamp: string;

  @Field((type) => NetworkType, { description: 'ネットワーク種別' })
  networkType: NetworkType;

  @Field((type) => TransactionType, { description: 'Transaction種別' })
  transactionType?: TransactionType;

  @Field((type) => UserResponse, { description: 'ユーザ情報', nullable: true })
  user: UserResponse | null;
}
