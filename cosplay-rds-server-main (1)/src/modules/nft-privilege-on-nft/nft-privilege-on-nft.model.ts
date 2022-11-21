import { NFT } from '@modules/nft/nft.model';
import { NFTPrivilegeOnNFTs as PrismaNFTPrivilegeOnNFTs } from '@prisma/client';

export type NFTPrivilegeOnNFTs = {
  nft: NFT;
} & PrismaNFTPrivilegeOnNFTs;
