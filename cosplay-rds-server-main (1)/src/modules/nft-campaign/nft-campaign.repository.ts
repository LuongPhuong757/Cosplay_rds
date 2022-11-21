import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { NFTCampaign } from './nft-campaign.model';

@Service()
export class NftCampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(args: Prisma.NFTCampaignFindFirstArgs): Promise<NFTCampaign | null> {
    return await this.prisma.nFTCampaign.findFirst(args);
  }
}
