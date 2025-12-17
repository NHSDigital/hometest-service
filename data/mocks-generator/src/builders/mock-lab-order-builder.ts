import {
  type IDeliveryAddress,
  type ILabOrder,
  LabTestType,
  Provider
} from '../../../../shared/model/lab-order';
import { MockPatientGroup } from '../mock-patient-group';

export class MockLabOrderBuilder {
  private readonly labOrder: Partial<ILabOrder> = {};

  setId(id: string): this {
    this.labOrder.id = id;
    return this;
  }

  setTestTypes(testTypes: LabTestType[]): this {
    this.labOrder.testTypes = testTypes;
    return this;
  }

  setDeliveryAddress(deliveryAddress: IDeliveryAddress): this {
    this.labOrder.deliveryAddress = deliveryAddress;
    return this;
  }

  setPhoneNumber(phoneNumber: string): this {
    this.labOrder.phoneNumber = phoneNumber;
    return this;
  }

  setHealthCheckId(healthCheckId: string): this {
    this.labOrder.healthCheckId = healthCheckId;
    return this;
  }

  setProvider(provider: Provider): this {
    this.labOrder.provider = provider;
    return this;
  }

  setCreatedAt(createdAt: string): this {
    this.labOrder.createdAt = createdAt;
    return this;
  }

  setFulfilmentOrderId(fulfilmentOrderId?: string): this {
    this.labOrder.fulfilmentOrderId = fulfilmentOrderId;
    return this;
  }

  build(): ILabOrder {
    return this.labOrder as ILabOrder;
  }

  clone(): MockLabOrderBuilder {
    const clone = new MockLabOrderBuilder();
    Object.assign(clone.labOrder, this.labOrder);
    return clone;
  }

  private static basicLabOrder(): MockLabOrderBuilder {
    return new MockLabOrderBuilder()
      .setCreatedAt(new Date().toISOString())
      .setPhoneNumber('07700900000')
      .setProvider(Provider.Thriva)
      .setFulfilmentOrderId(MockPatientGroup.PLACEHOLDER)
      .setDeliveryAddress({
        addressLine1: 'Flat 208',
        addressLine2: '85 Royal Mint Street',
        addressLine3: '',
        townCity: 'London',
        postcode: 'E1 8RD'
      });
  }

  static basicLabOrderNotPlaced(): MockLabOrderBuilder {
    return this.basicLabOrder().setFulfilmentOrderId(undefined);
  }

  static labOrderForCholesterolTest(): MockLabOrderBuilder {
    return this.basicLabOrder().setTestTypes([LabTestType.Cholesterol]);
  }

  static labOrderForBothTests(): MockLabOrderBuilder {
    return this.basicLabOrder().setTestTypes([
      LabTestType.Cholesterol,
      LabTestType.HbA1c
    ]);
  }
}
