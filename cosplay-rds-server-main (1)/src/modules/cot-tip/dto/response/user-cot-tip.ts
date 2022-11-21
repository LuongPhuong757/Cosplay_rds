import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'COT投げ銭に対するNFT返礼情報の返却スキーマ' })
export class UserCOTTipResponse {
  @Field((type) => Boolean, {
    description: 'COT投げ銭に対するNFT返礼に対応しているかどうか',
    nullable: true,
  })
  enabled?: boolean;

  @Field((type) => String, {
    description: 'COT投げ銭に対するNFT返礼に必要なCOTの量',
    nullable: true,
  })
  lowerCOT?: string;
}
