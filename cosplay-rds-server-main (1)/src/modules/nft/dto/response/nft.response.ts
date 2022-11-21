import { NFT } from '@modules/nft/nft.model';
import { UserResponse } from '@modules/user/dto/response/user';
import { User } from '@modules/user/user.model';
import { Field, ObjectType, Int, Root } from 'type-graphql';

@ObjectType({ description: 'NFTをいくつ持っているかを示す情報の返却スキーマ' })
export class NftResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => Int, { description: 'NFTのID' })
  tokenID: number;

  @Field((type) => String, { description: 'NFTのアドレス', nullable: true })
  address: string | null;

  @Field((type) => Int, { description: 'NFTの供給量' })
  totalSupply: number;

  @Field((type) => String, { description: 'NFTの名前' })
  name: string;

  @Field((type) => String, { description: 'NFTの画像URL' })
  image: string;

  @Field((type) => String, { description: 'NFTの説明' })
  description: string;

  @Field((type) => Int, { description: 'NFTのレアリティ' })
  rarity: number;

  @Field((type) => UserResponse, {
    nullable: true,
    description: 'NFTの発行元のユーザを表す',
  })
  issuer(@Root() nft: NFT): User | null {
    return nft.campaign?.user ?? null;
  }
}
