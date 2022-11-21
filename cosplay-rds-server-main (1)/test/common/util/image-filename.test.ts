import { generateHashedFilename, getFileNameExtension } from '@common/util/image-filename';

describe('image-filename', () => {
  describe('generateHashedFilename', () => {
    it('get hashedname', () => {
      const res = generateHashedFilename('test.png');

      expect(res).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3.png');
    });

    it('get filename only', () => {
      const res = generateHashedFilename('test');

      expect(res).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
    });
  });

  describe('getFileNameExtension', () => {
    it('get file exntension', () => {
      const ext = getFileNameExtension('test.png');

      expect(ext).toBe('png');
    });

    it('throw error becase invalid extension', () => {
      expect(() => {
        getFileNameExtension('test');
      }).toThrow();
    });
  });
});
