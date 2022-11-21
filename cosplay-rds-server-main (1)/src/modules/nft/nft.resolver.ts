import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import config from '@config';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@modules/user/user.model';
import { Resolver, Query, Arg, Int, Authorized, FieldResolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { NftResponse } from './dto/response/nft.response';
import { NFT } from './nft.model';
import { NftService } from './nft.service';

const { photoDomain } = config.file;

@Service()
@Resolver((of) => NftResponse)
export class NftResolver {
  constructor(private readonly nftService: NftService) {}

  @Query((returns) => [NftResponse], {
    description: '指定したユーザが発行したNFTのリストを返す',
  })
  @Authorized()
  async getIssuedNFTs(
    @Arg('userId', (type) => Int) userId: number,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<NFT[]> {
    return await this.nftService.findIssuedNFTs(userId, pagingOptions);
  }

  @Query((returns) => NftResponse, {
    description: '指定したNFTID(db)からNFTを返す',
  })
  async nftById(
    @Arg('nftId', (type) => Int) nftId: number,
    @GetCurrentUser() user?: User,
  ): Promise<NFT> {
    return await this.nftService.findNFTById(nftId, user);
  }

  @FieldResolver((returns) => Int, {
    description:
      'NFTの持っている数を示すFieldResolver。指定以外のresolverを呼んだ際は0になります。',
  })
  amount(@Root() nft: NFT & { amount?: number }): number {
    return nft.amount ?? 0;
  }

  @FieldResolver((returns) => Int, {
    description: 'NFTの出庫数を示すFieldResolver。指定以外のresolverを呼んだ際は0になります。',
  })
  shipped(@Root() nft: NFT & { shipped?: number }): number {
    return nft.shipped ?? 0;
  }

  @FieldResolver((returns) => String, {
    nullable: true,
    description: 'ドメインを付与したイメージのURLを返すFieldResolver。',
  })
  image(@Root() { image }: NFT): string {
    return `${photoDomain}${image}`;
  }
}
