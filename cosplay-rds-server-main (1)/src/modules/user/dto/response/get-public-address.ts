import { ObjectType, Field } from 'type-graphql';

@ObjectType({
  description: 'ユーザのPublicAddressの返却スキーマ',
})
export class GetPublicAddressResponse {
  @Field((type) => String, {
    nullable: true,
    description: 'PublicAddress',
  })
  publicAddress?: string | null;
}
