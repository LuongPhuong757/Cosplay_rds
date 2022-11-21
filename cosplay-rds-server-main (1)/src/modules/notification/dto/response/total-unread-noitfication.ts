import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '未読の通知の総数の返却スキーマ' })
export class TotalUnreadNotificationResponse {
  @Field((type) => Int, { description: '総数' })
  totalUnread: number;
}
