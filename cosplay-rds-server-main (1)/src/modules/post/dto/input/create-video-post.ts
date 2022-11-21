import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsEnum,
  MaxLength,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';
import { CommentAble } from '../../enum/comment-able';
import { DisclosureRange } from '../../enum/disclosure-range';

@InputType({ description: 'multipart情報' })
export class Multipart {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'ETag' })
  ETag: string;

  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'Multipartの順番' })
  PartNumber: number;
}

@InputType({ description: '投稿動画を作成する' })
export class CreateVideoPostInput {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'アップロードした動画ファイル名' })
  uploadedFilename: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'S3にアップロードした動画の識別用ID' })
  uploadId: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsArray()
  @Field((type) => [Multipart], { description: 'etagとpart番号' })
  multiparts: Multipart[];

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Field((type) => String, { description: 'キャプション', nullable: true })
  caption?: string;

  @IsNotEmpty()
  @IsArray()
  @Field((type) => [Int], { description: 'タグ付けするユーザID一覧' })
  tagUserIds: number[];

  @IsNotEmpty()
  @IsArray()
  @Field((type) => [Int], { description: 'タグ付けするイベントID一覧' })
  tagEventIds: number[];

  @IsNotEmpty()
  @IsEnum(DisclosureRange)
  @Field((type) => DisclosureRange, { description: '投稿範囲' })
  disclosureRange: DisclosureRange;

  @IsNotEmpty()
  @IsEnum(CommentAble)
  @Field((type) => CommentAble, { description: 'コメントを許可' })
  commentAble: CommentAble;

  @IsNotEmpty()
  @IsBoolean()
  @Field((type) => Boolean, { description: 'SNSで同時投稿するかどうか' })
  isSNSPost: boolean;
}

@InputType({ description: '投稿動画を作成する' })
export class UpdateVideoPostInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'ID' })
  postId: number;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'アップロードした動画ファイル名' })
  uploadedFilename: string;

  @IsOptional()
  @IsString()
  @Field((type) => String, { description: 'S3にアップロードした動画の識別用ID' })
  uploadId?: string;

  @IsOptional()
  @IsArray()
  @Field((type) => [Multipart], { description: 'etagとpart番号' })
  multiparts?: Multipart[];

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Field((type) => String, { description: 'キャプション' })
  caption?: string;

  @IsNotEmpty()
  @IsArray()
  @Field((type) => [Int], { description: 'タグ付けするユーザID一覧' })
  tagUserIds: number[];

  @IsNotEmpty()
  @IsArray()
  @Field((type) => [Int], { description: 'タグ付けするイベントID一覧' })
  tagEventIds: number[];

  @IsNotEmpty()
  @IsEnum(DisclosureRange)
  @Field((type) => DisclosureRange, { description: '投稿範囲' })
  disclosureRange: DisclosureRange;

  @IsNotEmpty()
  @IsEnum(CommentAble)
  @Field((type) => CommentAble, { description: 'コメントを許可' })
  commentAble: CommentAble;
}
