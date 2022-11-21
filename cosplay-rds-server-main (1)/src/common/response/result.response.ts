import { ObjectType, Field } from 'type-graphql';
import { Result } from './result.enum';

@ObjectType({ description: '結果を返す情報の返却スキーマ。' })
export class ResultResponse {
  @Field((type) => Result, { description: '結果の可否' })
  result: Result;

  @Field((type) => String, { nullable: true, description: '詳細メッセージ' })
  message?: string;
}
