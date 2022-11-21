import { CommentResponse } from '@modules/comment/dto/response/comment';
import { HashTagResponse } from '@modules/hash-tag/dto/response/hash-tag';
import { PhotoResponse } from '@modules/photo/dto/response/photo';
import { SuperchatResponse } from '@modules/superchat/dto/response/superchat';
import { TagResponse } from '@modules/tag/dto/response/tag';
import { FollowUserResponse } from '@modules/user/dto/response/follow-user';
import { Field, ObjectType, Int } from 'type-graphql';
import { CommentAble } from '../../enum/comment-able';
import { DisclosureRange } from '../../enum/disclosure-range';

@ObjectType({ description: '投稿画像・動画情報の返却スキーマ' })
export class PostResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => FollowUserResponse, { description: '投稿画像・動画に紐付くユーザ' })
  user: FollowUserResponse;

  @Field((type) => String, { nullable: true, description: 'キャプション' })
  caption: string | null;

  @Field((type) => DisclosureRange, { description: '投稿画像・動画の公開範囲' })
  disclosureRange: DisclosureRange;

  @Field((type) => CommentAble, { description: '投稿画像・動画のコメント投稿フラグ' })
  commentAble: CommentAble;

  @Field((type) => [HashTagResponse], { description: '投稿画像・動画に紐付くハッシュタグ' })
  hashtags: HashTagResponse[];

  @Field((type) => [TagResponse], { description: '投稿画像・動画に紐付くタグ' })
  tags: TagResponse[];

  @Field((type) => [PhotoResponse], { description: '投稿画像・動画に紐付く画像' })
  photos: PhotoResponse[];

  @Field((type) => [CommentResponse], { description: '投稿画像・動画に紐付くコメント' })
  comments: CommentResponse[];

  @Field((type) => [SuperchatResponse], { description: '投稿画像・動画に紐付くスーパーチャット' })
  superchats: SuperchatResponse[];

  @Field((type) => Date, { description: '登録日' })
  created: Date;

  @Field((type) => Date, { description: '更新日' })
  updated: Date;

  @Field((type) => Int, { description: 'いいねの合計数' })
  totalFavs: number;

  @Field((type) => Int, { description: 'スーパーチャットの合計金額' })
  totalSuperchats: number;

  @Field((type) => Int, { description: 'コメントの合計数' })
  totalComments: number;

  @Field((type) => Boolean, { nullable: true, description: 'いいねをしているかどうかのフラグ' })
  isFav: boolean;
}
