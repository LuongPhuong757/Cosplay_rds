import { Result } from '@common/response/result.enum';
import { ObjectType, Field } from 'type-graphql';

@ObjectType({
  description: '旧WorldCosplayのユーザアカウント移行データ作成の結果返却スキーマ',
})
export class MigrateOldAccountResponse {
  @Field((type) => Result, { description: '結果の可否' })
  result: Result;

  @Field((type) => String, {
    nullable: true,
    description: '失敗した時のエラーメッセージを返却する',
  })
  message?: string | null;
}
