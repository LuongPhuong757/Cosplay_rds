import { UserResponse } from '@modules/user/dto/response/user';
import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType({ description: '事務所からのリクエスト情報の返却スキーマ' })
export class OfficeRequestResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => UserResponse, { description: 'リクエスト元の事務所情報' })
  office: UserResponse;

  @Field((type) => Date, { description: 'リクエスト送信日時' })
  created: Date;
}
