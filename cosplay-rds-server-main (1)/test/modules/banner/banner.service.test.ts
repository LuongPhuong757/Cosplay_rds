import { image, internet } from 'faker';
import { BannerRepository } from '../../../src/modules/banner/banner.repository';
import { BannerService } from '../../../src/modules/banner/banner.service';
import { prisma } from '../../prisma-instance';

describe('BannerService', () => {
  let bannerRepository: BannerRepository;
  let bannerService: BannerService;

  const setup = async (priority: number) => {
    await prisma.banner.create({
      data: {
        image: image.imageUrl(),
        link: internet.url(),
        priority,
      },
    });
  };

  beforeAll(async () => {
    bannerRepository = new BannerRepository(prisma);
    bannerService = new BannerService(bannerRepository);
    await setup(1);
    await setup(5);
    await setup(10);
  });

  describe('currentBanners', () => {
    it('returns current banners that have correct properties.', async () => {
      const banners = await bannerService.currentBanners();
      const banner = banners[0];

      expect(banners.length).toBeGreaterThanOrEqual(1);
      expect(banner).toHaveProperty('id');
      expect(banner).toHaveProperty('image');
      expect(banner).toHaveProperty('link');
      expect(banner).toHaveProperty('created');
      expect(banner.priority).toBe(10);
    });
  });
});
