import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { postNotIsBanQuery } from '@common/repository/not-is-ban-query';
import { PagingOptionsQuery, WhereInput } from '@interfaces';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Post } from './post.model';

@Service()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(postId: number, userId?: number): Promise<Post | null> {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        ...postNotIsBanQuery,
      },
      include: {
        user: {
          include: {
            membership: {
              select: {
                stripePriceId: true,
              },
            },
            nftCampaigns: true,
            cOTTipNFTDistributionState: true,
          },
        },
        hashtags: true,
        photos: true,
        tags: {
          include: {
            user: true,
            event: true,
          },
        },
        comments: {
          where: {
            superchatId: {
              not: null,
            },
          },
          include: {
            user: true,
            superChat: {
              include: {
                user: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: { favs: true, comments: true },
        },
        favs: {
          where: {
            userId,
          },
        },
      },
    });
    if (post) (post as Post).isFav = userId ? post.favs.length !== 0 : false;

    return post;
  }

  async fetchTimeline(
    pagingOptionsQuery?: PagingOptionsQuery,
    whereInput?: WhereInput,
  ): Promise<Post[]> {
    return await this.prisma.post.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          created: 'desc',
        },
      ],
      where: {
        ...postNotIsBanQuery,
        ...whereInput,
      },
      include: {
        user: {
          include: {
            membership: {
              select: {
                stripePriceId: true,
              },
            },
            nftCampaigns: true,
            cOTTipNFTDistributionState: true,
          },
        },
        hashtags: true,
        photos: true,
        tags: {
          include: {
            user: true,
            event: true,
          },
        },
        comments: {
          where: {
            superchatId: {
              not: null,
            },
          },
          include: {
            user: true,
            superChat: {
              include: {
                user: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: { favs: true, comments: true },
        },
      },
    });
  }

  async fetchPortfolios(userId: number, pagingOptions?: PagingOptionsInput): Promise<Post[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    const tag = await this.prisma.tag.findFirst({
      where: {
        userId,
      },
      include: {
        ...pagingOptionsQuery,
        posts: {
          include: {
            user: {
              include: {
                membership: {
                  select: {
                    stripePriceId: true,
                  },
                },
              },
            },
            photos: {
              select: {
                id: true,
                image: true,
                postId: true,
              },
            },
          },
        },
      },
    });
    if (!tag) {
      return [];
    }

    return tag.posts;
  }

  async timelineCounts(whereInput?: WhereInput): Promise<number> {
    return await this.prisma.post.count({
      where: {
        ...whereInput,
      },
    });
  }
}
