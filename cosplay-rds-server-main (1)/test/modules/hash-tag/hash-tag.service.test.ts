import { HashTagService } from '../../../src/modules/hash-tag/hash-tag.service';
import { firstHashTag } from '../../data';
import { fetchHashTag, generatePageOptionsInput } from '../../helper';
import { prisma } from '../../prisma-instance';

describe('HashTagService', () => {
  let hashTagService: HashTagService;

  beforeAll(() => {
    hashTagService = new HashTagService(prisma);
  });

  describe('createHashTag', () => {
    it('create hashtag.', async () => {
      const hashTag = await hashTagService.createHashTag('hashtag1_test_name');

      expect(hashTag).toHaveProperty('id');
      expect(hashTag).toHaveProperty('name');
    });

    it('throw error duplicated.', async () => {
      await expect(hashTagService.createHashTag('hashtag1_test_name')).rejects.toThrow();
    });
  });

  describe('hashTags', () => {
    it('returns hashTags that have correct properties.', async () => {
      const hashTags = await hashTagService.hashTags('hashtag1_test_name');
      const hashTag = hashTags[0];

      expect(hashTags.length).toBeGreaterThanOrEqual(1);
      expect(hashTag).toHaveProperty('id');
      expect(hashTag).toHaveProperty('name');
      expect(hashTag).toHaveProperty('_count');
    });

    it('with pagingOptions', async () => {
      const pagingOptions = generatePageOptionsInput();
      const hashTags = await hashTagService.hashTags('hashtag1_test_name', pagingOptions);

      expect(hashTags.length).toBeGreaterThanOrEqual(1);
    });

    it('where like.', async () => {
      const hashTags = await hashTagService.hashTags('tag1');

      expect(hashTags.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('hashTagById', () => {
    it('find hash tag by id', async () => {
      const retHashTag = await fetchHashTag(firstHashTag.name);
      const hashTag = await hashTagService.findById(retHashTag?.id ?? 0);
      expect(hashTag.name).toBe(retHashTag?.name);
      expect(hashTag.id).toBe(retHashTag?.id);
      // eslint-disable-next-line
      expect((hashTag as any)?._count).toHaveProperty('posts');
    });

    it('throw error not found hash hash tag by id', async () => {
      await expect(hashTagService.findById(1000)).rejects.toThrow();
    });
  });

  describe('findOrCreate', () => {
    it('creates new hashTag and get hashTags from db', async () => {
      const hashTags = await hashTagService.findOrCreate(['newHashTag', 'hashtag1_test_name']);

      expect(hashTags).toHaveLength(2);
    });
  });
});
