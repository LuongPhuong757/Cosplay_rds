import { NftResponse } from '@modules/nft/dto/response/nft.response';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'NFTをいくつ持っているかを示す情報の返却スキーマ' })
export class UserHasNftResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => NftResponse, { description: 'NFT情報' })
  nft: NftResponse;

  @Field((type) => Int, { description: '保有量' })
  amount: number;

  @Field((type) => Int, { description: '出庫済みの個数' })
  shipped: number;
}
