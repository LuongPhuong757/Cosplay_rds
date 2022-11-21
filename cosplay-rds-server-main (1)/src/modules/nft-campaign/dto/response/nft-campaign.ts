import { NftResponse } from '@modules/nft/dto/response/nft.response';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'NFTキャンペーン情報の返却スキーマ' })
export class NftCampaignResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: 'キャンペーンのタイトル' })
  title: string;

  @Field((type) => String, { description: 'キャンペーンの説明' })
  description: string;

  @Field((type) => UserResponse, { description: 'キャンペーンのNFTの発行者情報', nullable: true })
  user: UserResponse | null;

  @Field((type) => Date, { description: 'キャンペーンの開始日時' })
  start: Date;

  @Field((type) => Date, { description: 'キャンペーンの終了日時' })
  end: Date;

  @Field((type) => [NftResponse], { description: 'キャンペーンに紐づくNFT' })
  nfts: NftResponse[];
}
