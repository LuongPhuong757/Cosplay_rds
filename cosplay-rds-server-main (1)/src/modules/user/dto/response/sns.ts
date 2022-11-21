import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'SNS情報の返却スキーマ' })
export class SnsResponse {
  @Field((type) => String, { nullable: true, description: 'Facebookのアカウント名' })
  facebook: string | null;

  @Field((type) => String, { nullable: true, description: 'Twitterのアカウント名' })
  twitter: string | null;

  @Field((type) => String, { nullable: true, description: 'Instagramのアカウント名' })
  instagram: string | null;
}
