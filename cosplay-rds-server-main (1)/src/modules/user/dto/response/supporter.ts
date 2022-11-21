import { ObjectType, Field, Int } from 'type-graphql';
import { IUserResponse } from './i-user';

@ObjectType({ implements: IUserResponse, description: 'サポータ情報の返却スキーマ' })
export class SupporterResponse extends IUserResponse {
  @Field((type) => Int, { description: 'あるユーザに対しての累計スコア' })
  totalScore: number;
}
