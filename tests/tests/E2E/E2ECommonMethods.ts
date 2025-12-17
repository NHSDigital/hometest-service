import { expect } from '@playwright/test';
import type { PdmCloudWatchService } from '../../lib/aws/cloudWatch/pdmCloudWatchService';
import type DbAuditEvent from '../../lib/aws/dynamoDB/DbAuditEventService';
import type DbHealthCheckService from '../../lib/aws/dynamoDB/DbHealthCheckService';
import type DbLabOrderService from '../../lib/aws/dynamoDB/DbLabOrderService';
import type DbLabResultService from '../../lib/aws/dynamoDB/DbLabResultService';
import type { BaseTestUser } from '../../lib/users/BaseUser';
import { GpEmailTestHelper } from '../../lib/email/GpEmailTestHelper';
import { type Config } from '../../env/config';
import { patientOdsCodeForThrivaIntegration } from '../../testData/patientTestData';
import type { LabTestType } from '@dnhc-health-checks/shared';
import type { MnsCommunicationLogService } from '../../lib/aws/dynamoDB/DbMnsCommunicationLogService';

// eslint-disable-next-line max-params
export async function cleanupE2EUserData(
  dbLabOrderService: DbLabOrderService,
  dbLabResultService: DbLabResultService,
  dbHealthCheckService: DbHealthCheckService,
  dbAuditEvent: DbAuditEvent,
  dbMnsCommunicationLogService: MnsCommunicationLogService,
  testedUser: BaseTestUser
): Promise<void> {
  console.log(`Cleaning up data for user: ${testedUser.nhsNumber}`);
  const healthCheckId: string = await dbHealthCheckService.getIdByNhsNumber(
    testedUser.nhsNumber
  );
  if (healthCheckId) {
    await dbHealthCheckService.deleteItemById(healthCheckId);
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    const labResults =
      await dbLabResultService.getLabResultByHealthCheckId(healthCheckId);
    for (const labResult of labResults) {
      await dbLabResultService.deleteLabResultItem(
        labResult.orderId,
        labResult.testType
      );
    }
    await dbLabOrderService.deleteLabOrdersByHealthCheckId(healthCheckId);
    await dbMnsCommunicationLogService.deleteItemsByHealthCheckId(
      healthCheckId
    );
  }
}

export async function checkPdmCloudWatchForLogs(
  healthCheckId: string,
  pdmCloudWatchService: PdmCloudWatchService
): Promise<void> {
  const logs =
    await pdmCloudWatchService.waitForSuccessfulPdmLog(healthCheckId);
  expect(
    logs.length,
    `No PDM logs found for healthCheckId: ${healthCheckId}`
  ).toBeGreaterThan(0);
}

export function initializeEmailHelper(
  config: Config,
  nhsNumber: string
): GpEmailTestHelper {
  if (config.integratedEnvironment) {
    return new GpEmailTestHelper(nhsNumber, patientOdsCodeForThrivaIntegration);
  } else {
    return new GpEmailTestHelper(nhsNumber);
  }
}

export async function checkLabResultsTypeAndPendingReorderStatus(
  dbLabResultService: DbLabResultService,
  healthCheckId: string,
  labTestType: LabTestType,
  pendingReorder: boolean,
  maxAttempts: number = 6
): Promise<void> {
  const labResult =
    await dbLabResultService.waitForLabResultsTypeWithPendingReorderStatus(
      healthCheckId,
      labTestType,
      pendingReorder,
      maxAttempts
    );
  expect(
    labResult,
    `${labTestType} LabResults with pendingReorder: ${pendingReorder} for healthCheck ${healthCheckId} test type were not found`
  ).toBeTruthy();
}
