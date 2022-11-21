import { PriceResponse } from '@modules/price/dto/response/price';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'スーパーチャット情報の返却スキーマ' })
export class SuperchatResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => UserResponse, { description: 'スーパーチャットに紐付くユーザ' })
  user: UserResponse;

  @Field((type) => PriceResponse, { description: 'スーパーチャットに紐付く価格' })
  price: PriceResponse;
}
