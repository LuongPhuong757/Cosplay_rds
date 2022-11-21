import { GachaService } from '../../src/services/gacha.service';

describe('GachaService', () => {
  const gachaService = new GachaService();

  describe('getRarity', () => {
    it('emissionTable has number key', () => {
      const emissionTable = { 1: 60, 2: 20, 3: 10, 4: 8, 5: 2 };
      const rarity = gachaService.getRarity(emissionTable);

      expect(rarity).toBeGreaterThanOrEqual(0);
      expect(rarity).toBeLessThanOrEqual(5);
    });

    it('skipped number', () => {
      const emissionTable = { 5: 60, 7: 20, 10: 10, 15: 8, 20: 2 };
      const rarity = gachaService.getRarity(emissionTable);

      expect(rarity).toBeGreaterThanOrEqual(5);
      expect(rarity).toBeLessThanOrEqual(20);
    });

    it('not 100% rate', () => {
      const emissionTable = { 1: 30, 2: 20, 3: 10, 4: 5, 5: 1 };
      const rarity = gachaService.getRarity(emissionTable);

      expect(rarity).toBeGreaterThanOrEqual(0);
      expect(rarity).toBeLessThanOrEqual(5);
    });
  });

  describe('getTotalNumberOfGacha', () => {
    it('returns gacha', () => {
      const amount = 2000;
      const result = gachaService.getTotalNumberOfGacha(amount);

      expect(result).toBe(2);
    });

    it('returns gacha floor', () => {
      const amount = 1500;
      const result = gachaService.getTotalNumberOfGacha(amount);

      expect(result).toBe(1);
    });
  });

  describe('getTotalNfts', () => {
    it('return totalNfts', () => {
      const nfts = [
        {
          id: 1,
          address: 'gacha-01-address',
          tokenID: '1',
          totalSupply: 1,
          name: 'name',
          image: 'image',
          description: 'b',
          issuerId: 1,
          campaignId: 1,
          rarity: 1,
        },
        {
          id: 2,
          address: 'gacha-03-address',
          tokenID: '1',
          totalSupply: 1,
          name: 'name',
          image: 'image',
          description: 'b',
          issuerId: 1,
          campaignId: 1,
          rarity: 1,
        },
        {
          id: 2,
          address: 'gacha-03-address',
          tokenID: '1',
          totalSupply: 1,
          name: 'name',
          image: 'image',
          description: 'b',
          issuerId: 1,
          campaignId: 1,
          rarity: 1,
        },
      ];
      const totalNfts = gachaService.getTotalNfts(nfts);

      expect(totalNfts).toEqual([
        { id: 1, total: 1 },
        { id: 2, total: 2 },
      ]);
    });
  });
});
