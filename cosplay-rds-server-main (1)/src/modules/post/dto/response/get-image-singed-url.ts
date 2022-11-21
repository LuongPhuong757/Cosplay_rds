import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: 'S3への画像のアップロード用URLの返却スキーマ' })
export class GetImageSignedUrlResponse {
  @Field((type) => String, { description: 'S3の画像アップロード用URL' })
  url: string;

  @Field((type) => String, { description: 'ファイル名' })
  filename: string;
}
