import { IsNotEmpty, IsInt } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: '投稿画像・動画を削除する' })
export class DeletePostInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '投稿画像・動画のID' })
  postId: number;
}
