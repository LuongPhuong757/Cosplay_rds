import { addUrl } from '@common/util/add-url';
import { Resolver, Query, FieldResolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Banner } from './banner.model';
import { BannerService } from './banner.service';
import { BannerResponse } from './dto/response/banner';

@Service()
@Resolver((of) => BannerResponse)
export class BannerResolver {
  constructor(private readonly bannerService: BannerService) {}

  @Query((returns) => [BannerResponse], {
    description: 'プライオリティが一番高いバナー一覧を取得する。',
  })
  async currentBanners(): Promise<Banner[]> {
    return await this.bannerService.currentBanners();
  }

  @FieldResolver((returns) => String, {
    description: 'URL付きのイメージを返すFieldResolver',
  })
  image(@Root() banner: Banner): string {
    return addUrl(banner, 'image');
  }
}
