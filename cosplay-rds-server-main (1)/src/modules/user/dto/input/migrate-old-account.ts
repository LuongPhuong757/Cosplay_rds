import { ACCOUNT_REG_EXP } from '@configs/constant';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
  IsEmail,
  IsDate,
} from 'class-validator';
import { InputType, Field } from 'type-graphql';
import { Gender } from '../../../user-private/enum/gender';

@InputType({ description: '旧WorldCosplayのユーザアカウントの移行データを作成します。' })
export class MigrateOldAccountInput {
  @IsNotEmpty()
  @IsString()
  @Matches(ACCOUNT_REG_EXP)
  @MaxLength(64)
  @Field((type) => String, { description: 'account名' })
  account: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  @Field((type) => String, { description: '名前' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(64)
  @Field((type) => String, { description: 'メールアドレス' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Field((type) => String, { nullable: true, description: 'プロフィール' })
  profile?: string;

  @IsOptional()
  @IsEnum(Gender)
  @Field((type) => Gender, { nullable: true, description: '性別' })
  gender?: Gender;

  @IsOptional()
  @IsDate()
  @Field((type) => Date, { nullable: true, description: '誕生日' })
  birthday?: Date;
}
