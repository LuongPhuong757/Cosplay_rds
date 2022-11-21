import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { HashTag, HashTagTrending } from './hash-tag.model';

@Service()
export class HashTagService {
  constructor(private readonly prisma: PrismaService) {}

  async hashTags(query: string, pagingOptions?: PagingOptionsInput): Promise<HashTag[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.hashTag.findMany({
      ...pagingOptionsQuery,
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  async hashTagsTrending(pagingOptions?: PagingOptionsInput): Promise<HashTagTrending[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.$queryRaw<
      HashTagTrending[]
    >`SELECT "hashTag".*, COUNT("hashTag"."id") as "totalPosts" FROM "public"."_HashTagToPost" as "hashTagToPost"
      join "public"."HashTag" as "hashTag" on "hashTagToPost"."A" = "hashTag"."id"
      GROUP BY "hashTag"."id"
      ORDER BY COUNT("hashTag"."id") desc
       limit ${pagingOptionsQuery.take} offset ${pagingOptionsQuery.skip}`;
  }

  async findById(id: number): Promise<HashTag> {
    const hashTag = await this.prisma.hashTag.findFirst({
      where: {
        id,
      },
      include: {
        posts: false,
        _count: {
          select: { posts: true },
        },
      },
    });
    if (!hashTag) throw Error(`hash tag id ${id} is not found.`);

    return hashTag;
  }

  async createHashTag(name: string): Promise<HashTag> {
    try {
      return await this.prisma.hashTag.create({
        data: {
          name,
        },
      });
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`hashtag cannot be created. message: ${message} name: ${name}`);
    }
  }

  async findOrCreate(findOrCreateInput: string[]): Promise<HashTag[]> {
    const hashTags = await Promise.all(
      findOrCreateInput.map(async (input) => {
        const hashTag = await this.findHashTagByName(input);
        if (hashTag) return hashTag;

        return await this.createHashTag(input);
      }),
    );

    return hashTags;
  }

  private async findHashTagByName(name: string): Promise<HashTag | null> {
    return await this.prisma.hashTag.findFirst({
      where: {
        name,
      },
    });
  }
}
