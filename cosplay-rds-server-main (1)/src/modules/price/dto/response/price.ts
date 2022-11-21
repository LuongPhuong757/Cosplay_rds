import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '価格情報の返却スキーマ' })
export class PriceResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => Int, { description: '決済通貨での価格' })
  amount: number;

  @Field((type) => String, {
    description:
      '決済通貨。国際規格に準拠 + 小文字します。参照: https://github.com/stripe/stripe-go/blob/master/currency.go',
  })
  currency: string;

  @Field((type) => Int, { description: '日本円建て' })
  jpy: number;
}
