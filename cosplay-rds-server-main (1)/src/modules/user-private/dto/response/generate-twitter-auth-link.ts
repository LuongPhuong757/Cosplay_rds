import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'TwitterのOAuthLink情報の返却スキーマ' })
export class GenerateTwitterAuthLinkResponse {
  @Field((type) => String, { description: 'OAuthLinkのUrl情報' })
  url: string;
}
