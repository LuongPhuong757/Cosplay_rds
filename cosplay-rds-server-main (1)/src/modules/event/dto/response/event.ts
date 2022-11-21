import { TagResponse } from '@modules/tag/dto/response/tag';
import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType({ description: 'イベント情報の返却スキーマ' })
export class EventResponse {
  @Field((type) => TagResponse, { description: '投稿画像・動画に紐付くタグ' })
  tag: TagResponse;

  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: 'イベントのタグに使うタイトル名' })
  name: string;

  @Field((type) => String, { nullable: true, description: 'イベントのタイトル名' })
  title?: string | null;

  @Field((type) => String, { nullable: true, description: '応募方法' })
  applicationMethod?: string | null;

  @Field((type) => String, { nullable: true, description: 'イベント詳細' })
  eventDetail?: string | null;

  @Field((type) => String, { nullable: true, description: '注意事項' })
  note?: string | null;

  @Field((type) => String, { description: 'イベントの説明' })
  description: string;

  @Field((type) => String, { description: 'バナーに載せるイメージ画像のURL' })
  image: string;

  @Field((type) => String, { description: 'イベント画像をクリックした際に遷移するリンク先' })
  link: string;

  @Field((type) => Boolean, { description: 'ランキングイベントかどうかのフラグ' })
  isContest: boolean;

  @Field((type) => Date, { description: 'イベントの開始日' })
  startDate: Date;

  @Field((type) => Date, { description: 'イベントの終了日' })
  endDate: Date;
}
