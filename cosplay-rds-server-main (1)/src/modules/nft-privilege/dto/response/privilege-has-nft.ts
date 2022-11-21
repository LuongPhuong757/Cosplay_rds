import { NftResponse } from '@modules/nft/dto/response/nft.response';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'NFTの情報の返却スキーマ' })
export class PrivilegeHasNFTResponse {
  @Field((type) => NftResponse, { description: 'NFTの特典に紐づく特典' })
  nft: NftResponse;

  @Field((type) => Int, { description: '特典の各NFTの必要数' })
  required: number;
}
