import { DynamoDBService } from './DynamoDBService';

export interface LabOrderItem {
  id: string;
  healthCheckId: string;
  testTypes: string[];
  deliveryAddress?: {
    addressLine1: string;
    addressLine2?: string;
    addressLine3?: string;
    postcode: string;
    townCity?: string;
  };
  fulfilmentOrderId?: string;
  createdAt?: string;
  phoneNumber?: string;
}

export default class DbLabOrderService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-order-db`;
  }

  async deleteLabOrderItem(id: string): Promise<void> {
    await this.deleteItemByPartitionKey(this.getTableName(), 'id', id);
  }

  async getLabOrderById(id: string): Promise<LabOrderItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'id',
      id
    )) as LabOrderItem;
  }

  async getLabOrderByHealthCheckId(
    healthCheckId: string
  ): Promise<LabOrderItem[]> {
    return await this.queryItemsByIndex(
      this.getTableName(),
      'healthCheckIdIndex',
      'healthCheckId',
      healthCheckId
    );
  }

  async createLabOrder(patient: LabOrderItem): Promise<void> {
    await this.putItem(this.getTableName(), patient);
    console.log('Lab order db item created');
  }

  async deleteLabOrdersByHealthCheckId(healthCheckId: string): Promise<void> {
    const labOrders = await this.getLabOrderByHealthCheckId(healthCheckId);
    for (const labOrder of labOrders) {
      await this.deleteLabOrderItem(labOrder.id);
    }
  }

  async cleanLabOrdersTableAfterTestsRun(): Promise<void> {
    const labOrdersList: LabOrderItem[] = await this.getAllItems(
      this.getTableName()
    );
    await Promise.all(
      labOrdersList
        .filter((labOrder: LabOrderItem) => !labOrder.id.startsWith('lo-'))
        .map(async (labOrder: LabOrderItem) => {
          await this.deleteLabOrderItem(labOrder.id);
        })
    );
  }
}
