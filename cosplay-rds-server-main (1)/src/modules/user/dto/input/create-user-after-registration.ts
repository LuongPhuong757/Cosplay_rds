import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'Auth0のユーザをRdsサーバに連携させる。' })
export class CreateUserAfterRegistrationInput {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'auth0サーバで登録されているuser_id' })
  auth0Id: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'auth0サーバで登録されている名前' })
  name: string;

  @IsOptional()
  @IsString()
  @Field((type) => String, {
    nullable: true,
    description: 'auth0サーバで登録されているメールアドレス',
  })
  email?: string;
}
