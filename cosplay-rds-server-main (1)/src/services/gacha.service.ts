import config from '@config';
import { NFT } from '@modules/nft/nft.model';
import { Service } from 'typedi';

const { eachAmount } = config.gacha;

type Rare = {
  rarity: number;
  value: number;
};

type EmissionRange = {
  rarity: number;
  minRange: number;
  maxRange: number;
};

@Service()
export class GachaService {
  /**
   * get rarity for gacha
   *
   * @param emissionRateTable - the emission rate for each nft campaign
   * @returns the rarity
   *  emissionRanges = [
   *    { rarity: 1, minRange: 0, maxRange: 60 },
   *    { rarity: 2, minRange: 60, maxRange: 80 },
   *    { rarity: 3, minRange: 80, maxRange: 90 },
   *    { rarity: 4, minRange: 90, maxRange: 98 },
   *    { rarity: 5, minRange: 98, maxRange: 100 }
   *  ]
   */
  getRarity(emissionRateTable: Record<string, number>): number {
    const emissionRanges = this.getEmissionRanges(emissionRateTable);
    if (!this.validateEmissionRanges(emissionRanges)) {
      throw new Error(`your emission range is invalid ${JSON.stringify(emissionRateTable)}`);
    }
    const maxInt = Math.max(...emissionRanges.map((emission) => emission.maxRange));
    const target = GachaService.getRandomInt(maxInt);

    return (
      emissionRanges.find(({ minRange, maxRange }) => target >= minRange && target < maxRange)
        ?.rarity ?? this.getMinRarity(emissionRanges)
    );
  }

  getTargetNft(nfts: NFT[]): NFT {
    return nfts[Math.floor(Math.random() * nfts.length)];
  }

  getTotalNumberOfGacha(amount: number): number {
    return Math.floor(amount / eachAmount);
  }

  getTotalNfts(nfts: NFT[]): { id: number; total: number }[] {
    const nftIds = nfts.map(({ id }) => id);
    const totalNfts: { id: number; total: number }[] = [];

    nftIds.map((id) => {
      const index = totalNfts.findIndex((x) => x.id === id);
      if (index === -1) {
        totalNfts.push({ id, total: 1 });

        return;
      }

      totalNfts[index].total += 1;
    });

    return totalNfts;
  }

  private getEmissionRanges(emissionRateTable: Record<string, number>): EmissionRange[] {
    const keys = Object.keys(emissionRateTable);

    const rares: Rare[] = [];
    for (const key of keys) {
      const value = emissionRateTable[key];
      rares.push({
        rarity: Number(key),
        value,
      });
    }

    return rares.map((rare) => this.mapRange(rare, rares));
  }

  private validateEmissionRanges(emissionRanges: EmissionRange[]): boolean {
    return emissionRanges.every((emissionRange) =>
      Object.values(emissionRange).every((range) => typeof range === 'number'),
    );
  }

  private getMinRarity(emissionRanges: EmissionRange[]): number {
    return Math.min(...emissionRanges.map((emissionRange) => emissionRange.rarity));
  }

  private mapRange(rare: Rare, rares: Rare[]): EmissionRange {
    const { rarity, value } = rare;
    const filtered = rares.filter((r) => r.rarity < rarity);
    const range = [rare, ...filtered].reduce((prev, current) => prev + current.value, 0);

    return {
      rarity,
      minRange: range - value,
      maxRange: range,
    };
  }

  static getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
  }
}
