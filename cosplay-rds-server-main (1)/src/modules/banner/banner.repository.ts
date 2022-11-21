import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Banner } from './banner.model';

const MAX_LIMIT_BANNER = 10;

@Service()
export class BannerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async currentBanners(): Promise<Banner[]> {
    const highestPriorityBanners = await this.prisma.$queryRaw<
      Banner[]
    >`SELECT * FROM "public"."Banner" WHERE priority = (SELECT MAX(priority) FROM "public"."Banner") LIMIT ${MAX_LIMIT_BANNER}`;

    return highestPriorityBanners;
  }
}
