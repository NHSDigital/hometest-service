import {
  type S3Client as AWSS3Client,
  GetObjectCommand,
  type GetObjectCommandOutput,
  ListObjectsCommand,
  type ListObjectsCommandOutput,
  PutObjectCommand,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
  DeleteObjectCommand,
  type DeleteObjectCommandOutput
} from '@aws-sdk/client-s3';
import { type Commons } from '../commons';
import { AWSService } from '../aws-service';

interface IS3Client {
  getBucketObjects: (bucketName: string) => Promise<string[]>;
  deleteObject: (
    bucketName: string,
    objectKey: string
  ) => Promise<DeleteObjectCommandOutput>;
}

export class S3Client extends AWSService<AWSS3Client> implements IS3Client {
  constructor(commons: Commons, client: AWSS3Client) {
    super(commons, 'S3Client', client);
  }

  public async getBucketObjects(
    bucketName: string,
    prefix?: string
  ): Promise<string[]> {
    try {
      this.logger.info('about to fetch list of objects in S3 bucket', {
        bucketName
      });

      const input = {
        Bucket: bucketName,
        Prefix: prefix
      };
      const command = new ListObjectsCommand(input);
      const response: ListObjectsCommandOutput =
        await this.client.send(command);
      if (response.Contents !== undefined && response.Contents.length > 0) {
        return response.Contents.filter((item) => item.Key !== undefined).map(
          (item) => item.Key
        ) as string[];
      }
      return [];
    } catch (error) {
      this.logger.error('could not get list of object in S3 bucket', { error });
      throw error;
    }
  }

  public async getBucketObjectsByPrefix(
    bucketName: string,
    prefix: string
  ): Promise<string[]> {
    try {
      const allObjects = await this.getBucketObjects(bucketName, prefix);
      return allObjects.filter((objectKey) => objectKey.startsWith(prefix));
    } catch (error) {
      this.logger.error('could not filter object in S3 bucket', { error });
      throw error;
    }
  }

  /**
   * Returns JSON object of a JSON file from a bucket. Can't be used for plain text files.
   *
   * @param bucketName
   * @param objectKey
   * @returns JSON content of the file
   */
  public async getObject(bucketName: string, objectKey: string): Promise<any> {
    try {
      this.logger.info('about to fetch object from S3 bucket', {
        bucketName,
        objectKey
      });

      const input = {
        Bucket: bucketName,
        Key: objectKey
      };
      const command = new GetObjectCommand(input);
      const response: GetObjectCommandOutput = await this.client.send(command);

      if (!response.Body) {
        throw new Error('S3 object body is empty or undefined');
      }

      const objectContent = await response.Body.transformToString();

      if (!objectContent || objectContent.trim() === '') {
        throw new Error('S3 object content is empty');
      }

      return JSON.parse(objectContent);
    } catch (error) {
      this.logger.error('could not get object from S3 bucket', {
        bucketName,
        objectKey,
        error
      });
      throw error;
    }
  }

  /**
   * Updates JSON file in a bucket. Only use to update top level properties.
   *
   * @param bucketName
   * @param objectKey
   * @param updates
   * @returns JSON content of the updated file
   */
  public async updateJsonObject(
    bucketName: string,
    objectKey: string,
    updates: Record<string, any>
  ): Promise<any> {
    try {
      this.logger.info('about to update file in S3 bucket', {
        bucketName,
        objectKey,
        updatedKeys: Object.keys(updates)
      });

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      });
      const response: GetObjectCommandOutput = await this.client.send(command);
      const objectContent = Object.assign(
        JSON.parse((await response.Body?.transformToString()) ?? ''),
        updates
      );

      await this.putObject(
        bucketName,
        objectKey,
        JSON.stringify(objectContent)
      );

      return objectContent;
    } catch (error) {
      this.logger.error('could not update object in S3 bucket', {
        bucketName,
        objectKey,
        error
      });
      throw error;
    }
  }

  public async putObject(
    bucketName: string,
    objectKey: string,
    content: string
  ): Promise<PutObjectCommandOutput> {
    try {
      this.logger.info('about to save object to S3 bucket', {
        bucketName,
        objectKey
      });

      const input: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: objectKey,
        Body: content
      };
      const command = new PutObjectCommand(input);
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      this.logger.error('could not save object to S3 bucket', {
        bucketName,
        objectKey,
        error
      });
      throw error;
    }
  }

  public async deleteObject(
    bucketName: string,
    objectKey: string
  ): Promise<DeleteObjectCommandOutput> {
    try {
      this.logger.info('about to delete object from S3 bucket', {
        bucketName,
        objectKey
      });

      const input = {
        Bucket: bucketName,
        Key: objectKey
      };
      const command = new DeleteObjectCommand(input);
      const response = await this.client.send(command);
      this.logger.info('Successfully deleted object from S3 bucket', {
        bucketName,
        objectKey
      });
      return response;
    } catch (error) {
      this.logger.error('could not delete object from S3 bucket', {
        bucketName,
        objectKey,
        error
      });
      throw error;
    }
  }
}
