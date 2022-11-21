import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Resolver, Query, Arg, Int } from 'type-graphql';
import { Service } from 'typedi';
import { EventResponse } from './dto/response/event';
import { Event } from './event.model';
import { EventService } from './event.service';

@Service()
@Resolver((of) => EventResponse)
export class EventResolver {
  constructor(private readonly eventService: EventService) {}

  @Query((returns) => [EventResponse], {
    description: '開催中のイベント一覧を取得する。',
  })
  async getEventById(@Arg('eventId', (type) => Int) eventId: number): Promise<Event[]> {
    return await this.eventService.getEventyId(eventId);
  }

  @Query((returns) => [EventResponse], {
    description: '開催中のイベント一覧を取得する。',
  })
  async currentEvents(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Event[]> {
    return await this.eventService.currentEvents(pagingOptions);
  }

  @Query((returns) => [EventResponse], {
    description: '開催中のイベント一覧を取得する。',
  })
  async timelineEvents(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Event[]> {
    return await this.eventService.timelineEvents(pagingOptions);
  }

  @Query((returns) => [EventResponse], { description: '開催予定のイベント一覧を取得する。' })
  async futureEvents(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Event[]> {
    return await this.eventService.futureEvents(pagingOptions);
  }

  @Query((returns) => [EventResponse], { description: '終了のイベント一覧を取得する。' })
  async pastEvents(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Event[]> {
    return await this.eventService.pastEvents(pagingOptions);
  }

  @Query((returns) => [EventResponse], {
    description: '開催中のコンテストの一覧を取得する。',
  })
  async currentContests(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Event[]> {
    return await this.eventService.currentEvents(pagingOptions, true);
  }

  @Query((returns) => [EventResponse], {
    description: '過去のコンテストの一覧の取得を取得する。',
  })
  async pastContests(
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Event[]> {
    return await this.eventService.pastEvents(pagingOptions, true);
  }
}
