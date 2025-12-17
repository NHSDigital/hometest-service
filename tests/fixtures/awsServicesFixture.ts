import { test as base } from '@playwright/test';
import { type Config, ConfigFactory } from '../env/config';
import DbHealthCheckService from '../lib/aws/dynamoDB/DbHealthCheckService';
import DbAuditEvent from '../lib/aws/dynamoDB/DbAuditEventService';
import DbDeadLetterMessagesService from '../lib/aws/dynamoDB/DbDeadLetterMessages';
import DbGpUpdateSchedulerService from '../lib/aws/dynamoDB/DbGpUpdateSchedulerService';
import DbLabOrderService from '../lib/aws/dynamoDB/DbLabOrderService';
import DbLabResultService from '../lib/aws/dynamoDB/DbLabResultService';
import DbOdsCodeService from '../lib/aws/dynamoDB/DbOdsCode';
import DbPatientService from '../lib/aws/dynamoDB/DbPatientService';
import DbSessionService from '../lib/aws/dynamoDB/DbSessionService';
import DbTownsendScoreService from '../lib/aws/dynamoDB/DbTownsendScoreService';
import { DynamoDBServiceUtils } from '../lib/aws/dynamoDB/DynamoDBServiceUtils';
import { LambdaService } from '../lib/aws/lambda/LambdaService';
import S3Service from '../lib/aws/S3Service';
import { EventBridgeService } from '../lib/aws/EventBridgeService';
import { StsService } from '../lib/aws/StsService';
import { UpdatePatientRecordQueueClientService } from '../lib/aws/sqs/updatePatientRecordQueueClientService';
import { CommunicationsQueueClientService } from '../lib/aws/sqs/communicationsQueueClientServce';
import DbPostcodeLsoaService from '../lib/aws/dynamoDB/DbPostcodeLsoaService';
import DbLsoaImdService from '../lib/aws/dynamoDB/DbLsoaImdService';
import { ExpiryLambdaService } from '../lib/aws/lambda/ExpiryLambdaService';
import { NhcGpUpdateScheduleProcessorLambdaService } from '../lib/aws/lambda/NhcGpUpdateScheduleProcessorLambdaService';
import DbCommunicationLogService from '../lib/aws/dynamoDB/DbCommunicationLogService';
import { PdmCloudWatchService } from '../lib/aws/cloudWatch/pdmCloudWatchService';
import { NhcIdentifyNudgesLambdaService } from '../lib/aws/lambda/NhcIdentifyNudgesLambdaService';
import { ParameterStoreService } from '../lib/aws/parameterStore/ParameterStoreService';
import { NudgeCloudWatchService } from '../lib/aws/cloudWatch/nudgeCloudWatchService';
import { MnsCommunicationLogService } from '../lib/aws/dynamoDB/DbMnsCommunicationLogService';
import { MnsOutboundQueueSQSService } from '../lib/aws/sqs/MnsOutboundQueueSQSService';
import { PdmIntegrationSQSService } from '../lib/aws/sqs/PdmIntegrationSQSService';
import { LabOrderSQSService } from '../lib/aws/sqs/LabOrderSQSService';

const config: Config = ConfigFactory.getConfig();

export interface AwsFixtures {
  dbHealthCheckService: DbHealthCheckService;
  dbAuditEvent: DbAuditEvent;
  dbDeadLetterMessagesService: DbDeadLetterMessagesService;
  dbGpUpdateSchedulerService: DbGpUpdateSchedulerService;
  dbLabOrderService: DbLabOrderService;
  dbLabResultService: DbLabResultService;
  dbOdsCodeService: DbOdsCodeService;
  dbPatientService: DbPatientService;
  dbSessionService: DbSessionService;
  dbTownsendScoreService: DbTownsendScoreService;
  dbMnsCommunicationLogService: MnsCommunicationLogService;
  dynamoDBServiceUtils: DynamoDBServiceUtils;
  dbPostcodeLsoaService: DbPostcodeLsoaService;
  dbLsoaImdService: DbLsoaImdService;
  dbCommunicationLogService: DbCommunicationLogService;
  lambdaService: LambdaService;
  expiryLambdaService: ExpiryLambdaService;
  nhcGpUpdateScheduleProcessorLambdaService: NhcGpUpdateScheduleProcessorLambdaService;
  nhcIdentifyNudgesLambdaService: NhcIdentifyNudgesLambdaService;
  s3Client: S3Service;
  eventBridgeService: EventBridgeService;
  stsService: StsService;
  updatePatientRecordQueueClientService: UpdatePatientRecordQueueClientService;
  communicationsQueueClientService: CommunicationsQueueClientService;
  mnsOutboundQueueSQSService: MnsOutboundQueueSQSService;
  pdmIntegrationQueueClientService: PdmIntegrationSQSService;
  labOrderSQSService: LabOrderSQSService;
  pdmCloudWatchService: PdmCloudWatchService;
  nudgeCloudWatchService: NudgeCloudWatchService;
  parameterStoreService: ParameterStoreService;
}

