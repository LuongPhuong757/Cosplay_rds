import { ACCOUNT_REG_EXP } from '@configs/constant';
import { IsString, IsOptional, IsDate, IsEnum, MaxLength, Matches, IsUrl } from 'class-validator';
import { InputType, Field } from 'type-graphql';
import { Gender } from '../../../user-private/enum/gender';

@InputType({ description: 'プロフィールを更新する。' })
export class UpdateProfileInput {
  @IsOptional()
  @IsString()
  @Field((type) => String, { nullable: true, description: 'アイコン' })
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Field((type) => String, { nullable: true, description: '名前' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(ACCOUNT_REG_EXP)
  @MaxLength(64)
  @Field((type) => String, { nullable: true, description: 'アカウント名' })
  account?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Field((type) => String, { nullable: true, description: 'プロフィール文章' })
  profile?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(256)
  @Field((type) => String, { nullable: true, description: 'ウェブサイト用URL' })
  website?: string;

  @IsOptional()
  @IsDate()
  @Field((type) => Date, { nullable: true, description: '誕生日' })
  birthday?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Field((type) => String, { nullable: true, description: '電話' })
  phone?: string;

  @IsOptional()
  @IsEnum(Gender)
  @Field((type) => Gender, { nullable: true, description: '性別' })
  gender?: Gender;

  @IsOptional()
  @Field((type) => String, { nullable: true, description: 'Facebook' })
  facebook?: string;

  @IsOptional()
  @Field((type) => String, { nullable: true, description: 'Twitter' })
  twitter?: string;

  @IsOptional()
  @Field((type) => String, { nullable: true, description: 'Instagram' })
  instagram?: string;
}
