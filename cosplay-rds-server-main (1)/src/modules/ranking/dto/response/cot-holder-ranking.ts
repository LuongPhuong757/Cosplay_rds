import { UserProfileRankingResponse } from '@modules/ranking/dto/response/user-profile-ranking';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int, Float } from 'type-graphql';

@ObjectType({ description: 'COTホルダーランキング情報の返却スキーマ' })
export class CotHolderRankingResponse {
  @Field((type) => UserResponse, { description: 'ユーザ' })
  user: UserResponse;

  @Field((type) => Int, { description: 'ランキング順位' })
  rank: number;

  @Field(() => UserProfileRankingResponse, { description: 'ユーザー プロファイルの評価情報' })
  profileRanking: { [key: string]: number | null };

  @Field((type) => Int, { description: '投稿の総数' })
  totalPosts: number;

  @Field((type) => Int, { description: 'フォローしているユーザの総数' })
  totalFollows: number;

  @Field((type) => Int, { description: 'フォローされているユーザの総数' })
  totalFollowers: number;

  @Field((type) => String, { description: 'フォローされているユーザの総数' })
  publicAddress: string | null;

  @Field((type) => Float, { description: 'COTの総数' })
  totalCot: number;
}
