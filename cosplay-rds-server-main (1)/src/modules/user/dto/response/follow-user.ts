import { ObjectType, Field, Root, Int } from 'type-graphql';
import { User } from '../../user.model';
import { IUserResponse } from './i-user';

@ObjectType({ implements: IUserResponse, description: 'フォローユーザ情報の返却スキーマ' })
export class FollowUserResponse extends IUserResponse {
  @Field((type) => Boolean, {
    nullable: true,
    description: '投稿画像・動画に紐付くユーザが、メンバーシップを開設しているかどうか',
  })
  hasMembership(@Root() user: User): boolean {
    const { membership } = user;

    return !!membership;
  }

  @Field((type) => Boolean, {
    nullable: true,
    description: '自分が投稿画像・動画に紐付くユーザのメンバーシップ会員かどうか',
  })
  isMembership(@Root() user: User & { currentUserIsMembership?: boolean }): boolean {
    const { currentUserIsMembership } = user;

    return !!currentUserIsMembership;
  }

  @Field((type) => Int, { nullable: true, description: '公開アドレス' })
  totalPost?: number;

  @Field((type) => Int, { nullable: true, description: '公開アドレス' })
  totalFollower?: number;

  @Field((type) => Int, { nullable: true, description: '公開アドレス' })
  totalFollowing?: number;

  @Field((type) => Int, { nullable: true, description: '公開アドレス' })
  weekly?: number;

  @Field((type) => Int, { nullable: true, description: '公開アドレス' })
  all?: number;

  @Field((type) => Int, { nullable: true, description: '公開アドレス' })
  best?: number;
}
