import { fetchFirstTestUser } from '../../helper';
import { tagService } from '../../service-instance';

describe('TagService', () => {
  describe('tags', () => {
    it('returns tags', async () => {
      const tags = await tagService.tags('user1_account');
      expect(tags.length).toBeGreaterThanOrEqual(1);

      const currentEventTag = tags[0];
      expect(currentEventTag).toHaveProperty('id');
      expect(currentEventTag).toHaveProperty('eventId');

      const { event } = currentEventTag;
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('isContest');

      const tag = tags[1];
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('userId');

      const { user } = tag;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('account');
    });

    it('with pagingOptions', async () => {
      const tags = await tagService.tags('user1_account', { limit: 10, offset: 1 });

      expect(tags.length).toBeGreaterThanOrEqual(1);

      const tag = tags[0];
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('userId');

      const { user } = tag;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('account');
    });

    it('where like', async () => {
      const tags = await tagService.tags('user1_');

      expect(tags.length).toBeGreaterThanOrEqual(1);

      const tagEvent = tags[0];

      expect(tagEvent).toHaveProperty('id');
      expect(tagEvent).toHaveProperty('eventId');

      const { event } = tagEvent;

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('name');

      const tagUser = tags[1];

      expect(tagUser).toHaveProperty('id');
      expect(tagUser).toHaveProperty('userId');

      const { user } = tagUser;

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('account');
    });

    it('returns tags realted to event', async () => {
      const tags = await tagService.tags('user1_event_name');

      expect(tags.length).toBeGreaterThanOrEqual(1);

      const tag = tags[0];

      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('userId');
      expect(tag).toHaveProperty('eventId');

      const { event } = tag;

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('name');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('isContest');
      expect(event).toHaveProperty('startDate');
      expect(event).toHaveProperty('endDate');
    });

    it('both users and events', async () => {
      const tags = await tagService.tags('user1');

      expect(tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findTagById', () => {
    it('returns tag byId', async () => {
      const tags = await tagService.tags('user1');
      const tag = tags[0];

      const result = await tagService.findTagById(tag.id);

      expect(result.id).toBe(tag.id);
    });
  });

  describe('tagSerachForPost', () => {
    it('case incentiveSearch', async () => {
      const user = await fetchFirstTestUser();
      const lowercaseResponse = await tagService.tagsSearchForPost(user, 'user');
      const uppercaseResponse = await tagService.tagsSearchForPost(user, 'User');

      expect(lowercaseResponse.users.length).toBeGreaterThanOrEqual(3);
      expect(lowercaseResponse).toStrictEqual(uppercaseResponse);
    });
  });

  describe('findOrCreate', () => {
    it('create', async () => {
      const user = await fetchFirstTestUser();
      const tagUserIds: number[] = [user.id];
      const tagEventIds: number[] = [];
      const tags = await tagService.findOrCreate({ tagUserIds, tagEventIds });

      expect(tags).toHaveLength(1);
    });
  });
});
