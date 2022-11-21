import { OfficeRequestResponse } from '@modules/office-request/dto/response/office-request';
import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '事務所情報の返却スキーマ' })
export class OfficeResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => Int, { description: '事務所のオーナ情報' })
  owner: UserResponse;

  @Field((type) => [UserResponse], { description: '事務所の所属しているレイヤー情報' })
  layers: UserResponse[];

  @Field((type) => [OfficeRequestResponse], { description: '事務所からのリクエスト情報' })
  officeRequests: OfficeRequestResponse[];
}
