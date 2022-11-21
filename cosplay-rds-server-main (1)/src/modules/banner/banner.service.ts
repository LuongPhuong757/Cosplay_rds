import { Service } from 'typedi';
import { Banner } from './banner.model';
import { BannerRepository } from './banner.repository';

@Service()
export class BannerService {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async currentBanners(): Promise<Banner[]> {
    return await this.bannerRepository.currentBanners();
  }
}
