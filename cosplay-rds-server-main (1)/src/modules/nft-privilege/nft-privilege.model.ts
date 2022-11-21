import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { NFTPrivilegeOnNFTs } from '@modules/nft-privilege-on-nft/nft-privilege-on-nft.model';
import { NFTPrivilegeOnUsers } from '@modules/nft-privilege-on-user/nft-privilege-on-user.model';
import { NFTPrivilege as PrismaNFTPrivilege } from '@prisma/client';

export type NFTPrivilege = {
  nfts?: NFTPrivilegeOnNFTs[];
  nftCampaign?: NFTCampaign;
  nftPrivilegeOnUsers?: NFTPrivilegeOnUsers[];
} & PrismaNFTPrivilege;
