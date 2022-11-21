import { GetCache } from '@decorators/cache.decorator';
import { CacheInterceptor } from '@interceptors/cache.interceptor';
import { CacheContext } from '@interfaces';
import { Query, Resolver, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { cache } from '../../cache';
import { TokenInfoResponse } from './dto/response/token-info';
import { TokenInfoListResponse } from './dto/response/token-info-list';
import { TokenInfoService } from './token-info.service';

@Service()
@Resolver((of) => TokenInfoResponse)
export class TokenInfo {
  constructor(private readonly tokenInfoService: TokenInfoService) {}

  @Query((returns) => TokenInfoListResponse, { description: 'Tokenの各種情報を取得する' })
  @UseMiddleware(CacheInterceptor)
  async tokenInfoList(
    @GetCache()
    { cacheData, fieldName }: CacheContext<TokenInfoListResponse>,
  ): Promise<TokenInfoListResponse> {
    if (cacheData) {
      return cacheData as TokenInfoListResponse;
    }

    const info = await this.tokenInfoService.tokenInfoList();
    cache.set(fieldName, info);

    return info;
  }
}
