import { EventResponse } from '@modules/event/dto/response/event';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'タグ情報の返却スキーマ' })
export class TagResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => UserResponse, { nullable: true, description: 'タグに紐付くユーザ' })
  user: UserResponse | null;

  @Field((type) => EventResponse, { nullable: true, description: 'タグに紐付くイベント' })
  event: EventResponse | null;

  @Field((type) => Int, { description: 'タグがついた画像・動画投稿の総数' })
  totalPosts: number;
}
