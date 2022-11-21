import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'ユーザのプロフィールのランキング情報の返却スキーマ' })
export class UserProfileRankingResponse {
  @Field((type) => Int, { description: '週間ランキング' })
  weekly: number;

  @Field((type) => Int, { description: '総合ランキング' })
  all: number;

  @Field((type) => Int, { description: '過去最高ランキング' })
  best: number;
}
