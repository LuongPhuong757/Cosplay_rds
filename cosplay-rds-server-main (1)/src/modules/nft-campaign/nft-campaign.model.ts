import { NFT } from '@modules/nft/nft.model';
import { User } from '@modules/user/user.model';
import { NFTCampaign as PrismaNFTCampaign } from '@prisma/client';

export type NFTCampaign = {
  nfts?: NFT[];
  user?: User | null;
} & PrismaNFTCampaign;
