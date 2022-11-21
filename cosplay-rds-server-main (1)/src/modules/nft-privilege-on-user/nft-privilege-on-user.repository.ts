import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { NFTPrivilegeOnUsers } from './nft-privilege-on-user.model';

@Service()
export class NFTPrivilegeOnUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(
    args: Prisma.NFTPrivilegeOnUsersFindFirstArgs,
  ): Promise<NFTPrivilegeOnUsers | null> {
    return await this.prisma.nFTPrivilegeOnUsers.findFirst(args);
  }

  async findMany(args: Prisma.NFTPrivilegeOnUsersFindManyArgs): Promise<NFTPrivilegeOnUsers[]> {
    return await this.prisma.nFTPrivilegeOnUsers.findMany(args);
  }

  async create(args: Prisma.NFTPrivilegeOnUsersCreateArgs): Promise<NFTPrivilegeOnUsers> {
    return await this.prisma.nFTPrivilegeOnUsers.create(args);
  }

  async update(args: Prisma.NFTPrivilegeOnUsersUpdateArgs): Promise<NFTPrivilegeOnUsers> {
    return await this.prisma.nFTPrivilegeOnUsers.update(args);
  }

  async createOrUpdate({
    findArgs,
    createArgs,
    updateInput,
  }: {
    findArgs: Prisma.NFTPrivilegeOnUsersFindFirstArgs;
    createArgs: Prisma.NFTPrivilegeOnUsersCreateArgs;
    updateInput: Prisma.XOR<
      Prisma.NFTPrivilegeOnUsersUpdateInput,
      Prisma.NFTPrivilegeOnUsersUncheckedUpdateInput
    >;
  }): Promise<NFTPrivilegeOnUsers> {
    const nftPrivilegeOnUser = await this.findFirst(findArgs);
    if (nftPrivilegeOnUser) {
      return await this.update({
        where: {
          userId_nftPrivilegeId: {
            userId: nftPrivilegeOnUser.userId,
            nftPrivilegeId: nftPrivilegeOnUser.nftPrivilegeId,
          },
        },
        data: updateInput,
      });
    }

    return await this.create(createArgs);
  }
}
