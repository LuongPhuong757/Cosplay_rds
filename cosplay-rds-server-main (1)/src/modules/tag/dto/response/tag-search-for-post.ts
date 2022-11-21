import { EventResponse } from '@modules/event/dto/response/event';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType } from 'type-graphql';

@ObjectType({ description: '画像・動画投稿画面でのタグの検索情報の返却スキーマ' })
export class TagSearchForPostResponse {
  @Field((type) => [UserResponse], { description: '検索したユーザ一覧' })
  users: UserResponse[];

  @Field((type) => [EventResponse], { description: '検索したイベント一覧' })
  events: EventResponse[];
}
