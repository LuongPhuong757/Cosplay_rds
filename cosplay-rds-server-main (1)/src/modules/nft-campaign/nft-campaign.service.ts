import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { NFT } from '@modules/nft/nft.model';
import { NftRepository } from '@modules/nft/nft.repository';
import { UserHasNFT } from '@modules/user-has-nft/user-has-nft.model';
import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import { User } from '@modules/user/user.model';
import { Service } from 'typedi';
import { NFTCampaign } from './nft-campaign.model';
import { NftCampaignRepository } from './nft-campaign.repository';

@Service()
export class NftCampaignService {
  constructor(
    private readonly nftCampaignRepository: NftCampaignRepository,
    private readonly nftRepository: NftRepository,
    private readonly userHasNftRepository: UserHasNftRepository,
  ) {}

  async getUserNftCampaign(
    nftCampaignId: number,
    user?: User,
  ): Promise<
    NFTCampaign & { userCampaignNfts: UserHasNFT[] } & {
      nfts?: Array<NFT & { amount: number; shipped: number }>;
    }
  > {
    return await this.getAmountAndShippedCampaign(nftCampaignId, user);
  }

  async getUserNftCampaignByNftId(
    nftId: number,
    user?: User,
  ): Promise<
    NFTCampaign & { userCampaignNfts: UserHasNFT[] } & {
      nfts?: Array<NFT & { amount: number; shipped: number }>;
    }
  > {
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
    if (!nft) {
      throw new Error('invalid nftId');
    }
    if (!nft.campaign) {
      throw new Error('nft has no campaign');
    }

    return await this.getAmountAndShippedCampaign(nft.campaign.id, user);
  }

  private async getAmountAndShippedCampaign(
    nftCampaignId: number,
    user?: User,
  ): Promise<
    NFTCampaign & { userCampaignNfts: UserHasNFT[] } & {
      nfts?: Array<NFT & { amount: number; shipped: number }>;
    }
  > {
    const campaignArgs = {
      where: {
        id: nftCampaignId,
      },
      include: {
        nfts: true,
        user: true,
      },
    };
    const nftCampaign = await this.nftCampaignRepository.findFirst(campaignArgs);
    if (!nftCampaign) {
      throw Error('invalid nftCampaignId');
    }
    const userHasNfts = user ? await this.getUserCampaignNfts(user.id, nftCampaignId) : [];

    return {
      ...this.addAmountAndShippedToNft(nftCampaign, userHasNfts),
      userCampaignNfts: userHasNfts,
    };
  }

  async getUserActiveCampaign(targetUserId: number): Promise<NFTCampaign | null> {
    const args = {
      where: {
        AND: [
          {
            start: { lte: new Date() },
          },
          { end: { gte: new Date() } },
        ],
        userId: targetUserId,
      },
    };

    return await this.nftCampaignRepository.findFirst(args);
  }

  private addAmountAndShippedToNft(nftCampaign: NFTCampaign, userHasNfts: UserHasNFT[]) {
    return {
      ...nftCampaign,
      nfts: nftCampaign.nfts?.map((nft) => {
        const finded = userHasNfts.find(({ nftId }) => nftId === nft.id);

        return {
          ...nft,
          amount: finded?.amount ?? 0,
          shipped: finded?.shipped ?? 0,
        };
      }),
    };
  }

  // NOTES: userHasNftServiceから呼ぶとsqsがundefinedになるので、こちらに書いています。
  private async getUserCampaignNfts(
    userId: number,
    campaignId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserHasNFT[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const args = {
      ...pagingOptionsQuery,
      where: {
        userId,
        nft: {
          campaignId,
        },
      },
    };

    return await this.userHasNftRepository.findMany(args);
  }
}
