import { Prisma } from '@prisma/client';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { UserHasNFT } from './user-has-nft.model';

@Service()
export class UserHasNftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.UserHasNFTFindManyArgs): Promise<UserHasNFT[]> {
    return await this.prisma.userHasNFT.findMany(args);
  }

  async findFirst(args: Prisma.UserHasNFTFindFirstArgs): Promise<UserHasNFT | null> {
    return await this.prisma.userHasNFT.findFirst(args);
  }

  async create(args: Prisma.UserHasNFTCreateArgs): Promise<UserHasNFT> {
    return await this.prisma.userHasNFT.create(args);
  }

  async update(args: Prisma.UserHasNFTUpdateArgs): Promise<UserHasNFT> {
    return await this.prisma.userHasNFT.update(args);
  }

  async createOrUpdate({
    findArgs,
    createArgs,
    updateInput,
  }: {
    findArgs: Prisma.UserHasNFTFindFirstArgs;
    createArgs: Prisma.UserHasNFTCreateArgs;
    updateInput: Prisma.XOR<Prisma.UserHasNFTUpdateInput, Prisma.UserHasNFTUncheckedUpdateInput>;
  }): Promise<UserHasNFT> {
    const userHasNft = await this.findFirst(findArgs);
    if (userHasNft) {
      return await this.update({ where: { id: userHasNft.id }, data: updateInput });
    }

    return await this.create(createArgs);
  }
}
