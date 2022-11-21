import { IsInt, IsOptional } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'データ取得用オプション' })
export class PagingOptionsInput {
  @IsInt()
  @IsOptional()
  @Field((type) => Int, { nullable: true, description: 'データ取得数' })
  limit?: number;

  @IsInt()
  @IsOptional()
  @Field((type) => Int, { nullable: true, description: 'データ取得開始位置' })
  offset?: number;
}
