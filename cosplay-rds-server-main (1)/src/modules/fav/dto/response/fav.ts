import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'お気に入り情報の返却スキーマ' })
export class FavResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => Int, { description: 'お気に入りしたユーザ' })
  userId: number;

  @Field((type) => Int, { description: 'お気に入りした投稿' })
  postId: number;
}
