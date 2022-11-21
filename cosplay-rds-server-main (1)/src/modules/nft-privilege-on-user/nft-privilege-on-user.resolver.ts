import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { NftPrivilegeExecutedUsersGuard } from '@guards/nft-privilege-executed-users.guard';
import { Resolver, Int, Query, Arg, UseMiddleware, Authorized } from 'type-graphql';
import { Service } from 'typedi';
import { NFTPrivilegeOnUserResponse } from './dto/nft-privilege-on-user';
import { NFTPrivilegeOnUsers } from './nft-privilege-on-user.model';
import { NFTPrivilegeOnUsersService } from './nft-privilege-on-user.service';

@Service()
@Resolver()
export class NftPrivilegeOnUsersResolver {
  constructor(private readonly nFTPrivilegeOnUsersService: NFTPrivilegeOnUsersService) {}

  @Query((returns) => [NFTPrivilegeOnUserResponse], {
    description:
      'nftPrivilegeIdを指定し、その特典を行使したユーザ(+icon, 行使回数)の一覧を取得する。',
  })
  @Authorized()
  @UseMiddleware(NftPrivilegeExecutedUsersGuard)
  async getNftPrivilegesExecutedUsers(
    @Arg('nftPrivilegeId', (type) => Int) nftPrivilegeId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<NFTPrivilegeOnUsers[]> {
    return await this.nFTPrivilegeOnUsersService.getNftPrivilegesExecutedUsers(
      nftPrivilegeId,
      pagingOptions,
    );
  }
}
