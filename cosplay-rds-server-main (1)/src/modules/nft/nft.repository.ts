import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { NFT } from './nft.model';

@Service()
export class NftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.NFTFindManyArgs): Promise<NFT[]> {
    return await this.prisma.nFT.findMany(args);
  }

  async findFirst(args: Prisma.NFTFindFirstArgs): Promise<NFT | null> {
    return await this.prisma.nFT.findFirst(args);
  }

  async update(args: Prisma.NFTUpdateArgs): Promise<NFT> {
    return await this.prisma.nFT.update(args);
  }
}
