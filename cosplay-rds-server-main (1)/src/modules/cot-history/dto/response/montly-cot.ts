import { Field, ObjectType, Float } from 'type-graphql';

@ObjectType({ description: '月ごとのCOT情報の返却スキーマ' })
export class MonthlyCotResponse {
  @Field((type) => String, { description: '月を表す' })
  month: string;

  @Field((type) => Float, { description: '月ごとのCOT' })
  amount: number;
}
