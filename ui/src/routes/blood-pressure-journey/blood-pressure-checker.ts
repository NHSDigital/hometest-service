import {
  BloodPressureLocation,
  type IBloodPressure
} from '@dnhc-health-checks/shared';

export function BloodPressureChecker() {
  function isBloodPressureVeryHigh(
    healthCheckAnswers: IBloodPressure
  ): boolean {
    if (
      healthCheckAnswers.bloodPressureLocation === BloodPressureLocation.Monitor
    ) {
      return (
        healthCheckAnswers.bloodPressureSystolic! >= 170 ||
        healthCheckAnswers.bloodPressureDiastolic! >= 100
      );
    } else {
      // BloodPressureLocation.Pharmacy
      return (
        healthCheckAnswers.bloodPressureSystolic! >= 180 ||
        healthCheckAnswers.bloodPressureDiastolic! >= 120
      );
    }
  }

  function isBloodPressureLow(healthCheckAnswers: IBloodPressure): boolean {
    return (
      healthCheckAnswers.bloodPressureSystolic! < 90 &&
      healthCheckAnswers.bloodPressureDiastolic! < 60
    );
  }

  function isBloodPressureHigh(healthCheckAnswers: IBloodPressure): boolean {
    if (
      healthCheckAnswers.bloodPressureLocation === BloodPressureLocation.Monitor
    ) {
      const firstCondition =
        healthCheckAnswers.bloodPressureSystolic! >= 135 &&
        healthCheckAnswers.bloodPressureSystolic! < 170 &&
        healthCheckAnswers.bloodPressureDiastolic! < 100;
      const secondCondition =
        healthCheckAnswers.bloodPressureSystolic! < 170 &&
        healthCheckAnswers.bloodPressureDiastolic! >= 85 &&
        healthCheckAnswers.bloodPressureDiastolic! < 100;
      return firstCondition || secondCondition;
    } else {
      // BloodPressureLocation.Pharmacy
      const firstCondition =
        healthCheckAnswers.bloodPressureSystolic! >= 140 &&
        healthCheckAnswers.bloodPressureSystolic! < 180 &&
        healthCheckAnswers.bloodPressureDiastolic! < 120;
      const secondCondition =
        healthCheckAnswers.bloodPressureSystolic! < 180 &&
        healthCheckAnswers.bloodPressureDiastolic! >= 90 &&
        healthCheckAnswers.bloodPressureDiastolic! < 120;

      return firstCondition || secondCondition;
    }
  }

  return {
    isBloodPressureVeryHigh,
    isBloodPressureLow,
    isBloodPressureHigh
  };
}

export const bloodPressureChecker = BloodPressureChecker();
