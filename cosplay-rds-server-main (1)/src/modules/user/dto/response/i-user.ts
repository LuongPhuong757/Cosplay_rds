import { Field, InterfaceType, Int } from 'type-graphql';

@InterfaceType({ description: 'ユーザ情報のインターフェース' })
export abstract class IUserResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: 'アカウント名' })
  account: string;

  @Field((type) => String, { description: 'ユーザ名' })
  name: string;

  @Field((type) => String, { nullable: true, description: 'ユーザのアイコン' })
  icon?: string | null;

  @Field((type) => String, { nullable: true, description: 'ユーザー紹介' })
  profile?: string | null;

  @Field((type) => String, { nullable: true, description: '公開アドレス' })
  publicAddress?: string | null;

  @Field((type) => Boolean, { nullable: true, description: '公開アドレス' })
  isCosplayer?: boolean;
}
