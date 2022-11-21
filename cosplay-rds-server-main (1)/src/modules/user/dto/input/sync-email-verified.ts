import { IsString, IsNotEmpty } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'Auth0の認証済みメールアドレスをRdsサーバに連携させる。' })
export class SyncEmailVerifiedInput {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'auth0サーバで登録されているuser_id' })
  auth0Id: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'auth0サーバで登録されているメールアドレス' })
  email: string;
}
