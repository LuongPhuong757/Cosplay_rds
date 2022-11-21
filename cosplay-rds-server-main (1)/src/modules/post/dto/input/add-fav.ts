import { IsInt, IsNotEmpty } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: '投稿画像・動画にいいねを行う' })
export class AddFavInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '投稿画像・動画のID' })
  postId: number;
}
