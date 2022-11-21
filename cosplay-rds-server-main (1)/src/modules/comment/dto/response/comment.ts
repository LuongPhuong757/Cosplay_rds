import { SuperchatResponse } from '@modules/superchat/dto/response/superchat';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'コメント情報の返却スキーマ' })
export class CommentResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => Int, { description: 'コメントに紐付く投稿画像・動画のID' })
  postId: number;

  @Field((type) => String, { nullable: true, description: 'コメント内容' })
  comment: string | null;

  @Field((type) => UserResponse, { description: 'コメントに紐付くユーザ' })
  user: UserResponse;

  @Field((type) => [CommentResponse], { description: 'コメントへの返信' })
  replies: CommentResponse[];

  @Field((type) => Int, { nullable: true, description: 'コメントへの返信ID' })
  replyId: number | null;

  @Field((type) => SuperchatResponse, {
    nullable: true,
    description: 'コメントに紐付くスーパチャット',
  })
  superChat: SuperchatResponse;

  @Field((type) => Date, { description: '登録日' })
  created: Date;

  @Field((type) => Int, { description: 'コメントへのリプライの総数' })
  totalReplies: number;
}
