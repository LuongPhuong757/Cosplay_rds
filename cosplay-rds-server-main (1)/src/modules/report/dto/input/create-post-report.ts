import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: '投稿画像・動画を通報する' })
export class CreatePostReportInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '通報する投稿画像・動画ID' })
  postId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Field((type) => String, { description: '通報コメント' })
  comment: string;
}
