import {
  BloodPressureLocation,
  type IBloodPressure
} from '@dnhc-health-checks/shared';
import { bloodPressureChecker } from '../../../routes/blood-pressure-journey/blood-pressure-checker';

describe('BloodPressureChecker', () => {
  const healthCheckAnswers: IBloodPressure = {
    bloodPressureLocation: BloodPressureLocation.Monitor,
    bloodPressureSystolic: 175,
    bloodPressureDiastolic: 105,
    lowBloodPressureValuesConfirmed: null,
    highBloodPressureValuesConfirmed: null,
    hasStrongLowBloodPressureSymptoms: null,
    isBloodPressureSectionSubmitted: null
  };
  describe('IsBloodPressureVeryHigh', () => {
    it('should return true for high blood pressure at monitor location', () => {
      const result =
        bloodPressureChecker.isBloodPressureVeryHigh(healthCheckAnswers);
      expect(result).toBe(true);
    });

    it('should return true for high blood pressure at pharmacy location', () => {
      healthCheckAnswers.bloodPressureSystolic = 185;
      healthCheckAnswers.bloodPressureDiastolic = 125;
      healthCheckAnswers.bloodPressureLocation = BloodPressureLocation.Pharmacy;

      const result =
        bloodPressureChecker.isBloodPressureVeryHigh(healthCheckAnswers);
      expect(result).toBe(true);
    });

    it('should return false for normal blood pressure', () => {
      healthCheckAnswers.bloodPressureSystolic = 120;
      healthCheckAnswers.bloodPressureDiastolic = 80;

      const result =
        bloodPressureChecker.isBloodPressureVeryHigh(healthCheckAnswers);
      expect(result).toBe(false);
    });
  });

  describe('IsBloodPressureLow', () => {
    it('should return true for low blood pressure', () => {
      healthCheckAnswers.bloodPressureSystolic = 85;
      healthCheckAnswers.bloodPressureDiastolic = 55;

      const result =
        bloodPressureChecker.isBloodPressureLow(healthCheckAnswers);
      expect(result).toBe(true);
    });

    it('should return false for normal blood pressure', () => {
      healthCheckAnswers.bloodPressureSystolic = 120;
      healthCheckAnswers.bloodPressureDiastolic = 80;

      const result =
        bloodPressureChecker.isBloodPressureLow(healthCheckAnswers);
      expect(result).toBe(false);
    });
  });

  describe('IsBloodPressureHigh', () => {
    it.each([
      [BloodPressureLocation.Monitor, 135, 80, true],
      [BloodPressureLocation.Monitor, 170, 80, false],
      [BloodPressureLocation.Monitor, 170, 85, false],
      [BloodPressureLocation.Monitor, 140, 90, true],
      [BloodPressureLocation.Monitor, 122, 91, true],
      [BloodPressureLocation.Pharmacy, 140, 88, true],
      [BloodPressureLocation.Pharmacy, 180, 88, false],
      [BloodPressureLocation.Pharmacy, 180, 90, false],
      [BloodPressureLocation.Pharmacy, 150, 100, true],
      [BloodPressureLocation.Pharmacy, 122, 91, true]
    ])(
      'should return correct value for given BP',
      (
        bpLocation: BloodPressureLocation,
        bpSystolic: number,
        bpDiastolic: number,
        expectedResult: boolean
      ) => {
        healthCheckAnswers.bloodPressureLocation = bpLocation;
        healthCheckAnswers.bloodPressureSystolic = bpSystolic;
        healthCheckAnswers.bloodPressureDiastolic = bpDiastolic;

        const result =
          bloodPressureChecker.isBloodPressureHigh(healthCheckAnswers);
        expect(result).toBe(expectedResult);
      }
    );
  });
});
