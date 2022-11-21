import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { NFTGacha } from './nft-gacha.model';

@Service()
export class NFTGachaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(args: Prisma.NFTGachaFindFirstArgs): Promise<NFTGacha | null> {
    return await this.prisma.nFTGacha.findFirst(args);
  }

  async create(args: Prisma.NFTGachaCreateArgs): Promise<NFTGacha> {
    return await this.prisma.nFTGacha.create(args);
  }
}
