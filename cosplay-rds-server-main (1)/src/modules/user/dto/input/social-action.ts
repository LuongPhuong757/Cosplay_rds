import { IsNotEmpty, IsInt } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'フォロー、ブロックの更新系処理を行う。' })
export class SocialActionInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'ユーザID' })
  userId: number;
}
