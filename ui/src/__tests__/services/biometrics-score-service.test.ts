import {
  OverallDiabetesCategory,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { getLatestBiometricScores } from '../../services/biometrics-score-service';

const mockBiometricScoresArray = [
  {
    date: '2025-02-11T08:41:24.256Z',
    scores: { diabetes: { category: OverallDiabetesCategory.AtRisk } }
  },
  {
    date: '2025-02-15T08:41:24.256Z',
    scores: { diabetes: { category: OverallDiabetesCategory.High } }
  },
  {
    date: '2025-01-15T08:41:24.256Z',
    scores: { diabetes: { category: OverallDiabetesCategory.Low } }
  }
];

const mockHealthCheckArray: IHealthCheck = {
  biometricScores: mockBiometricScoresArray
} as any;

describe('getLatestBiometricScores', () => {
  it('should return the latest biometric score', () => {
    const result = getLatestBiometricScores(mockHealthCheckArray);
    expect(result).toEqual(mockBiometricScoresArray[1].scores);
  });

  it('should throw an error on empty biometric scores array', () => {
    expect(() =>
      getLatestBiometricScores({ ...mockHealthCheckArray, biometricScores: [] })
    ).toThrow('Invalid biometrics data');
  });

  it("should return the first biometric score if there's only one biometric score", () => {
    const result = getLatestBiometricScores({
      ...mockHealthCheckArray,
      biometricScores: [(mockHealthCheckArray.biometricScores as any)[0]]
    });
    expect(result).toEqual(mockBiometricScoresArray[0].scores);
  });
});
