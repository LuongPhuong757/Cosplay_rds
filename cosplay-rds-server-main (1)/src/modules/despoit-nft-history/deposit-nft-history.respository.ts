import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { DepositNFTHistory } from './deposit-nft-history.model';

@Service()
export class DepositNftHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(args: Prisma.DepositNFTHistoryCreateArgs): Promise<DepositNFTHistory> {
    return await this.prisma.depositNFTHistory.create(args);
  }
}
