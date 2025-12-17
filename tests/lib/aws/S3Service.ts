import {
  S3Client,
  ListObjectsCommand,
  DeleteObjectCommand,
  type ListObjectsOutput,
  GetObjectCommand,
  type GetObjectOutput,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { StsService } from './StsService';
import { type Readable } from 'stream';
import { text } from 'node:stream/consumers';

export interface S3ObjectData {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: string;
  StorageClass: string;
  Owner: { ID: string };
}

export default class S3Service {
  s3client: S3Client;
  envName: string;
  readonly stsService: StsService;
  private readonly isSharedBucket: boolean;

  constructor(evnName: string, isSharedBucket: boolean = false) {
    this.s3client = new S3Client({ region: 'eu-west-2' });
    this.envName = evnName;
    this.stsService = new StsService();
    this.isSharedBucket = isSharedBucket;
  }

  private async pause(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async getS3BucketPrefix(): Promise<string> {
    const accountId = (await this.stsService.getAccountId()) ?? '';
    if (this.isSharedBucket) {
      return `${accountId}-`;
    }
    return `${accountId}-${this.envName}-nhc-`;
  }

  public async getS3BucketObjectList(
    bucketName: string,
    prefix?: string
  ): Promise<ListObjectsOutput> {
    let command;
    if (prefix) {
      command = new ListObjectsCommand({
        Bucket: `${await this.getS3BucketPrefix()}${bucketName}`,
        Prefix: prefix
      });
    } else {
      command = new ListObjectsCommand({
        Bucket: `${await this.getS3BucketPrefix()}${bucketName}`
      });
    }
    return await this.s3client.send(command);
  }

  async getS3BucketObjectsFilterByDatetime(
    bucketName: string,
    filterDate: string,
    folderName?: string
  ): Promise<S3ObjectData[]> {
    const s3BucketObjectList = await this.getS3BucketObjectList(
      bucketName,
      folderName
    );
    return (s3BucketObjectList.Contents?.filter(
      (item) =>
        item.LastModified !== undefined &&
        item.LastModified?.toISOString() > filterDate
    ) ?? []) as unknown as S3ObjectData[];
  }

  public async deleteObjectInS3Bucket(
    bucketName: string,
    objectKey: string
  ): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: `${await this.getS3BucketPrefix()}${bucketName}`,
      Key: objectKey
    });
    await this.s3client.send(deleteCommand);
  }

  public async deleteObjectsFilteredByDate(
    bucketName: string,
    filterDate: string,
    folderName?: string
  ): Promise<void> {
    for (const s3Object of await this.getS3BucketObjectsFilterByDatetime(
      bucketName,
      filterDate,
      folderName
    )) {
      await this.deleteObjectInS3Bucket(bucketName, s3Object.Key);
    }
  }

  async waitForAnObjectByKeyName(
    bucketName: string,
    keyName: string,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        await this.getS3ObjectDetails(bucketName, keyName);
        console.log(`File ${keyName} was found in the ${bucketName} S3 bucket`);
        return true;
      } catch (error) {
        console.log(
          `File ${keyName} doesn't exist in the ${bucketName} S3 bucket yet.`,
          error
        );
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }
    console.log(
      'Max attempts reached: Unable to retrieve data from S3 bucket.'
    );
    return false;
  }

  async getS3ObjectDetails(
    bucketName: string,
    keyName: string
  ): Promise<GetObjectOutput> {
    const getObjectCommand = new GetObjectCommand({
      Bucket: `${await this.getS3BucketPrefix()}${bucketName}`,
      Key: keyName
    });
    return await this.s3client.send(getObjectCommand);
  }

  async waitForAnObjectUpdate(
    bucketName: string,
    keyName: string,
    lastModified: string,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    let attempts = 0;
    const dateToCompare = new Date(lastModified);

    while (attempts < maxAttempts) {
      const isObjectUpdated = await this.getS3ObjectDetails(
        bucketName,
        keyName
      );
      console.log(
        `Check if LastModified date ${isObjectUpdated?.LastModified?.toString()} for the S3Object ${keyName} is newer than ${lastModified.toString()}`
      );
      if ((isObjectUpdated?.LastModified as unknown as Date) > dateToCompare)
        return true;

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }
    console.log('Max attempts reached: S3 object was not modified.');
    return false;
  }

  async waitForFileContaining(
    bucketName: string,
    keyName: string,
    searchedString: string,
    maxAttempts: number = 10,
    delayMs: number = 5000
  ): Promise<boolean> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const healthCheckS3KeyDetails = await this.getS3ObjectDetails(
        bucketName,
        keyName
      );
      const payload = healthCheckS3KeyDetails.Body;
      const payloadContents = await text(payload as Readable);
      console.log(payloadContents);
      console.log(
        `Check if ${keyName} S3Object contains '${searchedString}' in the body.`
      );
      if (payloadContents.includes(searchedString)) return true;

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }
    console.log('Max attempts reached: S3 object was not modified.');
    return false;
  }

  /* eslint max-params: 0 */
  async waitForFileByPartialKeyName(
    bucketName: string,
    folderName: string,
    partialKeyName: string,
    filterDate: string,
    maxAttempts: number = 10,
    delayMs: number = 5000
  ): Promise<S3ObjectData | undefined> {
    let attempts = 0;
    let resultS3: S3ObjectData | undefined;

    while (attempts < maxAttempts) {
      const healthCheckS3FileList =
        await this.getS3BucketObjectsFilterByDatetime(
          bucketName,
          filterDate,
          folderName
        );
      resultS3 = healthCheckS3FileList.find((element) =>
        element.Key.includes(partialKeyName)
      );
      if (resultS3) {
        console.log(
          `File matches the partial name was found : ${resultS3.Key}`
        );
        return resultS3;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }
    console.log('Max attempts reached: S3 object was not modified.');
    return undefined;
  }

  public async uploadDataToTheBucket(
    fileContent: string,
    bucketName: string,
    targetDirectory: string,
    fileName: string
  ): Promise<void> {
    const uploadParams = {
      Bucket: `${await this.getS3BucketPrefix()}${bucketName}`,
      Key: `${targetDirectory}/${fileName}`,
      Body: fileContent
    };

    try {
      await this.s3client.send(new PutObjectCommand(uploadParams));
      console.log(
        `File ${targetDirectory}/${fileName} uploaded to ${uploadParams.Bucket} S3 Bucket successfully`
      );
    } catch (err) {
      throw new Error(
        `Error while uploading data to S3 Bucket: ${String(err)}`
      );
    }
  }
}
