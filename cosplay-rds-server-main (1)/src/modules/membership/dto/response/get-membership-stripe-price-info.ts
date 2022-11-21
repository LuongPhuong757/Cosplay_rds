import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'StripePriceIdとPrice情報の返却スキーマ。' })
export class GetStripePriceInfoResponse {
  @Field((type) => String, { description: 'メンバーシップのStripePriceId' })
  stripePriceId: string;

  @Field((type) => Int, { description: 'メンバーシップの料金' })
  amount: number;

  @Field((type) => String, { description: 'メンバーシップの料金の通貨' })
  currency: string;
}
