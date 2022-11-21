import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'ハッシュタグ情報の返却スキーマ' })
export class HashTagResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: 'ハッシュタグ名' })
  name: string;

  @Field((type) => Int, { description: 'ハッシュタグに紐付いた投稿画像・動画数' })
  totalPosts: number;
}
