import { DynamoDBService } from './DynamoDBService';
import _ from 'lodash';
import type {
  ILabResult,
  ILabResultData,
  LabTestType
} from '@dnhc-health-checks/shared';

export default class DbLabResultService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-lab-result-db`;
  }

  async deleteLabResultItemsByHealthCheckId(
    healthCheckId: string
  ): Promise<void> {
    const labResultsItems: ILabResult[] =
      await this.getLabResultByHealthCheckId(healthCheckId);
    for (let i = 0; i < labResultsItems.length; i++) {
      console.log(
        `Removing lab result time with order id: ${labResultsItems[i].orderId} and type: ${labResultsItems[i].testType}`
      );
      await this.deleteLabResultItem(
        labResultsItems[i].orderId,
        labResultsItems[i].testType
      );
    }
  }

  async deleteLabResultItem(orderId: string, testType: string): Promise<void> {
    await this.deleteItemByPartitionAndSortKey(
      this.getTableName(),
      'orderId',
      orderId,
      'testType',
      testType
    );
  }

  async getLabResultByOrderIdAndType(
    orderId: string,
    testType: string
  ): Promise<ILabResult> {
    return (await this.getJsonItemByPartitionAndSortKey(
      this.getTableName(),
      'orderId',
      orderId,
      'testType',
      testType
    )) as ILabResult;
  }

  async getLabResultByHealthCheckId(
    healthCheckId: string
  ): Promise<ILabResult[]> {
    return await this.queryItemsByIndex(
      this.getTableName(),
      'healthCheckIdIndex',
      'healthCheckId',
      healthCheckId
    );
  }

  async waitForLabResultsHbA1cToBeStoredInLabResultTable(
    healthCheckId: string,
    expectedlabResultItemCholesterol: ILabResultData[],
    expectedlabResultItemHbA1c: ILabResultData[] | null,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const labResultItem =
        await this.getLabResultByHealthCheckId(healthCheckId);
      labResultItem.forEach((item, index) => {
        console.log(
          `labResultItem[${index}].resultData '${healthCheckId}': `,
          item.resultData
        );
      });
      if (expectedlabResultItemHbA1c) {
        const hasHbA1c = expectedlabResultItemHbA1c.every((expected) =>
          labResultItem.some((item) =>
            (item.resultData ?? []).some((data) => _.isMatch(data, expected))
          )
        );

        const hasCholesterol = expectedlabResultItemCholesterol.every(
          (expected) =>
            labResultItem.some((item) =>
              (item.resultData ?? []).some((data) => _.isMatch(data, expected))
            )
        );
        if (hasHbA1c && hasCholesterol) {
          return true;
        }
      } else {
        const hasCholesterol = expectedlabResultItemCholesterol.every(
          (expected) =>
            labResultItem.some((item) =>
              (item.resultData ?? []).some((data) => _.isMatch(data, expected))
            )
        );
        if (hasCholesterol) {
          return true;
        }
      }
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: No match found for expected labResultItem'
    );
    return false;
  }

  /* eslint max-params: 0 */
  async waitForLabResultsDateOrderIdAndReferenceToBeStoredInLabResultTable(
    healthCheckId: string,
    expectedOrderId: string,
    expectedResultDate: string,
    expectedFulfilmentOrderId: string,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const labResultItem =
        await this.getLabResultByHealthCheckId(healthCheckId);

      const hasExpectedOrderId = labResultItem.some(
        (item) => item.orderId === expectedOrderId
      );
      const hasExpectedResultDate = labResultItem.some(
        (item) => item.resultDate === expectedResultDate
      );
      const hasExpectedFulfilmentOrderId = labResultItem.some(
        (item) => item.fulfilmentOrderId === expectedFulfilmentOrderId
      );
      if (
        hasExpectedResultDate &&
        hasExpectedOrderId &&
        hasExpectedFulfilmentOrderId
      ) {
        console.log('Match found');
        return true;
      }
      if (attempts < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    console.log(
      'Max attempts reached: No match found for expected labResultItem'
    );
    return false;
  }

  async waitForLabResultsTypeWithPendingReorderStatus(
    healthCheckId: string,
    expectedLabTestType: LabTestType,
    expectedPendingReorder: boolean,
    maxAttempts: number = 6,
    delayMs: number = 5000
  ): Promise<boolean> {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const labResultItem =
        await this.getLabResultByHealthCheckId(healthCheckId);

      const hasExpectedPendingReorder = labResultItem.some(
        (item) => item.pendingReorder === expectedPendingReorder
      );

      const hasExpectedLabTestType = labResultItem.some((item) =>
        item.testType.startsWith(expectedLabTestType)
      );

      if (hasExpectedPendingReorder && hasExpectedLabTestType) {
        console.log(
          `LabResult item with ${expectedLabTestType} type and pendingReorder: ${expectedPendingReorder}found for healthCheckId: ${healthCheckId}`
        );
        return true;
      }
      if (attempts < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    console.log(
      'Max attempts reached: No match found for expected labResultItem'
    );
    return false;
  }

  async getLabResultByPatientId(patientId: string): Promise<ILabResult[]> {
    return await this.queryItemsByIndex(
      this.getTableName(),
      'patientIdIndex',
      'patientId',
      patientId
    );
  }

  async createLabResult(patient: ILabResult): Promise<void> {
    await this.putItem(this.getTableName(), patient);
    console.log('Lab result db item created');
  }

  async cleanLabResultsTableAfterTestsRun(): Promise<void> {
    const labResultsList: ILabResult[] = await this.getAllItems(
      this.getTableName()
    );
    await Promise.all(
      labResultsList
        .filter((labResult: ILabResult) => !labResult.orderId.startsWith('lo-'))
        .map(async (labResult: ILabResult) => {
          await this.deleteLabResultItem(labResult.orderId, labResult.testType);
        })
    );
  }
}
