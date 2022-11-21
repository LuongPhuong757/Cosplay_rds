import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Superchat } from './superchat.model';

@Service()
export class SuperchatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(args: Prisma.SuperchatFindFirstArgs): Promise<Superchat | null> {
    return await this.prisma.superchat.findFirst(args);
  }

  async delete(args: Prisma.SuperchatDeleteArgs): Promise<Superchat> {
    return await this.prisma.superchat.delete(args);
  }
}
