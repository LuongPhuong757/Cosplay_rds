import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMaxSize,
  ArrayNotEmpty,
  IsEnum,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';
import { CommentAble } from '../../enum/comment-able';
import { DisclosureRange } from '../../enum/disclosure-range';

@InputType({ description: '投稿画像を作成する' })
export class CreatePostInput {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsArray()
  @Field((type) => [String], { description: 'アップロードする画像ファイル名' })
  uploadedFilenames: string[];

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
