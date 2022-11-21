import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '特典を行使したユーザ情報の返却スキーマ' })
export class NFTPrivilegeOnUserResponse {
  @Field((type) => UserResponse, { description: 'User情報' })
  user: UserResponse;

  @Field((type) => Int, { description: '特典を行使した回数' })
  executionTimes: number;
}
