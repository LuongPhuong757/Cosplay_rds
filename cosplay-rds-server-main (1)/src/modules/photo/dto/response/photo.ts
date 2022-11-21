import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '投稿画像・動画のイメージ画像情報の返却スキーマ' })
export class PhotoResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: '投稿画像・動画のイメージ画像のURL' })
  image: string;
}
