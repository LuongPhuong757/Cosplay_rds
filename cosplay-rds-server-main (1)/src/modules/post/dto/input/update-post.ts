import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsArray,
} from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';
import { CommentAble } from '../../enum/comment-able';
import { DisclosureRange } from '../../enum/disclosure-range';

@InputType({ description: '投稿画像・動画の編集を行う' })
export class UpdatePostInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'ID' })
  postId: number;

  @IsString()
  @MaxLength(512)
  @Field((type) => String, { nullable: true, description: 'キャプション' })
  caption?: string;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsArray()
  @Field((type) => [String], { description: 'アップロードする画像ファイル名' })
  uploadedFilenames: string[];

  @IsNotEmpty()
  @IsArray()
  @Field((type) => [Int], { description: 'タグ付けするユーザID一覧' })
  tagUserIds: number[];

  @IsNotEmpty()
  @IsArray()
  @Field((type) => [Int], { description: 'タグ付けするイベントID一覧' })
  tagEventIds: number[];

  @IsOptional()
  @IsEnum(DisclosureRange)
  @Field((type) => DisclosureRange, { nullable: true, description: '投稿範囲' })
  disclosureRange?: DisclosureRange;

  @IsOptional()
  @IsEnum(CommentAble)
  @Field((type) => CommentAble, { nullable: true, description: 'コメントを許可' })
  commentAble?: CommentAble;
}
