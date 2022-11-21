import { ObjectType } from 'type-graphql';
import { IUserResponse } from './i-user';

@ObjectType({ implements: IUserResponse, description: 'ユーザ情報の返却スキーマ' })
export class UserResponse extends IUserResponse {}
