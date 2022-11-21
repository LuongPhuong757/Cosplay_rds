import { IsNotEmpty, IsInt } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'アカウントを指定しリンクをさせる。' })
export class LinkAccountInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'ユーザID' })
  userId: number;
}
