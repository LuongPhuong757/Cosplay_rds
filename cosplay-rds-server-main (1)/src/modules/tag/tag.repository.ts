import { getBlockIds } from '@common/repository/get-blocking-ids';
import { PagingOptionsQuery, WhereInput } from '@interfaces';
import { Event } from '@modules/event/event.model';
import { User } from '@modules/user/user.model';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Tag } from './tag.model';

@Service()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async fetchTags(
    query: string,
    pagingOptions: PagingOptionsQuery,
    eventNotWhereInput: WhereInput,
  ): Promise<Tag[]> {
    return await this.prisma.tag.findMany({
      ...pagingOptions,
      where: {
        OR: [
          {
            OR: [
              {
                user: {
                  account: {
                    contains: 'c',
                    mode: 'insensitive',
                  },
                },
              },
              {
                user: {
                  name: {
                    contains: 'c',
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
          {
            AND: [
              {
                event: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },

              {
                ...eventNotWhereInput,
              },
            ],
          },
        ],
      },
      include: {
        _count: {
          select: { posts: true },
        },
        user: true,
        event: true,
      },
    });
  }

  async fetchUsersByQuery(
    currentUser: User,
    query: string,
    pagingOptionsQuery: PagingOptionsQuery,
  ): Promise<User[]> {
    const { blockedBy, blocking } = currentUser;
    const blocks = getBlockIds(blockedBy, blocking);

    return await this.prisma.user.findMany({
      ...pagingOptionsQuery,
      where: {
        OR: [
          {
            account: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        AND: {
          id: {
            notIn: blocks,
          },
        },
      },
      include: {
        nftCampaigns: true,
        cOTTipNFTDistributionState: true,
        userPrivate: true,
      },
    });
  }

  async fetchEventsByQuery(
    query: string,
    pagingOptionsQuery: PagingOptionsQuery,
    whereInput: WhereInput,
  ): Promise<Event[]> {
    return await this.prisma.event.findMany({
      ...pagingOptionsQuery,
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive',
        },
        ...whereInput,
      },
    });
  }

  // query条件に関わらず現在のイベントに紐づくタグを取得する
  async getCurrentEventTags(pagingOptionsQuery: PagingOptionsQuery): Promise<Tag[]> {
    const { take } = pagingOptionsQuery;

    return this.prisma.tag.findMany({
      take,
      where: {
        event: {
          startDate: {
            lt: new Date(),
          },
          endDate: {
            gt: new Date(),
          },
        },
      },
      include: {
        _count: {
          select: { posts: true },
        },
        user: true,
        event: true,
      },
    });
  }
}
