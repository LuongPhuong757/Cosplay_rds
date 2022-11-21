import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'PublicAddressを持っているUserPrivateの返却スキーマ' })
export class UserWithPublicAddressResponse {
  @Field((type) => String, { description: 'userPrivateのId' })
  id: number;

  @Field((type) => String, { description: 'public address' })
  publicAddress: string;
}
