import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: '返信コメントを行う' })
export class ReplyCommentInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '返信コメントを行う投稿画像・動画のID' })
  postId: number;

  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '返信を行うコメントのID' })
  commentId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: '返信コメントの内容' })
  comment: string;
}
