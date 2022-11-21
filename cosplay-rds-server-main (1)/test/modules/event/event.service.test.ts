import { lorem, image, internet } from 'faker';
import { EventRepository } from '../../../src/modules/event/event.repository';
import { EventService } from '../../../src/modules/event/event.service';
import { generatePageOptionsInput, pagingOptions, dayBefore } from '../../helper';
import { prisma } from '../../prisma-instance';

describe('EventService', () => {
  let eventService: EventService;

  const setup = async (isContest = true) => {
    await prisma.event.create({
      data: {
        name: lorem.words(),
        description: lorem.sentences(),
        image: image.imageUrl(),
        link: internet.url(),
        isContest,
        startDate: dayBefore(1),
        endDate: dayBefore(-1),
      },
    });

    await prisma.event.create({
      data: {
        name: lorem.words(),
        description: lorem.sentences(),
        image: image.imageUrl(),
        link: internet.url(),
        isContest,
        startDate: dayBefore(-30),
        endDate: dayBefore(-60),
      },
    });

    await prisma.event.create({
      data: {
        name: lorem.words(),
        description: lorem.sentences(),
        image: image.imageUrl(),
        link: internet.url(),
        isContest,
        startDate: dayBefore(60),
        endDate: dayBefore(30),
      },
    });
  };

  beforeAll(async () => {
    const repository = new EventRepository(prisma);
    eventService = new EventService(repository);
    await setup(true);
    await setup(false);
  });

  describe('currentEvents', () => {
    it('returns current events that have correct properties.', async () => {
      const events = await eventService.currentEvents();
      const event = events[0];
      const { startDate, endDate } = event;

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('name');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('image');
      expect(event).toHaveProperty('link');
      expect(event).toHaveProperty('isContest');
      expect(event).toHaveProperty('startDate');
      expect(event).toHaveProperty('endDate');
      expect(startDate < new Date()).toBe(true);
      expect(endDate > new Date()).toBe(true);
    });

    it('with pagingOptions.', async () => {
      const pagingOptions = generatePageOptionsInput();
      const events = await eventService.currentEvents(pagingOptions);

      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it('isContest true.', async () => {
      const pagingOptions = generatePageOptionsInput();
      const events = await eventService.currentEvents(pagingOptions, true);
      const event = events[0];
      const { isContest } = event;

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(isContest).toBe(true);
    });
  });

  describe('futureEvents', () => {
    it('returns future events.', async () => {
      const events = await eventService.futureEvents();
      const event = events[0];
      const { startDate, endDate } = event;

      expect(startDate > new Date()).toBe(true);
      expect(endDate > new Date()).toBe(true);
    });

    it('with pagingOptions.', async () => {
      const pagingOptions = generatePageOptionsInput();
      const events = await eventService.futureEvents(pagingOptions);

      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pastEvents', () => {
    it('returns past events.', async () => {
      const events = await eventService.pastEvents();
      const event = events[0];
      const { startDate, endDate } = event;

      expect(startDate < new Date()).toBe(true);
      expect(endDate < new Date()).toBe(true);
    });

    it('with pagingOptions.', async () => {
      const pagingOptions = generatePageOptionsInput();
      const events = await eventService.pastEvents(pagingOptions);

      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it('isContest true.', async () => {
      const events = await eventService.pastEvents(pagingOptions, true);
      const event = events[0];
      const { isContest } = event;

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(isContest).toBe(true);
    });
  });
});
