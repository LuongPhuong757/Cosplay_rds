import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType({ description: 'バナー情報の返却スキーマ' })
export class BannerResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: 'バナーに載せるイメージ画像のURL' })
  image: string;

  @Field((type) => String, { description: 'バナー画像をクリックした際に遷移するリンク先' })
  link: string;
}
