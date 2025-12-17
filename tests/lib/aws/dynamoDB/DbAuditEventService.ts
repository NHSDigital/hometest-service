import { DynamoDBService } from './DynamoDBService';

export interface detailsItem {
  reasons?: string[];
  page?: string;
  expiryType?: string;
  healthCheckStep?: string;
  writebackType?: string;
  followUp?: string;
  notifyMessageID?: string;
  bloodTestUpdatesMobileEntered?: boolean;
  lsoaVersion?: string;
  imdVersion?: string;
  HbA1cStatus?: string;
  messageType?: string;
  channel?: string;
  urlSource?: string;
  journeySectionsComplete?: string[];
}
export interface AuditEventItem {
  id: string;
  datetime: string;
  eventType?: string;
  nhsNumber?: string;
  nhcVersion?: string;
  odsCode?: string;
  source?: string;
  details?: detailsItem;
  healthCheckId?: string;
  hcDataModelVersion?: string;
  patientId?: string;
}

export default class DbAuditEvent extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-audit-event-db`;
  }

  async getAuditEventById(auditEventId: string): Promise<AuditEventItem> {
    const response = (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'id',
      auditEventId
    )) as AuditEventItem;
    console.log(`Audit Event db item for ID '${auditEventId}'`, { response });
    return response;
  }

  async getAllAuditEventItemsByNhsNumber(
    nhsNumber: string
  ): Promise<AuditEventItem[]> {
    const response = await this.queryItemsByIndex<AuditEventItem>(
      this.getTableName(),
      'nhsNumberIndex',
      'nhsNumber',
      nhsNumber
    );
    return response;
  }

  async getAllAuditEventItemsByNhsNumberAndFilterByDatetime(
    nhsNumber: string,
    filterDate: string
  ): Promise<AuditEventItem[]> {
    return (await this.getAllAuditEventItemsByNhsNumber(nhsNumber)).filter(
      (item) => item.datetime > filterDate
    );
  }

  async getLatestAuditEventItemByNhsNumber(
    nhsNumber: string
  ): Promise<AuditEventItem> {
    const response = (
      await this.getAllAuditEventItemsByNhsNumber(nhsNumber)
    ).reduce(function (prev, current) {
      return prev.datetime > current.datetime ? prev : current;
    });
    console.log(`Latest AuditEvent db items for nhsNumber '${nhsNumber}':`, {
      response
    });
    return response;
  }

  async waitForAnAuditEventItemsByNhsNumber(
    nhsNumber: string,
    expectedEvent: string,
    filterDate: string,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<AuditEventItem | undefined> {
    let attempts = 0;
    let resultEvent: AuditEventItem | undefined;

    while (attempts < maxAttempts) {
      const response =
        await this.getAllAuditEventItemsByNhsNumberAndFilterByDatetime(
          nhsNumber,
          filterDate
        );
      console.log(
        `List of AuditEvent db items for nhsNumber '${nhsNumber}': ${JSON.stringify(response, null, 2)}`
      );

      resultEvent = response.find(
        (element) => element.eventType === expectedEvent
      );
      if (resultEvent) {
        return resultEvent;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log('Max attempts reached: Unable to retrieve AuditEvent db item');
    return undefined;
  }

  /* eslint max-params: 0 */
  async waitForAnAuditEventItemsByNhsNumberAndDetails(
    nhsNumber: string,
    expectedEvent: string,
    expectedDetailHeader: keyof detailsItem,
    expectedDetailValue: string,
    filterDate: string,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<AuditEventItem | undefined> {
    let attempts = 0;
    let resultEvent: AuditEventItem | undefined;

    while (attempts < maxAttempts) {
      const response =
        await this.getAllAuditEventItemsByNhsNumberAndFilterByDatetime(
          nhsNumber,
          filterDate
        );

      resultEvent = response.find(
        (element) =>
          element.eventType === expectedEvent &&
          element.details?.[expectedDetailHeader] === expectedDetailValue
      );
      if (resultEvent) {
        return resultEvent;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log('Max attempts reached: Unable to retrieve AuditEvent db item');
    return undefined;
  }

  async deleteItemById(id: string): Promise<void> {
    await this.deleteItemByPartitionKey(this.getTableName(), 'id', id);
  }

  async deleteItemByNhsNumber(nhsNumber: string): Promise<void> {
    const nhsNumberItems =
      await this.getAllAuditEventItemsByNhsNumber(nhsNumber);
    await Promise.all(
      nhsNumberItems.map(async (item: AuditEventItem) => {
        await this.deleteItemById(item.id);
      })
    );
  }

  async deleteAllAuditEventItems(): Promise<void> {
    const auditEventItemList: AuditEventItem[] = await this.getAllItems(
      this.getTableName()
    );
    await Promise.all(
      auditEventItemList.map(async (item: AuditEventItem) => {
        await this.deleteItemById(item.id);
      })
    );
  }
}
