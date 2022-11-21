import 'reflect-metadata';
import { S3Provider } from '../../src/providers/s3.provider';
import { generatorService } from '../service-instance';

type MockCalles<T> = T[];

describe('FileUploaderService', () => {
  const s3Provider = new S3Provider(generatorService);

  const setup = () => {
    const mockedFunctions = {
      getSignedUrl: jest.fn().mockReturnValue([]),
      deleteObject: jest
        .fn()
        .mockImplementation(() => ({ promise: () => mockedFunctions.mockCommon })),
      getSignedUrlPromise: jest
        .fn()
        .mockImplementation(() => ({ promise: () => mockedFunctions.mockCommon })),
      createMultipartUpload: jest
        .fn()
        .mockImplementation(() => ({ promise: () => ({ UploadId: 'returnUploadId' }) })),
      completeMultipartUpload: jest
        .fn()
        .mockImplementation(() => ({ promise: () => mockedFunctions.mockCommon })),
      mockThrow: jest.fn().mockImplementation(() => {
        throw new Error('error');
      }),
      mockCommon: jest.fn().mockImplementation(() => true),
    };
    s3Provider._s3.getSignedUrl = mockedFunctions.getSignedUrl;
    s3Provider._s3.deleteObject = mockedFunctions.deleteObject;
    s3Provider._s3.getSignedUrlPromise = mockedFunctions.getSignedUrlPromise;
    s3Provider._s3.createMultipartUpload = mockedFunctions.createMultipartUpload;
    s3Provider._s3.completeMultipartUpload = mockedFunctions.completeMultipartUpload;

    return mockedFunctions;
  };

  describe('getImageSignedUrl', () => {
    it('upload file.', () => {
      const { getSignedUrl } = setup();
      const userId = 1000;
      const fileTypeObject = { contentType: 'image/png' };
      s3Provider.getImageSignedUrl(userId, fileTypeObject);
      const calls = getSignedUrl.mock.calls as MockCalles<MockCalles<{ Key: string }>>;
      const arg = calls[0][1];

      expect(getSignedUrl).toBeCalled();
      expect(arg?.Key.includes('.png')).toBe(true);
    });

    it('generate different filename.', () => {
      const { getSignedUrl } = setup();
      const userId = 1000;
      const fileTypeObject = { contentType: 'image/png' };
      s3Provider.getImageSignedUrl(userId, fileTypeObject);
      s3Provider.getImageSignedUrl(userId, fileTypeObject);

      const calls = getSignedUrl.mock.calls as MockCalles<MockCalles<{ Key: string }>>;
      const arg1 = calls[0][1];
      const arg2 = calls[1][1];

      expect(arg1.Key).not.toEqual(arg2.Key);
    });

    it('invalid contentType.', () => {
      const userId = 1000;
      const fileTypeObject = { contentType: 'text/html' };

      expect(() => {
        s3Provider.getImageSignedUrl(userId, fileTypeObject);
      }).toThrow(Error);
    });
  });

  describe('getMultipartSignedUrls', () => {
    it('got mutiparts.', async () => {
      const { getSignedUrlPromise, createMultipartUpload } = setup();
      const userId = 1000;
      const getMultipartSignedUrlsArg = { contentType: 'video/mp4', partNumbers: 1 };

      await s3Provider.getMultipartSignedUrls(userId, getMultipartSignedUrlsArg);

      expect(getSignedUrlPromise).toBeCalled();
      expect(createMultipartUpload).toBeCalled();
    });

    it('invalid contentType.', async () => {
      const userId = 1000;
      const getMultipartSignedUrlsArg = { contentType: 'text/html', partNumbers: 1 };

      await expect(
        s3Provider.getMultipartSignedUrls(userId, getMultipartSignedUrlsArg),
      ).rejects.toThrow();
    });
  });

  describe('completeMultiupload', () => {
    it('complete.', async () => {
      const { completeMultipartUpload } = setup();
      const uploadId = 'testUploadId';
      const uploadedFilename = 'testUploadedFilename';
      const multiparts = [
        {
          ETag: 'testEtag',
          PartNumber: 1,
        },
      ];
      await s3Provider.completeMultiupload(uploadId, uploadedFilename, multiparts);

      expect(completeMultipartUpload).toBeCalled();
    });
  });

  xdescribe('deleteFile', () => {
    it('deleted file.', () => {
      const { deleteObject } = setup();
      const filename = 'test.png';
      s3Provider.deleteFile(filename);

      expect(deleteObject).toBeCalled();
    });

    it('throw error.', () => {
      const { mockThrow, mockCommon } = setup();
      s3Provider._s3.deleteObject = mockThrow;
      const filename = 'test.png';
      s3Provider.deleteFile(filename);

      expect(mockCommon).not.toBeCalled();
    });
  });
});
