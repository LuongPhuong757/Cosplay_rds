import { IsNotEmpty, IsInt } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'コメントを削除する' })
export class DeleteCommentInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'コメントID' })
  commentId: number;
}
