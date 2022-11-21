import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { WhereInput } from '@interfaces';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Event } from './event.model';

@Service()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async eventById(id: number): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        id: id,
      },
      include: {
        tag: true,
      },
    });
  }

  async events(pagingOptions?: PagingOptionsInput, whereInput?: WhereInput): Promise<Event[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.event.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          startDate: 'desc',
        },
      ],
      where: {
        ...whereInput,
      },
      include: {
        tag: true,
      },
    });
  }

  async eventsTimeline(
    pagingOptions?: PagingOptionsInput,
    whereInput?: WhereInput,
  ): Promise<Event[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.prisma.event.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          startDate: 'asc',
        },
      ],
      where: {
        ...whereInput,
      },
      include: {
        tag: true,
      },
    });
  }
}
