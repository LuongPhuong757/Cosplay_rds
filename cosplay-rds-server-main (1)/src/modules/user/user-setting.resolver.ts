import { ResultResponse } from '@common/response/result.response';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { UserPrivateSettingResponse } from '@modules/user-private/dto/response/user-private-setting';
import { UserPrivate } from '@modules/user-private/user-private.model';
import { Resolver, Query, Arg, Mutation, Authorized } from 'type-graphql';
import { Service } from 'typedi';
import { UpdateMySettingInput } from './dto/input/update-my-setting';
import { User } from './user.model';
import { UserService } from './user.service';

@Service()
@Resolver((of) => UserPrivateSettingResponse)
export class UserSettingResolver {
  constructor(private readonly userService: UserService) {}

  @Query((returns) => UserPrivateSettingResponse, { description: '自分の設定情報を取得する。' })
  @Authorized()
  async mySetting(@GetCurrentUser() currentUser: User): Promise<UserPrivate> {
    return await this.userService.mySetting(currentUser);
  }

  @Mutation((returns) => UserPrivateSettingResponse, { description: '自分の設定情報を更新する。' })
  @Authorized()
  async updateMySetting(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => UpdateMySettingInput) updateMySettingInput: UpdateMySettingInput,
  ): Promise<UserPrivate> {
    return await this.userService.updateMySetting(currentUser, updateMySettingInput);
  }

  @Mutation((returns) => ResultResponse, { description: 'ユーザのアカウントを削除します。' })
  @Authorized()
  deleteAccount(@GetCurrentUser() currentUser: User): Promise<ResultResponse> {
    return this.userService.deleteAccount(currentUser);
  }
}
