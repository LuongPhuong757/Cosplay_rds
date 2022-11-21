import { IsNotEmpty, IsInt, IsNumber } from 'class-validator';
import { InputType, Field, Int, Float } from 'type-graphql';

@InputType({ description: 'ユーザのpublic addressに紐付くTotalCotを更新する。' })
export class UpdateUserTotalCotInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'userPrivateのid' })
  id: number;

  @IsNotEmpty()
  @IsNumber()
  @Field((type) => Float, { description: 'public addressに紐づくcotの総数' })
  totalCot: number;
}
