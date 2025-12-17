import { Sex } from '@dnhc-health-checks/shared';
import { type HealthCheckDetails } from '../../../src/lib/models/lab-orders/health-check-details';

export class HealthCheckDetailsBuilder {
  private sex: Sex = Sex.Female;

  setSex(sex: Sex): this {
    this.sex = sex;
    return this;
  }

  build(): HealthCheckDetails {
    return {
      sex: this.sex
    };
  }
}
