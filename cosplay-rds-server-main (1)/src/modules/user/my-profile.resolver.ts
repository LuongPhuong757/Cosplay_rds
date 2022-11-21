import { GetCurrentUser } from '@decorators/current-user.decorator';
import { Resolver, Query, Arg, Mutation, Authorized } from 'type-graphql';
import { Service } from 'typedi';
import { UpdateProfileInput } from './dto/input/update-profile';
import { MyProfileResponse } from './dto/response/my-profile';
import { UserBaseResolver } from './user-base.resolver';
import { User } from './user.model';
import { UserService } from './user.service';

@Service()
@Resolver((of) => MyProfileResponse)
export class MyProfileResolver extends UserBaseResolver(MyProfileResponse) {
  constructor(private readonly userService: UserService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  @Query((returns) => MyProfileResponse, {
    description: '自分のプライベート情報を取得する。',
  })
  @Authorized()
  async myPrivate(@GetCurrentUser() { id }: User): Promise<User> {
    return await this.userService.myPrivate(id);
  }

  @Mutation((returns) => MyProfileResponse, {
    description: 'ユーザのプロフィール編集を行う。',
  })
  @Authorized()
  async updateProfile(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => UpdateProfileInput) updateProfileInput: UpdateProfileInput,
  ): Promise<User> {
    return await this.userService.updateProfile(currentUser, updateProfileInput);
  }

  @Mutation((returns) => MyProfileResponse, {
    description: '自分のマジックリンクを登録する。',
  })
  @Authorized()
  async registerPublicAddress(
    @GetCurrentUser() currentUser: User,
    @Arg('address', (type) => String) address: string,
  ): Promise<User> {
    return await this.userService.registerPublicAddress(currentUser, address);
  }
}
