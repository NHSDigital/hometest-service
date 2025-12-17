import { type Config, ConfigFactory } from './env/config';
import DbAuditEvent from './lib/aws/dynamoDB/DbAuditEventService';
import DbCommunicationLogService from './lib/aws/dynamoDB/DbCommunicationLogService';
import DbGpUpdateSchedulerService from './lib/aws/dynamoDB/DbGpUpdateSchedulerService';
import DbHealthCheckService from './lib/aws/dynamoDB/DbHealthCheckService';
import DbLabOrderService from './lib/aws/dynamoDB/DbLabOrderService';
import DbLabResultService from './lib/aws/dynamoDB/DbLabResultService';
import { MnsCommunicationLogService } from './lib/aws/dynamoDB/DbMnsCommunicationLogService';
import DbOdsCodeService from './lib/aws/dynamoDB/DbOdsCode';
import { ParameterStoreService } from './lib/aws/parameterStore/ParameterStoreService';
import S3Service from './lib/aws/S3Service';
import { CredentialsHelper } from './lib/CredentialsHelper';

const config: Config = ConfigFactory.getConfig();
const s3Client = new S3Service(config.name);

async function cleanEnvAfterTests(): Promise<void> {
  console.log(
    `Global Teardown: cleaning S3 files in buckets created after ${process.env.GLOBAL_START_TIME}`
  );

  // Return email notifications to GP to default value
  if (config.verifyEmails) {
    await new ParameterStoreService().updateEmailToGp(
      config.gpEmailFlagDefaultValue ? true : false
    );
  }

  // Return HC Expiry Notification to default value
  if (config.autoExpiryEnabled) {
    await new ParameterStoreService().updateHCExpiryNotification(
      config.hcExpiryNotificationFlagDefaultValue ? true : false
    );
  }

  const emisResultsBucketWithFolders = {
    bucketName: 'emis-request-payload-bucket',
    folders: ['FileRecord/', 'IncompleteFileRecord/']
  };
  await new CredentialsHelper().cleanupMtlsCertificates();

  const reportingBucketWithFolders = {
    bucketName: 'reporting-data',
    folders: ['audit-events/', 'health-checks/', 'ods-mapping/']
  };

  const bucketList =
    config.reportingEnabled === true
      ? [emisResultsBucketWithFolders, reportingBucketWithFolders]
      : [emisResultsBucketWithFolders];

  for (const bucketData of bucketList) {
    for (const folder of bucketData.folders) {
      console.log(
        `Cleaning S3 bucket: ${bucketData.bucketName}, folder: ${folder}`
      );
      await s3Client.deleteObjectsFilteredByDate(
        bucketData.bucketName,
        process.env.GLOBAL_START_TIME as unknown as string,
        folder
      );
    }
  }

  const dbGpUpdateSchedulerService = new DbGpUpdateSchedulerService(
    config.name
  );
  await dbGpUpdateSchedulerService.deleteAllGpUpdateSchedulerItems();
  await new MnsCommunicationLogService(config.name).deleteAllItems();

  if (config.bulkCleanupEnabled === true) {
    console.log(
      `Global Teardown: cleaning DynamoDB test data created during tests`
    );
    // Delete empty health check items
    const dbHealthCheckService = new DbHealthCheckService(config.name);
    await dbHealthCheckService.deleteEmptyHealthCheckItems();

    //Delete test Ods codes created during tests
    const dbOdsCodeService = new DbOdsCodeService(config.name);
    await dbOdsCodeService.cleanUpOdsCodeItems();

    // Delete lab orders created during tests
    const dbLabOrderService = new DbLabOrderService(config.name);
    await dbLabOrderService.cleanLabOrdersTableAfterTestsRun();

    // Delete Lab results created during tests
    const dbLabResultService = new DbLabResultService(config.name);
    await dbLabResultService.cleanLabResultsTableAfterTestsRun();

    // Delete all audit events created during tests
    const dbAuditEventService = new DbAuditEvent(config.name);
    await dbAuditEventService.deleteAllAuditEventItems();

    // Delete communication log items created during tests
    const dbCommunicationLogService = new DbCommunicationLogService(
      config.name
    );
    await dbCommunicationLogService.deleteAllCommunicationLogItems();
  }
}

export default cleanEnvAfterTests;
