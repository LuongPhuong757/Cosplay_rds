import { Field, ObjectType, Float } from 'type-graphql';

@ObjectType({ description: '月ごとのScore情報の返却スキーマ' })
export class MonthlyScoreResponse {
  @Field((type) => String, { description: '月を表す' })
  month: string;

  @Field((type) => Float, { description: '月ごとのScore' })
  score: number;
}
