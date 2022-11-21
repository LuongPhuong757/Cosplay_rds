import { UserProfileRankingResponse } from '@modules/ranking/dto/response/user-profile-ranking';
import { Field, Int, ObjectType } from 'type-graphql';
import { IUserResponse } from './i-user';

@ObjectType({ implements: IUserResponse, description: 'ユーザ情報の返却スキーマ' })
export class UserResponseNewCosplayer extends IUserResponse {
  @Field(() => UserProfileRankingResponse, { description: 'ユーザー プロファイルの評価情報' })
  profileRanking: { [key: string]: number | null };

  @Field((type) => Int, { description: 'フォローしているユーザの総数' })
  totalFollowing: number;

  @Field((type) => Int, { description: 'フォローされているユーザの総数' })
  totalFollowedBy: number;

  @Field((type) => Int, { description: 'フォローされているユーザの総数' })
  totalPosts: number;

  @Field((type) => Boolean, { description: '続く' })
  isFollowing: boolean;
}
