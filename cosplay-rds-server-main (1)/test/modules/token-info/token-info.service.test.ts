import { MaticProvider } from '@providers/matic.provider';
import { TokenInfoService } from '../../../src/modules/token-info/token-info.service';
import { CoingeckoProvider } from '../../../src/providers/coingecko.provider';

describe('TokenInfoService', () => {
  let tokenInfoService: TokenInfoService;
  let coingeckoProvider: CoingeckoProvider;
  let maticProvider: MaticProvider;

  beforeAll(() => {
    coingeckoProvider = new CoingeckoProvider();
    maticProvider = new MaticProvider();
    tokenInfoService = new TokenInfoService(coingeckoProvider, maticProvider);
  });

  describe('Coingecko Provider', () => {
    it('get token info list.', async () => {
      const res = await coingeckoProvider.getTokenListInfo();
      expect(res).toHaveProperty('cosplay-token-2');
      expect(res['cosplay-token-2']).toHaveProperty('jpy');
      expect(res['cosplay-token-2']).toHaveProperty('change24h');
    });
  });

  describe('Token Info Service', () => {
    it('get token info list with lpcot.', async () => {
      const res = await tokenInfoService.tokenInfoList();
      console.log('tokenInfoList: ', res);
      expect(res).toHaveProperty('lpCot');
    });
  });
});
