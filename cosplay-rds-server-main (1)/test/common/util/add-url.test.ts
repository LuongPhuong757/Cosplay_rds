import { addUrl, addUrlToTag } from '@common/util/add-url';

describe('addUrl.test', () => {
  describe('addUrl', () => {
    it('return url is added host.', () => {
      const mockData = {
        image: 'image.png',
      };
      const result: string = addUrl(mockData, 'image');

      expect(result).not.toBe('image.png');
    });

    it('not add url if object has host.', () => {
      const mockData = {
        image: 'https://example.com/image.png',
      };
      const result: string = addUrl(mockData, 'image');

      expect(result).toBe('https://example.com/image.png');
    });
  });

  describe('addUrlToTag', () => {
    it('event image has full url.', () => {
      const mockTag = {
        id: 1,
        userId: null,
        eventId: 1,
        event: {
          id: 1,
          name: 'testName',
          title: 'testTitle',
          description: 'testDescription',
          applicationMethod: 'applicationMethod',
          eventDetail: 'eventDetail',
          note: 'note',
          image: 'image.png',
          link: 'testLink',
          isContest: false,
          startDate: new Date(),
          endDate: new Date(),
        },
      };
      const result = addUrlToTag(mockTag);

      expect(result?.event?.image).not.toBe('image.png');
    });
  });
});
