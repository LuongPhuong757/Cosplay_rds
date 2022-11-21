import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Office } from './office.model';

@Service()
export class OfficeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOffice(userId: number): Promise<Office> {
    const office = await this.findFirst({
      where: {
        owner: {
          id: userId,
        },
      },
    });
    if (!office) {
      throw new Error('you are not owner of office');
    }

    return office;
  }

  async findFirst(args: Prisma.OfficeFindFirstArgs): Promise<Office | null> {
    return await this.prisma.office.findFirst(args);
  }

  async update(args: Prisma.OfficeUpdateArgs): Promise<Office> {
    return await this.prisma.office.update(args);
  }
}
