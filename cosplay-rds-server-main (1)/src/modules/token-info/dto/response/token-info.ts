import { Field, ObjectType, Float } from 'type-graphql';

@ObjectType({ description: 'トークンの価格情報などの返却スキーマ' })
export class TokenInfoResponse {
  @Field((type) => Float, { description: 'トークンのJPY価格' })
  jpy: number;

  @Field((type) => Float, { nullable: true, description: 'トークンの24時間変動率' })
  change24h: number;
}
