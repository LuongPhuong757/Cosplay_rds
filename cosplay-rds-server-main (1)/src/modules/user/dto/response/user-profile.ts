import { UserProfileRankingResponse } from '@modules/ranking/dto/response/user-profile-ranking';
import { Field, ObjectType, Int, Root } from 'type-graphql';
import { User } from '../../user.model';
import { IUserResponse } from './i-user';
import { SnsResponse } from './sns';
import { SupporterResponse } from './supporter';

@ObjectType({ implements: IUserResponse, description: 'ユーザのプロフィール情報の返却スキーマ' })
export class UserProfileResponse extends IUserResponse {
  @Field((type) => String, { nullable: true, description: 'プロフィール文章' })
  profile: string | null;

  @Field((type) => String, { nullable: true, description: 'ウェブサイト' })
  website: string | null;

  @Field((type) => SnsResponse, { nullable: true, description: 'SNS情報' })
  sns(@Root() user: User): SnsResponse {
    const snsInfo = user.snsInfo as { [key: string]: string };
    const info = {
      facebook: null,
      twitter: null,
      instagram: null,
    };
    if (!snsInfo) return info;

    return {
      ...info,
      ...snsInfo,
    };
  }

  @Field((type) => Boolean, {
    nullable: true,
    description: 'ユーザが、メンバーシップを開設しているかどうか',
  })
  hasMembership(@Root() user: User & { membershipId?: number }): boolean {
    const { membership, membershipId } = user;
    if (membershipId) return true;

    return !!membership;
  }

  @Field((type) => Boolean, {
    nullable: true,
    description: 'ユーザのメンバーシップ会員かどうか',
  })
  isMembership(@Root() user: User & { currentUserIsMembership?: boolean }): boolean {
    const { currentUserIsMembership } = user;

    return !!currentUserIsMembership;
  }

  @Field((type) => Int, { description: '投稿の総数' })
  totalPosts: number;

  @Field((type) => Int, { description: 'フォローしているユーザの総数' })
  totalFollows: number;

  @Field((type) => Int, { description: 'フォローされているユーザの総数' })
  totalFollowers: number;

  @Field((type) => Int, { description: '自分が登録しているメンバーシップユーザの総数' })
  totalMemberships: number;

  @Field((type) => Int, { description: '自分のメンバーシップに登録しているユーザの総数' })
  totalMembershippedBy: number;

  @Field((type) => UserProfileRankingResponse, { description: 'ランキング情報' })
  ranking: UserProfileRankingResponse;

  @Field((type) => [SupporterResponse], { description: 'サポーター一覧' })
  supporters: SupporterResponse[];

  @Field((type) => Boolean, { description: '対象ユーザをブロックしているかどうか' })
  isBlocking: boolean;

  @Field((type) => String, { nullable: true, description: 'ユーザのpublicAddress' })
  publicAddress?: string | null;
}
