import { NFT } from '@modules/nft/nft.model';
import { NFTGachaOnNFTs as PrismaNFTGachaOnNFTs } from '@prisma/client';

export type NFTGachaOnNFTs = {
  nft: NFT;
} & PrismaNFTGachaOnNFTs;
