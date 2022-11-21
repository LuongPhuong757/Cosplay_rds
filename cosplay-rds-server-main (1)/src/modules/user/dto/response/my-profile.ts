import { UserPrivateResponse } from '@modules/user-private/dto/response/user-private';
import { Field, ObjectType, Root } from 'type-graphql';
import { User } from '../../user.model';
import { IUserResponse } from './i-user';
import { SnsResponse } from './sns';

@ObjectType({ implements: IUserResponse, description: '自分のプロフィール情報の返却スキーマ' })
export class MyProfileResponse extends IUserResponse {
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

  @Field((type) => UserPrivateResponse, {
    nullable: true,
    description: 'ユーザに紐付いたプライベート情報',
  })
  userPrivate: UserPrivateResponse | null;
}
