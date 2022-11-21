import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Service } from 'typedi';
import { Event } from './event.model';
import { EventRepository } from './event.repository';

@Service()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async currentEvents(pagingOptions?: PagingOptionsInput, isContest?: boolean): Promise<Event[]> {
    const whereInput = {
      startDate: {
        lt: new Date(),
      },
      endDate: {
        gt: new Date(),
      },
      isContest,
    };

    return await this.eventRepository.events(pagingOptions, whereInput);
  }

  async timelineEvents(pagingOptions?: PagingOptionsInput, isContest?: boolean): Promise<Event[]> {
    const eventCurrent = await this.currentEvents(pagingOptions);
    if (eventCurrent.length === 0) {
      const whereInput = {
        startDate: {
          lt: new Date(),
        },
        endDate: {
          gt: new Date(new Date().getTime() - 86400000 * 2),
        },
        isContest,
      };

      return await this.eventRepository.eventsTimeline(pagingOptions, whereInput);
    }

    return eventCurrent;
  }

  async getEventyId(id: number): Promise<Event[]> {
    return await this.eventRepository.eventById(id);
  }

  async futureEvents(pagingOptions?: PagingOptionsInput): Promise<Event[]> {
    const whereInput = {
      startDate: {
        gt: new Date(),
      },
    };

    return await this.eventRepository.events(pagingOptions, whereInput);
  }

  async pastEvents(pagingOptions?: PagingOptionsInput, isContest?: boolean): Promise<Event[]> {
    const whereInput = {
      endDate: {
        lt: new Date(),
      },
      isContest,
    };

    return await this.eventRepository.events(pagingOptions, whereInput);
  }
}
