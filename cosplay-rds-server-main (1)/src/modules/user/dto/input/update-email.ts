import { IsString, IsNotEmpty, MaxLength, IsEmail } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'メールアドレスを更新する。' })
export class UpdateEmailInput {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(64)
  @Field((type) => String, { description: 'メールアドレス' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Field((type) => String, { description: 'ユーザの言語情報 ISO 639-1 Code ex: ja, en' })
  lang: string;
}
