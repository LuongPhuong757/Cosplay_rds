import config from '@config';
import { Aws } from '@core/aws';
import { GetMultipartSignedUrlsArg } from '@modules/post/dto/arg/get-multipart-signed-urls';
import { GeneratorService } from '@services/generator.service';
import { AWSError } from 'aws-sdk';
import { Service } from 'typedi';

const { imageBucket } = config.aws;
const { signedUrlExpires } = config.file;

const OPERATION_PUT_OBJECT = 'putObject';
const OPERATION_UPLOAD_PART = 'uploadPart';

@Service()
export class S3Provider {
  readonly _s3: Aws.S3;
  private _allowedFileExtensions: string[] = ['image/jpeg', 'image/png', 'image/gif'];
  private _allowedVideoExtensions: string[] = ['video/mp4', 'video/quicktime']; // video/quicktime = mov
  static _videoExntesions: string[] = ['mp4', 'mov'];
  static _membershipOnlyImageUrl = 'icn_cnt_movie.png';

  constructor(private readonly generatorService: GeneratorService) {
    this._s3 = new Aws.S3({
      apiVersion: '2006-03-01',
      signatureVersion: 'v4',
    });
  }

  getImageSignedUrl(
    userId: number,
    { contentType }: { contentType: string },
  ): { signedUrl: string; filename: string } {
    const ext = this.getFileExtension(contentType);
    const generatedFilename = this.generateFilename(userId, ext);

    const signedUrlParams = {
      Bucket: imageBucket,
      Key: generatedFilename,
      ContentType: contentType,
      Expires: signedUrlExpires,
    };
    try {
      const signedUrl = this._s3.getSignedUrl(OPERATION_PUT_OBJECT, signedUrlParams);

      return {
        signedUrl,
        filename: generatedFilename,
      };
    } catch (e) {
      const { message } = <AWSError>e;
      console.error(message);

      throw Error(`cannot get signed url for file uploading from s3. message: ${message}.`);
    }
  }

  async getMultipartSignedUrls(
    userId: number,
    getMultipartSignedUrlsArg: GetMultipartSignedUrlsArg,
  ): Promise<{
    uploadId: string;
    filename: string;
    multiparts: { partNumber: number; signedUrl: string }[];
  }> {
    const { partNumbers, contentType } = getMultipartSignedUrlsArg;
    const ext = this.getFileExtension(contentType, false);
    const generatedFilename = this.generateFilename(userId, ext);

    try {
      const uploadParams = {
        Bucket: imageBucket,
        Key: generatedFilename,
        ContentType: contentType,
      };
      const UploadId = await this.getMultipartUploadId(uploadParams);

      const multipartsParams = {
        Bucket: imageBucket,
        Key: generatedFilename,
        UploadId,
      };
      const multiparts = await this.getMultiparts(multipartsParams, partNumbers);

      return {
        uploadId: UploadId,
        filename: generatedFilename,
        multiparts,
      };
    } catch (e) {
      const { message } = <AWSError>e;
      console.error(message);

      throw Error(`canot get presigned url for video uploading from s3. message: ${message}.`);
    }
  }

  async completeMultiupload(
    uploadId: string,
    uploadedFilename: string,
    multiparts: { ETag: string; PartNumber: number }[],
  ): Promise<void> {
    const params = {
      Bucket: imageBucket,
      Key: uploadedFilename,
      UploadId: uploadId,
      MultipartUpload: { Parts: multiparts },
    };

    try {
      await this._s3.completeMultipartUpload(params).promise();
    } catch (e) {
      const { message } = <AWSError>e;
      console.error(message);

      throw Error(`cannot complete multi upload to s3. message: ${message}.`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const deleteParams = { Bucket: imageBucket, Key: filename };
    try {
      await this._s3.deleteObject(deleteParams).promise();
    } catch (e) {
      const { message } = <AWSError>e;
      console.error(message);

      throw Error(`fail to delete file on s3. ${message}`);
    }
  }

  async deleteFiles(filenames: string[]): Promise<void> {
    const Objects = filenames.map((filename) => ({ Key: filename }));
    const deleteParams = { Bucket: imageBucket, Delete: { Objects } };
    try {
      await this._s3.deleteObjects(deleteParams).promise();
    } catch (e) {
      const { message } = <AWSError>e;
      console.error(message);

      throw Error(`cannot delete files on s3. message: ${message}.`);
    }
  }

  private generateFilename = (userId: number, ext: string): string => {
    const randomStr = this.generatorService.getRandomString();
    const timestamp = new Date().getTime();

    return `${userId}_${randomStr}_${timestamp}.${ext}`;
  };

  private getFileExtension = (contentType: string, isImage = true): string => {
    const allowdExtentions = isImage
      ? [...this._allowedFileExtensions]
      : [...this._allowedVideoExtensions];
    const index = allowdExtentions.indexOf(contentType);
    if (index === -1) {
      throw new Error('file type is invalid.');
    }
    const splitted = contentType.split('/');
    const popped = splitted.pop();
    if (!popped) {
      throw Error('filename is invalid.');
    }

    return popped;
  };

  private async getMultipartUploadId(params: Aws.S3.CreateMultipartUploadRequest): Promise<string> {
    const res = await this._s3.createMultipartUpload(params).promise();
    const { UploadId } = res;

    if (!UploadId) {
      throw new Error(`not found UploadId. parmas: ${JSON.stringify(params)}.`);
    }

    return UploadId;
  }

  private async getMultiparts(
    params: { Bucket: string; Key: string; UploadId: string },
    partNumbers: number,
  ): Promise<{ signedUrl: string; partNumber: number }[]> {
    const promises = [];
    for (let index = 0; index < partNumbers; index++) {
      promises.push(
        this._s3.getSignedUrlPromise(OPERATION_UPLOAD_PART, {
          ...params,
          PartNumber: index + 1,
        }),
      );
    }

    const res: string[] = await Promise.all(promises);

    return res.map((signedUrl: string, index: number) => ({
      signedUrl,
      partNumber: index + 1,
    }));
  }
}
