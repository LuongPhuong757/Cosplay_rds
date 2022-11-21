import { Field, ObjectType } from 'type-graphql';
import { INFTPriviledgeResponse } from './i-nft-privilege';

@ObjectType({ description: 'NFTの特典情報の返却スキーマ' })
export class NFTPrivilegeResponse extends INFTPriviledgeResponse {
  @Field((type) => Boolean, { description: '特典の行使可能かどうか', nullable: true })
  isExecutable?: boolean;
}