export const awsServicesFixture = base.extend<AwsFixtures>({
  // DynamoDB
  dbHealthCheckService: async ({}, use) => {
    await use(new DbHealthCheckService(config.name));
  },
  dbAuditEvent: async ({}, use) => {
    await use(new DbAuditEvent(config.name));
  },
  dbDeadLetterMessagesService: async ({}, use) => {
    await use(new DbDeadLetterMessagesService(config.name));
  },
  dbGpUpdateSchedulerService: async ({}, use) => {
    await use(new DbGpUpdateSchedulerService(config.name));
  },
  dbLabOrderService: async ({}, use) => {
    await use(new DbLabOrderService(config.name));
  },
  dbLabResultService: async ({}, use) => {
    await use(new DbLabResultService(config.name));
  },
  dbOdsCodeService: async ({}, use) => {
    await use(new DbOdsCodeService(config.name));
  },
  dbPatientService: async ({}, use) => {
    await use(new DbPatientService(config.name));
  },
  dbSessionService: async ({}, use) => {
    await use(new DbSessionService(config.name));
  },
  dbTownsendScoreService: async ({}, use) => {
    await use(new DbTownsendScoreService(config.name));
  },
  dynamoDBServiceUtils: async ({}, use) => {
    await use(new DynamoDBServiceUtils(config));
  },
  dbPostcodeLsoaService: async ({}, use) => {
    await use(new DbPostcodeLsoaService(config.name));
  },
  dbLsoaImdService: async ({}, use) => {
    await use(new DbLsoaImdService(config.name));
  },
  dbCommunicationLogService: async ({}, use) => {
    await use(new DbCommunicationLogService(config.name));
  },
  dbMnsCommunicationLogService: async ({}, use) => {
    await use(new MnsCommunicationLogService(config.name));
  },
  // Lambda
  lambdaService: async ({}, use) => {
    await use(new LambdaService(config.name));
  },
  expiryLambdaService: async ({}, use) => {
    await use(new ExpiryLambdaService(config.name));
  },
  nhcGpUpdateScheduleProcessorLambdaService: async ({}, use) => {
    await use(new NhcGpUpdateScheduleProcessorLambdaService(config.name));
  },
  nhcIdentifyNudgesLambdaService: async ({}, use) => {
    await use(new NhcIdentifyNudgesLambdaService(config.name));
  },
  // S3
  s3Client: async ({}, use) => {
    await use(new S3Service(config.name));
  },
  // EventBridgeService
  eventBridgeService: async ({}, use) => {
    await use(new EventBridgeService(config.name));
  },
  // Sts Service
  stsService: async ({}, use) => {
    await use(new StsService());
  },
  mnsOutboundQueueSQSService: async ({}, use) => {
    await use(new MnsOutboundQueueSQSService(config.name));
  },
  labOrderSQSService: async ({}, use) => {
    await use(new LabOrderSQSService(config.name));
  },
  // SQS Services
  pdmIntegrationQueueClientService: async ({}, use) => {
    await use(new PdmIntegrationSQSService(config.name));
  },
  communicationsQueueClientService: async ({}, use) => {
    await use(new CommunicationsQueueClientService(config.name));
  },
  updatePatientRecordQueueClientService: async ({}, use) => {
    await use(new UpdatePatientRecordQueueClientService(config.name));
  },
  // CloudWatch Service
  pdmCloudWatchService: async ({}, use) => {
    await use(new PdmCloudWatchService());
  },
  nudgeCloudWatchService: async ({}, use) => {
    await use(new NudgeCloudWatchService());
  },
  // Parameter Store Service
  parameterStoreService: async ({}, use) => {
    await use(new ParameterStoreService());
  }
});
