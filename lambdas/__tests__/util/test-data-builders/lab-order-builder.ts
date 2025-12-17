import { LabTestType } from '@dnhc-health-checks/shared';
import {
  Provider,
  type IDeliveryAddress,
  type ILabOrder
} from '@dnhc-health-checks/shared/model/lab-order';

export class LabOrderBuilder {
  private id: string = 'order123';
  private healthCheckId: string = 'check123';
  private testTypes: LabTestType[] = [LabTestType.Cholesterol];
  private provider: Provider = Provider.Thriva;
  private deliveryAddress: IDeliveryAddress = {
    addressLine1: '123 Main St',
    addressLine2: 'Apt 1',
    addressLine3: 'Suite 100',
    townCity: 'London',
    postcode: 'SW1A 1AA'
  };

  private phoneNumber?: string = '0799999999';

  private createdAt: string = new Date().toISOString();

  setId(id: string): this {
    this.id = id;
    return this;
  }

  setHealthCheckId(healthCheckId: string): this {
    this.healthCheckId = healthCheckId;
    return this;
  }

  setPhoneNumber(phoneNumber?: string): this {
    this.phoneNumber = phoneNumber;
    return this;
  }

  setTestTypes(testTypes: LabTestType[]): this {
    this.testTypes = testTypes;
    return this;
  }

  setDeliveryAddress(deliveryAddress: IDeliveryAddress): this {
    this.deliveryAddress = deliveryAddress;
    return this;
  }

  setProvider(provider: Provider): this {
    this.provider = provider;
    return this;
  }

  setCreatedAt(createdAt: string): this {
    this.createdAt = createdAt;
    return this;
  }

  build(): ILabOrder {
    return {
      id: this.id,
      healthCheckId: this.healthCheckId,
      testTypes: this.testTypes,
      deliveryAddress: this.deliveryAddress,
      provider: this.provider,
      createdAt: this.createdAt,
      phoneNumber: this.phoneNumber
    };
  }
}
