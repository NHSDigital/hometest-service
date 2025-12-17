import { type IHealthCheck, type ILabResult } from '@dnhc-health-checks/shared';
import type { ILabOrder } from '@dnhc-health-checks/shared/model/lab-order';

export interface IMockHealthCheck extends IHealthCheck {
  labOrders: ILabOrder[];
  labResults: ILabResult[];
}
