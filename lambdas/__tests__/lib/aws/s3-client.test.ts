import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import { S3Client } from '../../../src/lib/aws/s3-client';
import {
  S3Client as AWSS3Client,
  type PutObjectCommandOutput,
  type GetObjectCommandOutput,
  type ListObjectsCommandOutput,
  type DeleteObjectCommandOutput
} from '@aws-sdk/client-s3';

describe('S3Client tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let awsS3ClientStub: Sinon.SinonStubbedInstance<AWSS3Client>;
  let service: S3Client;
  const serviceClassName = 'S3Client';
  const bucketName = 'testBucket';

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    awsS3ClientStub = sandbox.createStubInstance(AWSS3Client);

    service = new S3Client(
      commonsStub as unknown as Commons,
      awsS3ClientStub as unknown as AWSS3Client
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  test('should call setUpTracing for AWS client', () => {
    sandbox.assert.calledOnceWithExactly(
      commonsStub.setUpTracing,
      awsS3ClientStub
    );
  });

  describe('getBucketObjects tests', () => {
    test('when multiple files present should return array of files in the s3 buckets', async () => {
      const clientResponse: ListObjectsCommandOutput = {
        Contents: [{ Key: 'file1' }, { Key: 'file2' }, { Key: 'file3' }]
      } as unknown as ListObjectsCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);

      const bucketFiles = await service.getBucketObjects(bucketName);

      expect(awsS3ClientStub.send.calledOnce).toBeTruthy();
      expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
        Bucket: bucketName
      });

      expect(bucketFiles).toMatchObject(['file1', 'file2', 'file3']);
    });

    test('when undefined key returned should ignore the entry', async () => {
      const clientResponse: ListObjectsCommandOutput = {
        Contents: [{ Key: 'file1' }, { Key: undefined }, { Key: 'file3' }]
      } as unknown as ListObjectsCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);

      const bucketFiles = await service.getBucketObjects(bucketName);

      expect(bucketFiles).toMatchObject(['file1', 'file3']);
    });

    test.each([undefined, []])(
      'when no files present should return empty list',
      async () => {
        const clientResponse: ListObjectsCommandOutput = {
          Contents: []
        } as unknown as ListObjectsCommandOutput;

        awsS3ClientStub.send.resolves(clientResponse);

        const bucketFiles = await service.getBucketObjects(bucketName);

        expect(bucketFiles).toMatchObject([]);
      }
    );

    test('when error is thrown should log the error and re-throw', async () => {
      const exception = new Error('Test error');
      awsS3ClientStub.send.throwsException(exception);

      await expect(service.getBucketObjects(bucketName)).rejects.toThrow(
        exception
      );

      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not get list of object in S3 bucket'
      );
    });
  });

  describe('getObject tests', () => {
    const fileKey = 'testFile';
    test('when JSON file with content requested should return file JSON body', async () => {
      const fileContentJson = { testProp: 'testValue' };
      const clientResponse: GetObjectCommandOutput = {
        Body: {
          transformToString: () => {
            return JSON.stringify(fileContentJson);
          }
        }
      } as unknown as GetObjectCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);
      const returnedContent = await service.getObject(bucketName, fileKey);

      expect(awsS3ClientStub.send.calledOnce).toBeTruthy();
      expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
        Bucket: bucketName,
        Key: fileKey
      });

      expect(returnedContent).toMatchObject(fileContentJson);
    });

    test('when object body is undefined should throw an error', async () => {
      const clientResponse: GetObjectCommandOutput = {
        Body: undefined
      } as unknown as GetObjectCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);

      await expect(service.getObject(bucketName, fileKey)).rejects.toThrow(
        'S3 object body is empty or undefined'
      );

      expect(awsS3ClientStub.send.calledOnce).toBeTruthy();
      expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
        Bucket: bucketName,
        Key: fileKey
      });
    });

    test('when object body is empty string/whitespace only should throw an error', async () => {
      const clientResponse: GetObjectCommandOutput = {
        Body: {
          transformToString: async () => '   '
        }
      } as unknown as GetObjectCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);

      await expect(service.getObject(bucketName, fileKey)).rejects.toThrow(
        'S3 object content is empty'
      );

      expect(awsS3ClientStub.send.calledOnce).toBeTruthy();
      expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
        Bucket: bucketName,
        Key: fileKey
      });
    });

    test('when error is thrown should log the error and re-throw', async () => {
      const exception = new Error('Test error');
      awsS3ClientStub.send.throwsException(exception);

      await expect(service.getObject(bucketName, fileKey)).rejects.toThrow(
        exception
      );

      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not get object from S3 bucket'
      );
    });
  });

  describe('putObject tests', () => {
    const fileKey = 'testFile';
    const content = '<tag1>Hello</tag1>';
    test('should save the object and return output from s3 command', async () => {
      const clientResponse: PutObjectCommandOutput = {
        VersionId: 1
      } as unknown as PutObjectCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);
      const returnedContent = await service.putObject(
        bucketName,
        fileKey,
        content
      );

      expect(awsS3ClientStub.send.calledOnce).toBeTruthy();
      expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
        Bucket: bucketName,
        Key: fileKey,
        Body: content
      });

      expect(returnedContent).toMatchObject(clientResponse);
    });

    test('when error is thrown should log the error and re-throw', async () => {
      const exception = new Error('Test error');
      awsS3ClientStub.send.throwsException(exception);

      await expect(
        service.putObject(bucketName, fileKey, content)
      ).rejects.toThrow(exception);

      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not save object to S3 bucket'
      );
    });
  });

  describe('updateJsonObject tests', () => {
    const fileKey = 'testFile';
    const content = { propertyToUpdate: 'updatedValue' };
    const fileToUpdate = {
      propertyToUpdate: 'valueToUpdate',
      other: 'property'
    };

    beforeEach(() => {
      const clientResponse: GetObjectCommandOutput = {
        Body: {
          transformToString: () => {
            return JSON.stringify(fileToUpdate);
          }
        }
      } as unknown as GetObjectCommandOutput;
      awsS3ClientStub.send.onFirstCall().resolves(clientResponse);
    });

    test.each([
      [
        { propertyToUpdate: 'updatedValue' },
        {
          propertyToUpdate: 'updatedValue',
          other: 'property'
        }
      ],
      [
        {},
        {
          propertyToUpdate: 'valueToUpdate',
          other: 'property'
        }
      ],
      [
        { propertyToUpdate: 'updatedValue', propertyToAdd: 123 },
        {
          propertyToUpdate: 'updatedValue',
          other: 'property',
          propertyToAdd: 123
        }
      ]
    ])(
      'should update the object with specified property and return the updated file with %s',
      async (updateProperties, expectedFile) => {
        const clientResponse: PutObjectCommandOutput = {
          VersionId: 1
        } as unknown as PutObjectCommandOutput;

        awsS3ClientStub.send.onSecondCall().resolves(clientResponse);
        const returnedContent = await service.updateJsonObject(
          bucketName,
          fileKey,
          updateProperties
        );

        expect(awsS3ClientStub.send.calledTwice).toBeTruthy();
        expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
          Bucket: bucketName,
          Key: fileKey
        });
        expect(awsS3ClientStub.send.getCall(1).args[0].input).toMatchObject({
          Bucket: bucketName,
          Key: fileKey,
          Body: JSON.stringify(expectedFile)
        });

        expect(returnedContent).toMatchObject(expectedFile);
      }
    );

    test('when error is thrown should log the error and re-throw', async () => {
      const exception = new Error('Test error');
      awsS3ClientStub.send.throwsException(exception);

      await expect(
        service.updateJsonObject(bucketName, fileKey, content)
      ).rejects.toThrow(exception);

      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not update object in S3 bucket'
      );
    });
  });

  describe('deleteObject tests', () => {
    const fileKey = 'testFileToDelete';
    test('should call delete command and return output', async () => {
      const clientResponse: DeleteObjectCommandOutput = {
        DeleteMarker: true,
        VersionId: 'v1'
      } as unknown as DeleteObjectCommandOutput;

      awsS3ClientStub.send.resolves(clientResponse);
      const returnedContent = await service.deleteObject(bucketName, fileKey);

      expect(awsS3ClientStub.send.calledOnce).toBeTruthy();
      expect(awsS3ClientStub.send.getCall(0).args[0].input).toMatchObject({
        Bucket: bucketName,
        Key: fileKey
      });

      expect(returnedContent).toMatchObject(clientResponse);
      sandbox.assert.calledWith(
        commonsStub.logInfo,
        Sinon.match.string, // serviceClassName
        'Successfully deleted object from S3 bucket'
      );
    });

    test('when error is thrown should log the error and re-throw', async () => {
      const exception = new Error('Test delete error');
      awsS3ClientStub.send.throwsException(exception);

      await expect(service.deleteObject(bucketName, fileKey)).rejects.toThrow(
        exception
      );

      sandbox.assert.calledWith(
        commonsStub.logError,
        serviceClassName,
        'could not delete object from S3 bucket'
      );
    });
  });
});
