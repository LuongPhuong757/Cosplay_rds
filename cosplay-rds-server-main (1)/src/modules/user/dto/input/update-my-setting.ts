import { UserPrivateSetting } from '@modules//user-private/user-private-setting.model';
import { IsBoolean, IsEnum } from 'class-validator';
import { InputType, Field } from 'type-graphql';
import { SettingValue } from '../../../user-private/enum/setting-value';

@InputType({ description: '自分の設定情報を更新する。' })
export class UpdateMySettingInput implements Partial<UserPrivateSetting> {
  @IsEnum(SettingValue)
  @Field((type) => SettingValue, { description: 'いいねの通知', nullable: true })
  fav?: SettingValue;

  @IsEnum(SettingValue)
  @Field((type) => SettingValue, { description: '投稿にタグ付けの通知', nullable: true })
  tag?: SettingValue;

  @IsEnum(SettingValue)
  @Field((type) => SettingValue, {
    description: 'タグ付けされた投稿へのいいねの通知',
    nullable: true,
  })
  tagFav?: SettingValue;

  @IsBoolean()
  @Field((type) => Boolean, {
    description: 'コメントの通知',
    nullable: true,
  })
  comment?: boolean;

  @IsBoolean()
  @Field((type) => Boolean, {
    description: '新しくフォローされた際の通知',
    nullable: true,
  })
  follow?: boolean;

  @IsBoolean()
  @Field((type) => Boolean, {
    description: '新しいメンバーシップの通知',
    nullable: true,
  })
  membership?: boolean;

  @IsBoolean()
  @Field((type) => Boolean, {
    description: '新しい投稿へのメンバーシップの通知',
    nullable: true,
  })
  membershipNewPost?: boolean;

  @IsBoolean()
  @Field((type) => Boolean, {
    description: 'メンションの通知',
    nullable: true,
  })
  mention?: boolean;

  @IsBoolean()
  @Field((type) => Boolean, {
    description: '運営からのお知らせの通知',
    nullable: true,
  })
  announcement?: boolean;

  @IsEnum(SettingValue)
  @Field((type) => SettingValue, {
    description: 'タグ付けのプライバシー設定',
    nullable: true,
  })
  allowTags?: SettingValue;
}
