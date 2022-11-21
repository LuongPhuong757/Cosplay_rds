import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';

@Service()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deletedPhotoById(ids: number): Promise<boolean> {
    await this.prisma.photo.delete({
      where: {
        id: ids,
      },
    });

    return true;
  }
}
