import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { ResultResponse } from '@common/response/result.response';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { UserResponse } from '@modules/user/dto/response/user';
import { User } from '@modules/user/user.model';
import { Query, Resolver, Mutation, Authorized, Arg, Int } from 'type-graphql';
import { Service } from 'typedi';
import { UpdateMembershipPriceInput } from './dto/input/update-membership-price';
import { GetStripePriceInfoResponse } from './dto/response/get-membership-stripe-price-info';
import { MembershipService } from './membership.service';

@Service()
@Resolver()
export class MembershipResolver {
  constructor(private readonly membershipService: MembershipService) {}

  @Query((returns) => [UserResponse], {
    nullable: true,
    description: '自分が登録しているメンバーシップ一覧を取得する。',
  })
  @Authorized()
  async memberships(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<User[]> {
    const { id } = currentUser;

    return await this.membershipService.memberships(id, pagingOptions);
  }

  @Query((returns) => [UserResponse], {
    nullable: true,
    description: '自分のメンバーシップに登録しているユーザ一覧を取得する。',
  })
  @Authorized()
  async membershippedBy(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<User[]> {
    const { id } = currentUser;

    return await this.membershipService.membershippedBy(id, pagingOptions);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'メンバーシップの価格を更新する。',
  })
  @Authorized()
  async updateMembershipPrice(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => UpdateMembershipPriceInput)
    updateMembershipPriceInput: UpdateMembershipPriceInput,
  ): Promise<ResultResponse> {
    return await this.membershipService.updateMembershipPrice(
      currentUser,
      updateMembershipPriceInput,
    );
  }

  @Query((returns) => GetStripePriceInfoResponse, {
    nullable: true,
    description: 'メンバーシップのStripePriceIdを取得する。',
  })
  @Authorized()
  async getMembershipStripePriceInfo(
    @Arg('userId', (type) => Int) userId: number,
  ): Promise<GetStripePriceInfoResponse | null> {
    return await this.membershipService.getMembershipStripePriceInfo(userId);
  }
}
