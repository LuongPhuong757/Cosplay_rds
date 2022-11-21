import { IsInt, IsNotEmpty } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: '投稿画像・動画のいいねを削除する' })
export class RemoveFavInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '投稿画像・動画のID' })
  postId: number;
}
