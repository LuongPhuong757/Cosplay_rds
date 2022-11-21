import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { CotHistory } from './cot-history.model';

@Service()
export class CotHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.CotHistoryFindManyArgs): Promise<CotHistory[]> {
    return await this.prisma.cotHistory.findMany(args);
  }
}
