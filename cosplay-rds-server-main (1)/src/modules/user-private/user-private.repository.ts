import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { UserPrivate } from './user-private.model';

@Service()
export class UserPrivateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(args: Prisma.UserPrivateFindFirstArgs): Promise<UserPrivate | null> {
    return await this.prisma.userPrivate.findFirst(args);
  }

  async findMany(args: Prisma.UserPrivateFindManyArgs): Promise<UserPrivate[]> {
    return await this.prisma.userPrivate.findMany(args);
  }

  async update(args: Prisma.UserPrivateUpdateArgs): Promise<UserPrivate> {
    return await this.prisma.userPrivate.update(args);
  }

  async upsert(args: Prisma.UserPrivateUpsertArgs): Promise<UserPrivate> {
    return await this.prisma.userPrivate.upsert(args);
  }
}
