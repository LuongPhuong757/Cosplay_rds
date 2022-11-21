import { NFT } from '@modules/nft/nft.model';
import { UserHasNFT as PrismaUserHasNFT } from '@prisma/client';

export type UserHasNFT = {
  nft?: NFT | null;
} & PrismaUserHasNFT;
