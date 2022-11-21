import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import { User } from '@modules/user/user.model';
import { Service } from 'typedi';
import { NFT } from './nft.model';
import { NftRepository } from './nft.repository';

@Service()
export class NftService {
  constructor(
    private readonly nftRepository: NftRepository,
    private readonly userHasNftRepository: UserHasNftRepository,
  ) {}

  async findIssuedNFTs(userId: number, pagingOptions?: PagingOptionsInput): Promise<NFT[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const nfts = await this.nftRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        campaign: {
          userId,
        },
      },
    });

    const userHasNftArgs = {
      where: {
        nftId: { in: nfts.map(({ id }) => id) },
      },
    };
    const userHasNfts = await this.userHasNftRepository.findMany(userHasNftArgs);

    return nfts.map((nft) => {
      const finded = userHasNfts.find(({ nftId }) => nftId === nft.id);

      return {
        ...nft,
        amount: finded?.amount ?? 0,
        shipped: finded?.shipped ?? 0,
      };
    });
  }

  async findNFTById(
    nftId: number,
    user?: User,
  ): Promise<NFT & { amount?: number; shipped?: number }> {
    const nft = await this.nftRepository.findFirst({
      where: {
        id: nftId,
      },
      include: {
        campaign: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!nft) throw Error('This nft is not found.');
    const userHasNft = await this.userHasNftRepository.findFirst({
      where: {
        nftId,
        userId: user?.id,
      },
    });

    return {
      ...nft,
      amount: userHasNft?.amount ?? 0,
      shipped: userHasNft?.shipped ?? 0,
    };
  }
}
