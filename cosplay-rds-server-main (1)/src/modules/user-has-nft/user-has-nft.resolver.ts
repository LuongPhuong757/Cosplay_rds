import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@modules/user/user.model';
import { Resolver, Query, Arg, Int, Authorized, Mutation } from 'type-graphql';
import { Service } from 'typedi';
import { ShipNFTInput } from './dto/input/ship-nft';
import { UserHasNftResponse } from './dto/response/user-has-nft';
import { UserHasNFT } from './user-has-nft.model';
import { UserHasNftService } from './user-has-nft.service';

@Service()
@Resolver((of) => UserHasNftResponse)
export class NftResolver {
  constructor(private readonly userHasNftService: UserHasNftService) {}

  @Query((returns) => [UserHasNftResponse], {
    description: '指定したユーザが保持しているNFTのリストを返す',
  })
  async getOwnedNFTs(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserHasNFT[]> {
    return await this.userHasNftService.findOwnedNFTs(userId, pagingOptions);
  }

  @Mutation((returns) => UserHasNftResponse, {
    description: '指定したNFTを出庫する',
  })
  @Authorized()
  async shipNft(
    @GetCurrentUser() { id: userId }: User,
    @Arg('input', (type) => ShipNFTInput) input: ShipNFTInput,
  ): Promise<UserHasNFT> {
    return await this.userHasNftService.shipNFT(userId, input);
  }
}
