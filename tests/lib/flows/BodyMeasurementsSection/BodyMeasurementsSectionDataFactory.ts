export interface BodyMeasurementsSectionFlowData {
  heightInCm?: string | null;
  heightInFeet?: string | null;
  heightInInches?: string | null;
  weightInKg?: string | null;
  weightInStones?: string | null;
  weightInPounds?: string | null;
  waistMeasurementInCm?: string | null;
  waistMeasurementInInches?: string | null;
}

export enum BodyMeasurementsSectionDataType {
  HEALTHY_BMI_INCHES_POUNDS = 'HEALTHY_BMI_INCHES_POUNDS',
  HEALTHY_BMI = 'HEALTHY_BMI',
  UNHEALTHY_BMI = 'UNHEALTHY_BMI'
}

export class BodyMeasurementsSectionDataFactory {
  readonly dataType: BodyMeasurementsSectionDataType;

  constructor(dataType: BodyMeasurementsSectionDataType) {
    this.dataType = dataType;
  }

  public getData(): BodyMeasurementsSectionFlowData {
    switch (this.dataType) {
      case BodyMeasurementsSectionDataType.HEALTHY_BMI_INCHES_POUNDS:
        return {
          heightInFeet: '5',
          heightInInches: '3',
          weightInStones: '7',
          weightInPounds: '12',
          waistMeasurementInInches: '31.5'
        };

      case BodyMeasurementsSectionDataType.UNHEALTHY_BMI:
        return {
          heightInCm: '160',
          weightInKg: '100',
          waistMeasurementInCm: '100'
        };

      case BodyMeasurementsSectionDataType.HEALTHY_BMI:
        return {
          heightInCm: '170',
          weightInKg: '55',
          waistMeasurementInCm: '80'
        };

      default:
        throw new Error('Unknown strategy type');
    }
  }
}
