import { Field, ObjectType } from 'type-graphql';
import { TokenInfoResponse } from './token-info';

@ObjectType({ description: 'トークンの価格情報などの返却スキーマ' })
export class TokenInfoListResponse {
  @Field((type) => TokenInfoResponse, { description: 'ETH の価格情報など' })
  eth: TokenInfoResponse;

  @Field((type) => TokenInfoResponse, { description: 'COT の価格情報など' })
  cot: TokenInfoResponse;

  @Field((type) => TokenInfoResponse, { description: 'MATIC の価格情報など' })
  matic: TokenInfoResponse;

  @Field((type) => TokenInfoResponse, { description: 'USDC の価格情報など' })
  usdc: TokenInfoResponse;

  @Field((type) => TokenInfoResponse, { description: 'LP-COT(COT-USDC) の価格情報など' })
  lpCot: TokenInfoResponse;
}
