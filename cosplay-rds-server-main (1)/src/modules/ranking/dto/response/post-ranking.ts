import { PostResponse } from '@modules/post/dto/response/post';
import { UserProfileResponse } from '@modules/user/dto/response/user-profile';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '投稿ランキング情報の返却スキーマ' })
export class PostRankingResponse {
  @Field((type) => PostResponse, { description: '投稿画像・動画' })
  post: PostResponse;

  @Field((type) => Int, { description: 'ランキング順位' })
  rank: number;

  @Field((type) => Int, { description: 'ランキングスコア' })
  score: number;
}

@ObjectType({ description: '投稿ランキング情報の返却スキーマ' })
export class userRankingRes {
  @Field((type) => UserProfileResponse, { description: '投稿画像・動画' })
  user: UserProfileResponse;

  @Field((type) => Int, { description: 'ランキングスコア' })
  userId: number;

  @Field((type) => Int, { description: 'ランキングスコア' })
  score: number;
}

@ObjectType({ description: '投稿ランキング情報の返却スキーマ' })
export class EventRankingResponse {
  @Field((type) => [PostRankingResponse], { description: '投稿画像・動画' })
  posts: PostRankingResponse[];

  @Field((type) => [userRankingRes], { description: '投稿画像・動画' })
  users: userRankingRes[];
}
