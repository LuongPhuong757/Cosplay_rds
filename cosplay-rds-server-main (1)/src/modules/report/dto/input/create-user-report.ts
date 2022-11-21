import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'ユーザを通報する' })
export class CreateUserReportInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '通報するユーザID' })
  userId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  @Field((type) => String, { description: '通報コメント' })
  comment: string;
}
