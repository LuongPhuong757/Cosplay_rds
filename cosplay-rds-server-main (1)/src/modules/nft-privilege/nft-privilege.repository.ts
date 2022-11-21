import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { NFTPrivilege } from './nft-privilege.model';

@Service()
export class NFTPrivilegeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.NFTPrivilegeFindManyArgs): Promise<NFTPrivilege[]> {
    return await this.prisma.nFTPrivilege.findMany(args);
  }

  async findFirst(args: Prisma.NFTPrivilegeFindFirstArgs): Promise<NFTPrivilege | null> {
    return await this.prisma.nFTPrivilege.findFirst(args);
  }

  async findUnique(args: Prisma.NFTPrivilegeFindUniqueArgs): Promise<NFTPrivilege | null> {
    return await this.prisma.nFTPrivilege.findUnique(args);
  }
}
