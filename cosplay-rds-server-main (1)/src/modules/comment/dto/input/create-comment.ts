import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'コメントを作成する' })
export class CreateCommentInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'コメントが紐付く画像・動画投稿のID' })
  postId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'コメント内容' })
  comment: string;
}

@InputType({ description: 'コメントを作成する' })
export class EditCommentInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'コメントが紐付く画像・動画投稿のID' })
  commentId: number;

  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'コメントが紐付く画像・動画投稿のID' })
  postId: number;

  @IsInt()
  @Field((type) => Int, { nullable: true, description: '返信を行うコメントのID' })
  replyId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'コメント内容' })
  comment: string;
}
