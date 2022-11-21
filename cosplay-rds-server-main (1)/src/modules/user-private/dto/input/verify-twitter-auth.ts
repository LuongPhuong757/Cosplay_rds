import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'OAuthのcallback後にVerifyする。' })
export class VerifyTwitterAuthInput {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'state情報' })
  state: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'code情報' })
  code: string;
}
