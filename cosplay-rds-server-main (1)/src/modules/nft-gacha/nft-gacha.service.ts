/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { NFT } from '@modules/nft/nft.model';
import { NftRepository } from '@modules/nft/nft.repository';
import { SuperchatRepository } from '@modules/superchat/superchat.repository';
import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import { GachaService } from '@services/gacha.service';
import { Service } from 'typedi';
import { NFTGachaRepository } from './nft-gacha.repository';

@Service()
export class NFTGachaService {
  constructor(
    private readonly nFTGachaRepository: NFTGachaRepository,
    private readonly superchatRepository: SuperchatRepository,
    private readonly nftRepository: NftRepository,
    private readonly userHasNFTRepository: UserHasNftRepository,
    private readonly gachaService: GachaService,
  ) {}

  async getNftGacha(userId: number, paymentIntentId: string): Promise<NFT[]> {
    const superchat = await this.superchatRepository.findFirst({
      where: {
        userId,
        paymentIntentId,
      },
    });
    if (!superchat) {
      throw new Error('invalid request');
    }
    const nftGacha = await this.nFTGachaRepository.findFirst({
      where: {
        superchatId: superchat.id,
      },
      include: {
        nfts: {
          include: {
            nft: true,
          },
        },
      },
    });
    if (!nftGacha) {
      throw new Error('invalid nftGacha');
    }

    return nftGacha.nfts?.map((nftOn) => ({ ...nftOn.nft, amount: nftOn.total })) ?? [];
  }

  async createGacha(
    nftCampaign: NFTCampaign,
    amount: number,
    superchatId: number,
    userId: number,
  ): Promise<void> {
    const totalNumberOfGacha = this.gachaService.getTotalNumberOfGacha(amount);
    const promises = [...Array(totalNumberOfGacha)].map(async (_) => {
      const rarity = this.gachaService.getRarity(
        nftCampaign?.emissionRateTable as Record<string, number>,
      );
      const targetNfts = await this.getTragetNfts(nftCampaign.id, rarity);

      return this.gachaService.getTargetNft(targetNfts);
    });
    const gotNfts = await Promise.all(promises);
    const totalNfts = this.gachaService.getTotalNfts(gotNfts);

    /* NFTGacha AND NFTGachaOnNfts */
    await this.connectGacha(totalNfts, superchatId);

    /* UserHasNft */
    await this.connectUserHasNft(totalNfts, userId);

    /* NFT */
    await this.connectNft(totalNfts);
  }

  private async connectGacha(
    totalNfts: { id: number; total: number }[],
    superchatId: number,
  ): Promise<void> {
    const args = {
      data: {
        superchatId,
        nfts: {
          create: totalNfts.map(({ id, total }) => ({
            total,
            nft: {
              connect: {
                id,
              },
            },
          })),
        },
      },
    };

    await this.nFTGachaRepository.create(args);
  }

  private async connectUserHasNft(
    totalNfts: { id: number; total: number }[],
    userId: number,
  ): Promise<void> {
    const promises = totalNfts.map((nft) => {
      const args = {
        findArgs: {
          where: {
            userId,
            nftId: nft.id,
          },
        },
        createArgs: {
          data: {
            userId,
            nftId: nft.id,
            amount: nft.total,
            shipped: 0,
          },
        },
        updateInput: {
          amount: {
            increment: nft.total,
          },
        },
      };

      return this.userHasNFTRepository.createOrUpdate(args);
    });

    await Promise.all(promises);
  }

  private async connectNft(totalNfts: { id: number; total: number }[]): Promise<void> {
    const promises = totalNfts.map((nft) => {
      const args = {
        where: {
          id: nft.id,
        },
        data: {
          totalSupply: {
            increment: nft.total,
          },
        },
      };

      return this.nftRepository.update(args);
    });

    await Promise.all(promises);
  }

  private async getTragetNfts(nftCampaignId: number, rarity: number): Promise<NFT[]> {
    const args = {
      where: {
        campaignId: nftCampaignId,
        rarity,
      },
    };
    const targetNfts = await this.nftRepository.findMany(args);
    if (targetNfts.length === 0) {
      throw new Error(`target rarity nft is not exist. nftCampaignId: ${nftCampaignId}`);
    }

    return targetNfts;
  }
}
