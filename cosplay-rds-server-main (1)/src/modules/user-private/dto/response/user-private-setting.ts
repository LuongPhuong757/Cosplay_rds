import defaultPrivateSetting from '@configs/default-private-setting';
import { UserPrivateSetting } from '@modules//user-private/user-private-setting.model';
import { Field, ObjectType } from 'type-graphql';
import { SettingValue } from '../../enum/setting-value';

@ObjectType({ description: '自分の設定情報の返却スキーマ' })
export class UserPrivateSettingResponse {
  @Field((type) => SettingValue, { description: 'いいねの通知' })
  get fav(): SettingValue {
    return this.setting?.fav ?? defaultPrivateSetting.fav;
  }

  @Field((type) => SettingValue, { description: '投稿にタグ付けの通知' })
  get tag(): SettingValue {
    return this.setting?.tag ?? defaultPrivateSetting.tag;
  }

  @Field((type) => SettingValue, { description: 'タグ付けされた投稿へのいいねの通知' })
  get tagFav(): SettingValue {
    return this.setting?.tagFav ?? defaultPrivateSetting.tagFav;
  }

  @Field((type) => Boolean, {
    description: 'コメントの通知',
  })
  get comment(): boolean {
    return this.setting?.comment ?? defaultPrivateSetting.comment;
  }

  @Field((type) => Boolean, {
    description: '新しくフォローされた際の通知',
  })
  get follow(): boolean {
    return this.setting?.follow ?? defaultPrivateSetting.follow;
  }

  @Field((type) => Boolean, {
    description: '加入しているメンバーシップの新しい投稿の通知',
  })
  get membershipNewPost(): boolean {
    return this.setting?.membershipNewPost ?? defaultPrivateSetting.membershipNewPost;
  }

  @Field((type) => Boolean, {
    description: '新しいメンバーシップの通知',
  })
  get membership(): boolean {
    return this.setting?.membership ?? defaultPrivateSetting.membership;
  }

  @Field((type) => Boolean, {
    description: 'メンションの通知',
  })
  get mention(): boolean {
    return this.setting?.mention ?? defaultPrivateSetting.mention;
  }

  @Field((type) => Boolean, {
    description: '運営からのお知らせの通知',
  })
  get announcement(): boolean {
    return this.setting?.announcement ?? defaultPrivateSetting.announcement;
  }

  @Field((type) => SettingValue, { description: 'タグ付けのプライバシー設定' })
  get allowTags(): SettingValue {
    return this.setting?.allowTags ?? defaultPrivateSetting.allowTags;
  }

  setting: UserPrivateSetting;
}
