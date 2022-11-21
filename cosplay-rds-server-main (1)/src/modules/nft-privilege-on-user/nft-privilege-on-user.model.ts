import { NFTPrivilege } from '@modules/nft-privilege/nft-privilege.model';
import { NFTPrivilegeOnUsers as PrismaNFTPrivilegeOnUsers } from '@prisma/client';

export type NFTPrivilegeOnUsers = {
  nftPrivilege?: NFTPrivilege;
} & PrismaNFTPrivilegeOnUsers;
