import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { OfficeRequest } from './office-request.model';

@Service()
export class OfficeRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.OfficeRequestFindManyArgs): Promise<OfficeRequest[]> {
    return await this.prisma.officeRequest.findMany(args);
  }

  async findFirst(args: Prisma.OfficeRequestFindFirstArgs): Promise<OfficeRequest | null> {
    return await this.prisma.officeRequest.findFirst(args);
  }

  async create(args: Prisma.OfficeRequestCreateArgs): Promise<OfficeRequest> {
    return await this.prisma.officeRequest.create(args);
  }

  async update(args: Prisma.OfficeRequestUpdateArgs): Promise<OfficeRequest> {
    return await this.prisma.officeRequest.update(args);
  }

  async delete(args: Prisma.OfficeRequestDeleteArgs): Promise<OfficeRequest> {
    return await this.prisma.officeRequest.delete(args);
  }
}
