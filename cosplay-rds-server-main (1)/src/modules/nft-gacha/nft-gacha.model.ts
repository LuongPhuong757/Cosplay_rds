import { NFTGachaOnNFTs } from '@modules/nft-gacha-on-nft/nft-gacha-on-nft.model';
import { NFTGacha as NFTGachaPrisma } from '@prisma/client';

export type NFTGacha = {
  nfts?: NFTGachaOnNFTs[];
} & NFTGachaPrisma;
