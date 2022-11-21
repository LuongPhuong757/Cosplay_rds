import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { NFT as PrismaNFT } from '@prisma/client';

export type NFT = {
  campaign?: NFTCampaign | null;
} & PrismaNFT;
