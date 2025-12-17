import { test, expect } from '../../fixtures/commonFixture';
import type { S3ObjectData } from '../../lib/aws/S3Service';
import { getOdsCodeData, type OdsItem } from '../../testData/odsCodeData';
import { autoLoadOdsCodeTestData } from '../../testData/odsCodeUploadTestData';

let odsProcessedFileObject: S3ObjectData | undefined;
let testStartDate: string;

const autoDbDataLoadBucket = 'auto-db-data-load-bucket';
const autoDbLoadOdsCodeFolder = 'input/nhc-ods-code-db';

autoLoadOdsCodeTestData().forEach(
  ({
    odsCodesPayload,
    odsCodeFileNameSuffix,
    dbOdsTableCheck,
    dbOdsTableCleanup,
    processedFolderDestination,
    testDescription
  }) => {
    test.describe('Auto loading Ods Code integration test', () => {
      test.beforeEach(async ({ dbOdsCodeService }) => {
        if (dbOdsTableCleanup) {
          await Promise.all(
            odsCodesPayload.inserts.map(async (item: OdsItem) => {
              await dbOdsCodeService.deleteGpOdsCodeItem(item.gpOdsCode);
            })
          );
        } else {
          await dbOdsCodeService.createGpOdsCodeItem(
            getOdsCodeData({
              gpOdsCode: odsCodesPayload.inserts[0].gpOdsCode
            })
          );
        }
      });

      test.afterEach(async ({ s3Client, dbOdsCodeService }) => {
        await Promise.all(
          odsCodesPayload.inserts.map(async (item: OdsItem) => {
            await dbOdsCodeService.deleteGpOdsCodeItem(item.gpOdsCode);
          })
        );
        await s3Client.deleteObjectInS3Bucket(
          autoDbDataLoadBucket,
          odsProcessedFileObject?.Key as string
        );
      });

      test(
        `ODS Code upload - ${testDescription}`,
        {
          tag: ['@ui', '@integration', '@odsCode']
        },
        async ({ s3Client, dbOdsCodeService }) => {
          testStartDate = new Date().toISOString();

          await test.step(`Upload the Ods Code JSON file into the auto-db-data-load-bucket`, async () => {
            await s3Client.uploadDataToTheBucket(
              JSON.stringify(odsCodesPayload),
              autoDbDataLoadBucket,
              autoDbLoadOdsCodeFolder,
              `${odsCodeFileNameSuffix}.json`
            );
          });

          await test.step(`Check if file was processed into correct folder in the bucket`, async () => {
            odsProcessedFileObject = await s3Client.waitForFileByPartialKeyName(
              autoDbDataLoadBucket,
              `${processedFolderDestination}/nhc-ods-code-db/`,
              odsCodeFileNameSuffix,
              testStartDate
            );

            expect(odsProcessedFileObject).toBeDefined();
          });

          if (dbOdsTableCheck) {
            await test.step(`Check if all ODS Codes were added or updated in the DB`, async () => {
              await Promise.all(
                odsCodesPayload.inserts.map(async (item: OdsItem) => {
                  const dbOdsCodeItem =
                    await dbOdsCodeService.getGpOdsItemByOdsCOde(
                      item.gpOdsCode
                    );

                  expect(dbOdsCodeItem.gpOdsCode).toEqual(item.gpOdsCode);
                  expect(dbOdsCodeItem.gpOdsCode).toEqual(item.gpOdsCode);
                  expect(dbOdsCodeItem.gpEmail).toEqual(item.gpEmail);
                  expect(dbOdsCodeItem.gpName).toEqual(item.gpName);
                  if (dbOdsCodeItem.enabled === undefined) {
                    expect(item.enabled).toEqual(false);
                  }
                  expect(dbOdsCodeItem.localAuthority).toEqual(
                    item.localAuthority
                  );
                })
              );
            });
          }
        }
      );
    });
  }
);
