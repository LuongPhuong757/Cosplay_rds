import { GetCurrentUser } from '@decorators/current-user.decorator';
import { NFT } from '@modules/nft/nft.model';
import { UserHasNFT } from '@modules/user-has-nft/user-has-nft.model';
import { User } from '@modules/user/user.model';
import { Resolver, FieldResolver, Int, Root, Query, Arg } from 'type-graphql';
import { Service } from 'typedi';
import { NftCampaignResponse } from './dto/response/nft-campaign';
import { NFTCampaign } from './nft-campaign.model';
import { NftCampaignService } from './nft-campaign.service';

@Service()
@Resolver((of) => NftCampaignResponse)
export class NftCampaignResolver {
  constructor(private readonly nftCampaignService: NftCampaignService) {}

  @Query((returns) => NftCampaignResponse, {
    description: 'nftCampaignIdで指定したキャンペーンの概要を返す。',
  })
  async getNftCampaign(
    @Arg('nftCampaignId', (type) => Int) nftCampaignId: number,
    @GetCurrentUser() user?: User,
  ): Promise<NFTCampaign & { nfts?: Array<NFT & { amount: number; shipped: number }> }> {
    return await this.nftCampaignService.getUserNftCampaign(nftCampaignId, user);
  }

  @Query((returns) => NftCampaignResponse, {
    description: 'nftIdで指定したキャンペーンの概要を返す。',
  })
  async getNftCampaignByNftId(
    @Arg('nftId', (type) => Int) nftId: number,
    @GetCurrentUser() user?: User,
  ): Promise<NFTCampaign & { nfts?: Array<NFT & { amount: number; shipped: number }> }> {
    return await this.nftCampaignService.getUserNftCampaignByNftId(nftId, user);
  }

  @FieldResolver((returns) => Int, {
    description: 'NFTキャンペーンの達成率を示すFieldResolver。',
  })
  campaignNftRate(@Root() nftCampaign: NFTCampaign & { userCampaignNfts: UserHasNFT[] }): number {
    if (!nftCampaign.userCampaignNfts || !nftCampaign.nfts) return 0;
    if (nftCampaign.userCampaignNfts.length === 0 || nftCampaign.nfts?.length) return 0;

    return (nftCampaign.userCampaignNfts.length / nftCampaign.nfts?.length) * 100;
  }
}
