import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import {
  COTTipNFTDistributionState,
  COTTipTriggerdTxHashes,
  COTTipDistributionTriggerdTxHashes,
} from './cot-tip.model';

@Service()
export class COTTipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTxHash(
    args: Prisma.COTTipTriggerdTxHashesFindFirstArgs,
  ): Promise<COTTipTriggerdTxHashes | null> {
    return await this.prisma.cOTTipTriggerdTxHashes.findFirst(args);
  }

  async registerTxHash(txHash: string, nftDistributed: boolean): Promise<void> {
    await this.prisma.cOTTipTriggerdTxHashes.create({
      data: {
        txHash,
        nftDistributed,
      },
    });
  }

  async findNFTDistributionState(
    args: Prisma.COTTipNFTDistributionStateFindFirstArgs,
  ): Promise<COTTipNFTDistributionState | null> {
    return await this.prisma.cOTTipNFTDistributionState.findFirst(args);
  }

  async findDistributionTxHash(
    args: Prisma.COTTipDistributionTriggerdTxHashesFindFirstArgs,
  ): Promise<COTTipDistributionTriggerdTxHashes | null> {
    return await this.prisma.cOTTipDistributionTriggerdTxHashes.findFirst(args);
  }

  async registerDistributionTxHash(txHash: string, postId: number, photoId: number): Promise<void> {
    await this.prisma.cOTTipDistributionTriggerdTxHashes.create({
      data: {
        txHash,
        postId,
        photoId,
      },
    });
  }
}
