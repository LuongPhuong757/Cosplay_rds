import { Field, ObjectType, Int, Float } from 'type-graphql';

@ObjectType({ description: '投稿ランキング情報の返却スキーマ' })
export class CotScoresResponse {
  @Field((type) => Int, { description: '今月の C-SCORE' })
  monthlyScore: number;

  @Field((type) => Float, { description: 'もらえる予想 JPY' })
  expectedJpy: number;

  @Field((type) => Int, { description: '累計の C-SCORE' })
  allScore: number;

  @Field((type) => Float, { description: 'もらった累計 LP-COT' })
  receivedCot: number;

  @Field((type) => Float, { description: '受け取りが繰り越されている LP-COT' })
  remainCot: number;
}
