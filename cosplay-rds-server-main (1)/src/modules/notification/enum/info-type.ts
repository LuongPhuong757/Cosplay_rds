import { registerEnumType } from 'type-graphql';

export enum InfoType {
  FAV = 'FAV',
  TAG = 'TAG', // 投稿にタグ付け
  TAG_FAV = 'TAG_FAV', // タグ付けされた投稿へのいいね // FAV_TO_TAGGED_POST
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  SUPERCHAT = 'SUPERCHAT', // スーパチャットは必ず通知する
  MEMBERSHIP_NEW_POST = 'MEMBERSHIP_NEW_POST', // 加入しているメンバーシップの新しい投稿の通知
  MEMBERSHIP = 'MEMBERSHIP',
  MENTION = 'MENTION', // コメントへのリプライ
  ANNOUNCEMENT = 'ANNOUNCEMENT', // 運営からのお知らせ
}

registerEnumType(InfoType, {
  name: 'InfoType',
  description: 'The type of info',
});
