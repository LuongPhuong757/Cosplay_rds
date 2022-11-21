import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';
import { InfoType } from '../../enum/info-type';

@ObjectType({ description: '通知情報の返却スキーマ' })
export class NotificationResponse {
  @Field((type) => Int, { description: 'アクションを受け取ったユーザのID' })
  receivedId: number;

  @Field((type) => UserResponse, { description: 'アクションを行ったユーザ情報' })
  sender: UserResponse;

  @Field((type) => InfoType, { description: '通知のメッセージ情報種別' })
  infoType: InfoType;

  @Field((type) => String, {
    nullable: true,
    description: 'アクションを行った先の投稿画像・動画のID',
  })
  postId: string;

  @Field((type) => Date, { description: '登録日' })
  created: Date;

  @Field((type) => Boolean, { description: '既読フラグ' })
  unread: boolean;
}
