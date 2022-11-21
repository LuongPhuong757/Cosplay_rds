import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { ResultResponse } from '@common/response/result.response';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { GetBlockUsers } from '@middlewares/get-block-users.middleware';
import { User } from '@modules/user/user.model';
import {
  Resolver,
  Int,
  Query,
  Arg,
  Mutation,
  Authorized,
  UseMiddleware,
  FieldResolver,
  Root,
} from 'type-graphql';
import { Service } from 'typedi';
import { ExecutePrivilegeInput } from './dto/input/execute-privilege';
import { NFTIssuerPrivilegeResponse } from './dto/response/nft-issuer-privilege';
import { NFTPrivilegeResponse } from './dto/response/nft-privilege';
import { NFTPrivilege } from './nft-privilege.model';
import { NFTPrivilegeService } from './nft-privilege.service';

@Service()
@Resolver(() => NFTPrivilegeResponse)
export class NftPrivilegeResolver {
  constructor(private readonly nFTPrivilegeService: NFTPrivilegeService) {}

  @Query((returns) => [NFTPrivilegeResponse], {
    description: 'nftCampaignIdで指定したNFTキャンペーンに紐づく特典を返す。',
  })
  async getNftPrivilegesByCampaignId(
    @Arg('nftCampaignId', (type) => Int) nftCampaignId: number,
    @GetCurrentUser() user?: User,
  ): Promise<NFTPrivilege[]> {
    return await this.nFTPrivilegeService.getNftPrivilegesByCampaignId(nftCampaignId, user);
  }

  @Query((returns) => NFTPrivilegeResponse, {
    description: 'nftPrivilegeIdで指定しNFT特典を返す。',
  })
  async getNftPrivilegeById(
    @Arg('nftPrivilegeId', (type) => Int) nftPrivilegeId: number,
    @GetCurrentUser() user?: User,
  ): Promise<NFTPrivilege> {
    return await this.nFTPrivilegeService.getNftPrivilege(nftPrivilegeId, user);
  }

  @Query((returns) => [NFTPrivilegeResponse], {
    description: 'nftIdに紐づく特典を返す。',
  })
  async getNftPrivilegesByNftId(
    @Arg('nftId', (type) => Int) nftId: number,
    @GetCurrentUser() user?: User,
  ): Promise<NFTPrivilege[]> {
    return await this.nFTPrivilegeService.getNftPrivilegesByNftId(nftId, user);
  }

  @Query((returns) => [NFTIssuerPrivilegeResponse], {
    description: 'userIdを指定して、ユーザが発行している特典の一覧を取得する。',
  })
  async getUserIssueNftPrivileges(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<NFTPrivilege[]> {
    return await this.nFTPrivilegeService.getUserIssueNftPrivileges(userId, pagingOptions);
  }

  @Mutation((returns) => ResultResponse, {
    description: 'NFTの特典を行使して取得する。',
  })
  @Authorized()
  @UseMiddleware(GetBlockUsers)
  async executePrivilege(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => ExecutePrivilegeInput)
    input: ExecutePrivilegeInput,
  ): Promise<ResultResponse> {
    return await this.nFTPrivilegeService.executePrivilege(currentUser, input);
  }

  @Query((returns) => [NFTPrivilegeResponse], {
    description: 'あるユーザが行使した特典の一覧を返す。',
  })
  @Authorized()
  @UseMiddleware(GetBlockUsers)
  async getExecutedNftPrivilegesByUserId(
    @Arg('userId', (type) => Int) userId: number,
  ): Promise<NFTPrivilege[]> {
    return await this.nFTPrivilegeService.getExecutedNftPrivilegesByUserId(userId);
  }

  @Query((returns) => [NFTPrivilegeResponse], {
    description:
      'userId を指定して、そのユーザが保有しているNFTに絡んでいる特典の一覧を paging で取得。',
  })
  @Authorized()
  @UseMiddleware(GetBlockUsers)
  async getExcecutableNftPrivilege(
    @GetCurrentUser() currentUser: User,
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<NFTPrivilege[]> {
    return await this.nFTPrivilegeService.getExcecutableNftPrivilege(
      currentUser,
      userId,
      pagingOptions,
    );
  }

  @FieldResolver((returns) => Int, {
    description: '特典を実際に実行した回数を表すFieldResolver。',
  })
  executionTimes(@Root() nftPrivilege: NFTPrivilege): number {
    return (
      nftPrivilege.nftPrivilegeOnUsers?.reduce(
        (prevTotalExecTimes, { executionTimes }) => prevTotalExecTimes + executionTimes,
        0,
      ) ?? 0
    );
  }
}
