import { IsString, IsNotEmpty } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'メール認証を行う。' })
export class VerifyEmailInput {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'トークン' })
  token: string;
}
