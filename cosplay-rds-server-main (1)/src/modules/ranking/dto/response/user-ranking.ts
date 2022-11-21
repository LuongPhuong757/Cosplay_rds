import { UserProfileRankingResponse } from '@modules/ranking/dto/response/user-profile-ranking';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: 'ユーザランキング情報の返却スキーマ' })
export class UserRankingResponse {
  @Field((type) => UserResponse, { description: 'ユーザ' })
  user: UserResponse;

  @Field((type) => Int, { description: 'ランキング順位' })
  rank: number;

  @Field(() => UserProfileRankingResponse, { description: 'ユーザー プロファイルの評価情報' })
  profileRanking: { [key: string]: number | null };

  @Field((type) => Int, { description: 'ランキングスコア' })
  score: number;

  @Field((type) => Int, { description: 'フォローしているユーザの総数' })
  totalFollowing: number;

  @Field((type) => Int, { description: 'フォローしているユーザの総数' })
  totalPosts: number;

  @Field((type) => Int, { description: 'フォローされているユーザの総数' })
  totalFollowedBy: number;

  @Field((type) => Boolean, { description: '続く' })
  isFollowing: boolean;
}
