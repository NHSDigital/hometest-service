import { render, screen } from '@testing-library/react';
import { RiskCalculationResults } from '../../../../routes/results/main-results-page/RiskCalculationResults';
import {
  type IHealthCheck,
  type IScores,
  BloodPressureCategory,
  DiabetesCategory,
  DoYouDrinkAlcohol,
  EthnicBackground,
  Sex,
  HdlCholesterolCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
  QRiskCategory
} from '@dnhc-health-checks/shared';

describe('RiskCalculationResults', () => {
  const mockBiometricScores: IScores = {
    cholesterol: {
      overallCategory: OverallCholesterolCategory.Normal,
      totalCholesterol: 4.5,
      totalCholesterolCategory: TotalCholesterolCategory.Normal,
      hdlCholesterol: 1.2,
      hdlCholesterolCategory: HdlCholesterolCategory.Normal,
      totalCholesterolHdlRatio: 3.75,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
    },
    diabetes: {
      category: DiabetesCategory.LowRiskNoBloodTest,
      overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
      hba1c: null
    }
  };

  const mockHealthCheck = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nhsNumber: '9999999999',
    dataModelVersion: '1.0.0',
    createdAt: '2025-08-15T10:00:00Z',
    ageAtStart: 44,
    ageAtCompletion: 45,
    questionnaire: {
      sex: Sex.Male,
      postcode: 'SW1A 1AA',
      ethnicBackground: EthnicBackground.White,
      hasFamilyHeartAttackHistory: null,
      hasFamilyDiabetesHistory: null,
      detailedEthnicGroup: null,
      smoking: null,
      migraines: null,
      isAboutYouSectionSubmitted: true,
      weight: 75,
      height: 175,
      waistMeasurement: null,
      heightDisplayPreference: null,
      weightDisplayPreference: null,
      waistMeasurementDisplayPreference: null,
      isBodyMeasurementsSectionSubmitted: true,
      bloodPressureDiastolic: 80,
      bloodPressureSystolic: 120,
      bloodPressureLocation: null,
      isBloodPressureSectionSubmitted: true,
      isPhysicalActivitySectionSubmitted: true,
      drinkAlcohol: DoYouDrinkAlcohol.Never,
      alcoholHowOften: null,
      alcoholDailyUnits: null,
      alcoholConcernedRelative: null,
      alcoholFailedObligations: null,
      alcoholGuilt: null,
      alcoholMemoryLoss: null,
      alcoholMorningDrink: null,
      alcoholMultipleDrinksOneOccasion: null,
      alcoholPersonInjured: null,
      alcoholCannotStop: null,
      isAlcoholSectionSubmitted: true,
      hasPreExistingCondition: false,
      hasCompletedHealthCheckInLast5Years: false,
      canCompleteHealthCheckOnline: true
    },
    questionnaireScores: {
      activityCategory: 'Active',
      auditCategory: 'Low',
      smokingCategory: 'Non-smoker',
      auditScore: 0,
      inProgressAuditScore: 0,
      bmiClassification: 'Healthy',
      bmiScore: 24.5,
      gppaqScore: 2,
      townsendScore: 0,
      bloodPressureCategory: BloodPressureCategory.Healthy,
      leicesterRiskScore: 7
    },
    riskScores: {
      qRiskScore: 8.5,
      qRiskScoreCategory: QRiskCategory.Moderate,
      heartAge: 48,
      scoreCalculationDate: '2025-08-15T10:00:00Z'
    },
    biometricScores: [
      {
        date: '2025-08-15T10:00:00Z',
        scores: mockBiometricScores
      }
    ]
  } as any as IHealthCheck;

  test('When all scores are available, then displays heart age and risk information', () => {
    render(
      <RiskCalculationResults
        healthCheck={mockHealthCheck}
        biometricScores={mockBiometricScores}
      />
    );

    expect(screen.getByText(/your heart age is/i)).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText(/Your age is:/i)).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/moderate risk/i)).toBeInTheDocument();
    expect(screen.getByText(/8.5%/)).toBeInTheDocument();
    expect(screen.getByText(/what to do next/)).toBeInTheDocument();
  });

  test('When cholesterol test completely fails, then displays appropriate message', () => {
    const failedBiometricScores = {
      ...mockBiometricScores,
      cholesterol: {
        overallCategory: OverallCholesterolCategory.CompleteFailure,
        totalCholesterolFailureReason: 'failure_reason',
        hdlCholesterolFailureReason: 'failure_reason',
        totalCholesterolHdlRatioFailureReason: 'failure_reason'
      }
    } as IScores;

    render(
      <RiskCalculationResults
        healthCheck={mockHealthCheck}
        biometricScores={failedBiometricScores}
      />
    );

    expect(
      screen.getByText(/we could not work out your risk/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/there was an issue processing your blood tests/i)
    ).toBeInTheDocument();
  });

  test('When cholesterol test partially fails, then displays appropriate message', () => {
    const partialFailBiometricScores = {
      ...mockBiometricScores,
      cholesterol: {
        overallCategory: OverallCholesterolCategory.PartialFailure,
        totalCholesterol: 0,
        totalCholesterolCategory: TotalCholesterolCategory.Normal,
        hdlCholesterol: 0,
        hdlCholesterolCategory: HdlCholesterolCategory.Normal,
        totalCholesterolHdlRatio: 0,
        totalCholesterolHdlRatioFailureReason: 'failure_reason'
      }
    } as IScores;

    render(
      <RiskCalculationResults
        healthCheck={mockHealthCheck}
        biometricScores={partialFailBiometricScores}
      />
    );

    expect(
      screen.getByText(/we could not work out your risk/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all your cholesterol results/i)
    ).toBeInTheDocument();
  });

  test('When both cholesterol and diabetes tests fail, then displays combined message', () => {
    const bothFailedBiometricScores = {
      ...mockBiometricScores,
      cholesterol: {
        overallCategory: OverallCholesterolCategory.CompleteFailure,
        totalCholesterolFailureReason: 'failure_reason',
        hdlCholesterolFailureReason: 'failure_reason',
        totalCholesterolHdlRatioFailureReason: 'failure_reason'
      },
      diabetes: {
        overallCategory: OverallDiabetesCategory.CompleteFailure,
        failureReason: 'failure_reason'
      }
    } as IScores;

    render(
      <RiskCalculationResults
        healthCheck={mockHealthCheck}
        biometricScores={bothFailedBiometricScores}
      />
    );

    expect(
      screen.getByText(/we could not work out your risk/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your results for cholesterol and diabetes/i)
    ).toBeInTheDocument();
  });

  test('When cholesterol is returned but diabetes test fails, display no relevant care cards', () => {
    const bothFailedBiometricScores = {
      ...mockBiometricScores,
      diabetes: {
        overallCategory: OverallDiabetesCategory.CompleteFailure,
        failureReason: 'failure_reason'
      }
    } as IScores;

    render(
      <RiskCalculationResults
        healthCheck={mockHealthCheck}
        biometricScores={bothFailedBiometricScores}
      />
    );

    expect(screen.queryByText(/what to do next/i)).not.toBeInTheDocument();
  });

  test('When risk is low, then displays appropriate guidance message', () => {
    const lowRiskHealthCheck = {
      ...mockHealthCheck,
      riskScores: {
        ...mockHealthCheck.riskScores,
        qRiskScoreCategory: QRiskCategory.Low
      }
    } as IHealthCheck;

    render(
      <RiskCalculationResults
        healthCheck={lowRiskHealthCheck}
        biometricScores={mockBiometricScores}
      />
    );

    expect(
      screen.getByText(/you're making good choices for your health/i)
    ).toBeInTheDocument();
  });
});
