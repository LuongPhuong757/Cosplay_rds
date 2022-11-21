import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'S3への動画のアップロード用URLの返却スキーマ' })
export class MultiPart {
  @Field((type) => Int, {
    description: 'アップロード順。1だと最初のアップロード用URLに該当する。',
  })
  partNumber: number;

  @Field((type) => String, { description: 'S3の動画アップロード用URL' })
  signedUrl: string;
}

@ObjectType({ description: 'S3への動画のアップロード用URLの返却スキーマ' })
export class GetVideoSignedUrlResponse {
  @Field((type) => String, { description: 'S3へのアップロード用の識別用ID' })
  uploadId: string;

  @Field((type) => String, { description: 'ファイル名' })
  filename: string;

  @Field((type) => [MultiPart], { description: 'S3の動画アップロード用URLと順序' })
  multiparts: MultiPart[];
}
