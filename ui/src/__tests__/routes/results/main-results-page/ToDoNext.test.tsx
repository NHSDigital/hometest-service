/* eslint-disable jest/expect-expect */
import { render, screen } from '@testing-library/react';
import {
  type IHealthCheck,
  BmiClassification,
  BloodPressureCategory,
  BloodPressureLocation,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  QRiskCategory
} from '@dnhc-health-checks/shared';
import * as biometricScoreService from '../../../../services/biometrics-score-service';
import { ToDoNextFullResults } from '../../../../routes/results/main-results-page/ToDoNext';

// Mock all the risk card components
jest.mock('../../../../routes/results/main-results-page/RiskCards', () => {
  // Create mock components that render their component name for testing
  const createMockComponent = (name: string): React.FC => {
    const Component = () => <div data-testid={name}>{name}</div>;
    Component.displayName = `Mock${name}`;
    return Component;
  };

  return {
    CVDRiskModerateOrHigh: createMockComponent('CVDRiskModerateOrHigh'),
    CVDRiskModerateOrHighBMIUnderweightCholesterol: createMockComponent(
      'CVDRiskModerateOrHighBMIUnderweightCholesterol'
    ),
    CVDRiskModerateOrHighDiabetesOrBMICholesterol: createMockComponent(
      'CVDRiskModerateOrHighDiabetesOrBMICholesterol'
    ),
    BMIUnderweightAndCholesterolHighVeryHigh: createMockComponent(
      'BMIUnderweightAndCholesterolHighVeryHigh'
    ),
    CholesterolHigh: createMockComponent('CholesterolHigh'),
    CholesterolVeryHigh: createMockComponent('CholesterolVeryHigh'),
    BMIUnderweight: createMockComponent('BMIUnderweight'),
    DiabetesHighRisk: createMockComponent('DiabetesHighRisk'),
    DiabetesPossibleDiabetes: createMockComponent('DiabetesPossibleDiabetes'),
    DiabetesHighRiskOtherFactorsNoHighBp: createMockComponent(
      'DiabetesHighRiskOtherFactorsNoHighBp'
    ),
    PossibleDiabetesOver86Mol: createMockComponent('PossibleDiabetesOver86Mol'),
    PossibleDiabetesOver86MolAnyFactorNoHighBP: createMockComponent(
      'PossibleDiabetesOver86MolAnyFactorNoHighBP'
    ),
    HighBPHome: createMockComponent('HighBPHome'),
    HighBPHomeOtherRiskFactorsNotDiabetes: createMockComponent(
      'HighBPHomeOtherRiskFactorsNotDiabetes'
    ),
    HighBPDiabetesHighRiskOtherRiskFactorsAllowed: createMockComponent(
      'HighBPDiabetesHighRiskOtherRiskFactorsAllowed'
    ),
    HighBPHomePossibleDiabetesAnyOtherRiskFactor: createMockComponent(
      'HighBPHomePossibleDiabetesAnyOtherRiskFactor'
    ),
    HighBPPossibleDiabetesOver86AnyRiskFactorAllowed: createMockComponent(
      'HighBPPossibleDiabetesOver86AnyRiskFactorAllowed'
    ),
    FailedCholesterolDiabetes: createMockComponent('FailedCholesterolDiabetes'),
    FailedCholesterolDiabetesHighBPHome: createMockComponent(
      'FailedCholesterolDiabetesHighBPHome'
    ),
    FailedDiabetes: createMockComponent('FailedDiabetes'),
    FailedCholesterolDiabetesHighRisk: createMockComponent(
      'FailedCholesterolDiabetesHighRisk'
    ),
    FailedCholesterolPossibleDiabetes: createMockComponent(
      'FailedCholesterolPossibleDiabetes'
    ),
    FailedCholesterolPossibleDiabetesOver86: createMockComponent(
      'FailedCholesterolPossibleDiabetesOver86'
    ),
    FailedCholesterolHighBPHome: createMockComponent(
      'FailedCholesterolHighBPHome'
    ),
    FailedCholesterolDiabetesHighRiskHighBPHome: createMockComponent(
      'FailedCholesterolDiabetesHighRiskHighBPHome'
    ),
    FailedCholesterolPossibleDiabetesHighBPHome: createMockComponent(
      'FailedCholesterolPossibleDiabetesHighBPHome'
    ),
    FailedCholesterolPossibleDiabetesOver86HighBPHome: createMockComponent(
      'FailedCholesterolPossibleDiabetesOver86HighBPHome'
    )
  };
});

// Mock the biometric score service
jest.mock('../../../../services/biometrics-score-service');

describe('ToDoNextFullResults', () => {
  const mockGetLatestBiometricScores = jest.spyOn(
    biometricScoreService,
    'getLatestBiometricScores'
  );

  // Basic health check object with default values that won't trigger any risk card
  const createMockHealthCheck = (
    overrides: Partial<IHealthCheck> = {}
  ): IHealthCheck =>
    ({
      id: '123',
      nhsNumber: '1234567890',
      dataModelVersion: '1.0',
      createdAt: '2025-08-14',
      ageAtStart: 45,
      ageAtCompletion: 45,
      questionnaire: {
        bloodPressureDiastolic: 80,
        bloodPressureSystolic: 120,
        bloodPressureLocation: BloodPressureLocation.Pharmacy,
        isBloodPressureSectionSubmitted: true
      } as any,
      questionnaireScores: {
        bmiClassification: BmiClassification.Healthy,
        bloodPressureCategory: BloodPressureCategory.Healthy
      } as any,
      questionnaireCompletionDate: '2025-08-14',
      riskScores: {
        qRiskScore: 5,
        qRiskScoreCategory: QRiskCategory.Low,
        heartAge: 45,
        scoreCalculationDate: '2025-08-14'
      },
      step: 'COMPLETED' as any,
      bloodTestExpiryWritebackStatus: 'NA' as any,
      bloodTestOrder: {} as any,
      biometricScores: [
        {
          date: '2025-08-14',
          scores: {
            diabetes: {
              category: 'Low' as any,
              overallCategory: OverallDiabetesCategory.Low,
              hba1c: 40
            },
            cholesterol: {
              overallCategory: OverallCholesterolCategory.Normal,
              totalCholesterol: 4,
              totalCholesterolCategory: 'Normal' as any,
              hdlCholesterol: 1.5,
              hdlCholesterolCategory: 'Normal' as any,
              totalCholesterolHdlRatio: 2.5,
              totalCholesterolHdlRatioCategory: 'Normal' as any
            }
          }
        }
      ],
      ...overrides
    }) as IHealthCheck;

  // Helper function to verify only the expected card is rendered and all others are not
  const expectOnlyCardToBeRendered = (
    expectedCardTestId: string,
    rendered: boolean = true
  ) => {
    const allCardTestIds = [
      'CVDRiskModerateOrHigh',
      'CVDRiskModerateOrHighBMIUnderweightCholesterol',
      'CVDRiskModerateOrHighDiabetesBMICholesterol',
      'BMIUnderweightAndCholesterolHighVeryHigh',
      'CholesterolHigh',
      'CholesterolVeryHigh',
      'BMIUnderweight',
      'DiabetesHighRisk',
      'DiabetesPossibleDiabetes',
      'DiabetesHighRiskOtherFactorsNoHighBp',
      'PossibleDiabetesOver86Mol',
      'PossibleDiabetesOver86MolAnyFactorNoHighBP',
      'HighBPHome',
      'HighBPHomeOtherRiskFactorsNotDiabetes',
      'HighBPDiabetesHighRiskOtherRiskFactorsAllowed',
      'HighBPHomePossibleDiabetesAnyOtherRiskFactor',
      'HighBPPossibleDiabetesOver86AnyRiskFactorAllowed',
      'FailedCholesterolDiabetes',
      'FailedCholesterolDiabetesHighBPHome',
      'FailedDiabetes',
      'FailedCholesterolDiabetesHighRisk',
      'FailedCholesterolPossibleDiabetes',
      'FailedCholesterolPossibleDiabetesOver86',
      'FailedCholesterolHighBPHome',
      'FailedCholesterolDiabetesHighRiskHighBPHome',
      'FailedCholesterolPossibleDiabetesHighBPHome',
      'FailedCholesterolPossibleDiabetesOver86HighBPHome'
    ];

    if (rendered) {
      // Verify the expected card is rendered
      expect(screen.getByTestId(expectedCardTestId)).toBeInTheDocument();

      // Verify no other cards are rendered
      allCardTestIds
        .filter((id) => id !== expectedCardTestId)
        .forEach((cardId) => {
          expect(screen.queryByTestId(cardId)).not.toBeInTheDocument();
        });
    } else {
      // Verify the expected card is not rendered
      expect(screen.queryByTestId(expectedCardTestId)).not.toBeInTheDocument();
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup the default mock for getLatestBiometricScores to avoid "Invalid biometrics data!" error
    mockGetLatestBiometricScores.mockReturnValue({
      diabetes: {
        category: 'Low' as any,
        overallCategory: OverallDiabetesCategory.Low,
        hba1c: 40
      },
      cholesterol: {
        overallCategory: OverallCholesterolCategory.Normal,
        totalCholesterol: 4,
        totalCholesterolCategory: 'Normal' as any,
        hdlCholesterol: 1.5,
        hdlCholesterolCategory: 'Normal' as any,
        totalCholesterolHdlRatio: 2.5,
        totalCholesterolHdlRatioCategory: 'Normal' as any
      }
    });
  });

  describe('When no risk factors are present', () => {
    test('should not render any risk cards', () => {
      const mockHealthCheck = createMockHealthCheck();

      // Default mock setup in beforeEach already provides healthy biometric scores

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      // No risk card should be rendered
      expect(
        screen.queryByTestId(/^CVDRisk|^BMI|^Cholesterol|^Diabetes|^HighBP/)
      ).not.toBeInTheDocument();

      expect(
        screen.getByText(/you're making good choices for your health/i)
      ).toBeInTheDocument();
    });
  });

  describe('When QRisk score is moderate', () => {
    test('should render the CVDRiskModerateOrHigh component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 10,
          qRiskScoreCategory: QRiskCategory.Moderate,
          heartAge: 48,
          scoreCalculationDate: '2025-08-14'
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('CVDRiskModerateOrHigh');
    });
  });

  describe('When QRisk score is high', () => {
    test('should render the CVDRiskModerateOrHigh component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.High,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('CVDRiskModerateOrHigh');
    });
  });

  describe('When QRisk score is moderate and BMI is underweight', () => {
    test('should render the CVDRiskModerateOrHighBMIUnderweightCholesterol component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.Moderate,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        },
        questionnaireScores: {
          bmiClassification: BmiClassification.Underweight,
          bloodPressureCategory: BloodPressureCategory.Healthy
        } as any
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'CVDRiskModerateOrHighBMIUnderweightCholesterol'
      );
    });
  });

  describe('When QRisk score is high and cholesterol is very high', () => {
    test('should render the CVDRiskModerateOrHighBMIUnderweightCholesterol component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.High,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'Low' as any,
          overallCategory: OverallDiabetesCategory.Low,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.VeryHigh,
          totalCholesterol: 6.5,
          totalCholesterolCategory: 'VeryHigh' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 4.3,
          totalCholesterolHdlRatioCategory: 'High' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'CVDRiskModerateOrHighBMIUnderweightCholesterol'
      );
    });
  });

  describe('When QRisk score is moderate, diabetes is high risk, and BMI is underweight', () => {
    test('should render the CVDRiskModerateOrHighDiabetesOrBMICholesterol component', () => {
      // Mock with multiple matching risk factors
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.Moderate,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        },
        questionnaireScores: {
          bmiClassification: BmiClassification.Underweight,
          bloodPressureCategory: BloodPressureCategory.Healthy
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'AtRisk' as any,
          overallCategory: OverallDiabetesCategory.AtRisk,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'CVDRiskModerateOrHighDiabetesOrBMICholesterol'
      );
    });
  });

  describe('When QRisk score is high, diabetes high risk, and cholesterol is high', () => {
    test('should render the CVDRiskModerateOrHighDiabetesOrBMICholesterol component', () => {
      // Mock with multiple matching risk factors
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.High,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'AtRisk' as any,
          overallCategory: OverallDiabetesCategory.AtRisk,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol: 4,
          totalCholesterolCategory: 'High' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'CVDRiskModerateOrHighDiabetesOrBMICholesterol'
      );
    });
  });

  describe('When BMI is underweight', () => {
    test('should render the BMIUnderweight component and no other risk cards', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaireScores: {
          bmiClassification: BmiClassification.Underweight,
          bloodPressureCategory: BloodPressureCategory.Healthy
        } as any
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('BMIUnderweight');
    });
  });

  describe('When cholesterol is high', () => {
    test('should render the CholesterolHigh component and no other risk cards', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'Low' as any,
          overallCategory: OverallDiabetesCategory.Low,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol: 6.5,
          totalCholesterolCategory: 'High' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 4.3,
          totalCholesterolHdlRatioCategory: 'High' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('CholesterolHigh');
    });
  });

  describe('When cholesterol is very high', () => {
    test('should render the CholesterolVeryHigh component and no other risk cards', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'Low' as any,
          overallCategory: OverallDiabetesCategory.Low,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.VeryHigh,
          totalCholesterol: 8,
          totalCholesterolCategory: 'VeryHigh' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 5.3,
          totalCholesterolHdlRatioCategory: 'High' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('CholesterolVeryHigh');
    });
  });

  describe('When BMI is underweight and cholesterol is high', () => {
    test('should render the BMIUnderweightAndCholesterolHighVeryHigh component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaireScores: {
          bmiClassification: BmiClassification.Underweight,
          bloodPressureCategory: BloodPressureCategory.Healthy
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'Low' as any,
          overallCategory: OverallDiabetesCategory.Low,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol: 6.5,
          totalCholesterolCategory: 'High' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 4.3,
          totalCholesterolHdlRatioCategory: 'High' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('BMIUnderweightAndCholesterolHighVeryHigh');
    });
  });

  describe('When BMI is underweight and cholesterol is very high', () => {
    test('should render the BMIUnderweightAndCholesterolHighVeryHigh component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaireScores: {
          bmiClassification: BmiClassification.Underweight,
          bloodPressureCategory: BloodPressureCategory.Healthy
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'Low' as any,
          overallCategory: OverallDiabetesCategory.Low,
          hba1c: 40
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.VeryHigh,
          totalCholesterol: 6.5,
          totalCholesterolCategory: 'VeryHigh' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 4.3,
          totalCholesterolHdlRatioCategory: 'High' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('BMIUnderweightAndCholesterolHighVeryHigh');
    });
  });

  describe('When diabetes is high risk', () => {
    test('should render the DiabetesHighRisk component', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'AtRisk' as any,
          overallCategory: OverallDiabetesCategory.AtRisk,
          hba1c: 50
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('DiabetesHighRisk');
    });
  });

  describe('When diabetes is possible diabetes', () => {
    test('should render the DiabetesPossibleDiabetes component', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'High' as any,
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 65
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('DiabetesPossibleDiabetes');
    });
  });

  describe('When diabetes is possible diabetes with other risk factors (not high BP) - cvd risk high', () => {
    test('should render the DiabetesHighRiskOtherFactorsNoHighBp component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.High,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'High' as any,
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 50
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('DiabetesHighRiskOtherFactorsNoHighBp');
    });
  });

  describe('When diabetes is possible diabetes with HbA1c over 86 mmol/mol', () => {
    test('should render the PossibleDiabetesOver86Mol component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.Low,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'High' as any,
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 87
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('PossibleDiabetesOver86Mol');
    });
  });

  describe('When diabetes is possible diabetes with HbA1c over 86 and other factors (not high BP) - cvd risk moderate', () => {
    test('should render the PossibleDiabetesOver86MolAnyFactorNoHighBP component', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.Moderate,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'High' as any,
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 87
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('PossibleDiabetesOver86MolAnyFactorNoHighBP');
    });
  });

  describe('When blood pressure is high at home', () => {
    test('should render the HighBPHome component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 95,
          bloodPressureSystolic: 145,
          bloodPressureLocation: BloodPressureLocation.Monitor,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: true,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: true
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('HighBPHome');
    });
  });

  describe('When blood pressure is high at pharmacy', () => {
    test('should not render the HighBPHome component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 95,
          bloodPressureSystolic: 145,
          bloodPressureLocation: BloodPressureLocation.Pharmacy,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: true,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: true
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('HighBPHome', false);
    });
  });

  describe('When high bp at home with other risk factors (not diabetes) - cvd risk high', () => {
    test('should render the HighBPHomeOtherRiskFactorsNotDiabetes component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 95,
          bloodPressureSystolic: 145,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any,
        riskScores: {
          qRiskScore: 15,
          qRiskScoreCategory: QRiskCategory.High,
          heartAge: 50,
          scoreCalculationDate: '2025-08-14'
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('HighBPHomeOtherRiskFactorsNotDiabetes');
    });
  });

  describe('When high bp at home and diabetes is high risk', () => {
    test('should render the HighBPDiabetesHighRiskOtherRiskFactorsAllowed component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 95,
          bloodPressureSystolic: 145,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'AtRisk' as any,
          overallCategory: OverallDiabetesCategory.AtRisk,
          hba1c: 50
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'HighBPDiabetesHighRiskOtherRiskFactorsAllowed'
      );
    });
  });

  describe('When high bp at home and diabetes is possible diabetes', () => {
    test('should render the HighBPHomePossibleDiabetesAnyOtherRiskFactor component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 95,
          bloodPressureSystolic: 145,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'High' as any,
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 50
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'HighBPHomePossibleDiabetesAnyOtherRiskFactor'
      );
    });
  });

  describe('When high bp at home and diabetes is possible diabetes with HbA1c over 86', () => {
    test('should render the HighBPPossibleDiabetesOver86AnyRiskFactorAllowed component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 95,
          bloodPressureSystolic: 145,
          bloodPressureLocation: BloodPressureLocation.Monitor,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: true,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: true
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'High' as any,
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 87
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: 'Normal' as any,
          hdlCholesterol: 1.5,
          hdlCholesterolCategory: 'Normal' as any,
          totalCholesterolHdlRatio: 2.5,
          totalCholesterolHdlRatioCategory: 'Normal' as any
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'HighBPPossibleDiabetesOver86AnyRiskFactorAllowed'
      );
    });
  });

  describe('When cholesterol and diabetes fully fails', () => {
    test('should render FailedCholesterolDiabetes', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.CompleteFailure
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolDiabetes');
    });
  });

  describe('When cholesterol and diabetes fully fails, high bp at home', () => {
    test('should render FailedCholesterolDiabetesHighBPHome', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 99,
          bloodPressureSystolic: 155,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.CompleteFailure
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolDiabetesHighBPHome');
    });
  });

  describe('When full cholesterol, diabetes failed and cvd risk is low', () => {
    test('should render FailedDiabetes', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.CompleteFailure
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedDiabetes');
    });

    test('skip render of FailedDiabetes if cvd risk not low', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScoreCategory: QRiskCategory.Moderate
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.CompleteFailure
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedDiabetes', false);
    });
  });

  describe('When full cholesterol, diabetes failed and cvd risk is moderate/high', () => {
    test('should render CVDRiskModerateOrHigh', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScoreCategory: QRiskCategory.Moderate
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.CompleteFailure
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('CVDRiskModerateOrHigh');
    });

    test('should render CVDRiskModerateOrHighBMIUnderweightCholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        riskScores: {
          qRiskScoreCategory: QRiskCategory.Moderate
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.CompleteFailure
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'CVDRiskModerateOrHighBMIUnderweightCholesterol'
      );
    });
  });

  describe('When cholesterol part or fully fails, diabetes is low, high bp at home', () => {
    test('should render the FailedCholesterolHighBPHome component', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.Low
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolHighBPHome');
    });
  });

  describe('When cholesterol part or fully fails, diabetes is high risk', () => {
    test('should render FailedCholesterolDiabetesHighRisk for partial cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.AtRisk
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.PartialFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolDiabetesHighRisk');
    });

    test('should render FailedCholesterolDiabetesHighRisk for fully failed cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.AtRisk
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolDiabetesHighRisk');
    });
  });

  describe('When cholesterol part or fully fails, diabetes is high risk, high bp at home', () => {
    test('should render FailedCholesterolDiabetesHighRiskHighBPHome for partial cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.AtRisk
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.PartialFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolDiabetesHighRiskHighBPHome');
    });

    test('should render FailedCholesterolDiabetesHighRiskHighBPHome for fully failed cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 99,
          bloodPressureSystolic: 155,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          category: 'AtRisk' as any,
          overallCategory: OverallDiabetesCategory.AtRisk,
          hba1c: 85
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolDiabetesHighRiskHighBPHome');
    });
  });

  describe('When cholesterol part or fully fails, diabetes is possible diabetes', () => {
    test('should render FailedCholesterolPossibleDiabetes for partial cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.PartialFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolPossibleDiabetes');
    });

    test('should render FailedCholesterolPossibleDiabetes for fully failed cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolPossibleDiabetes');
    });
  });

  describe('When cholesterol part or fully fails, diabetes is possible diabetes, high bp at home', () => {
    test('should render FailedCholesterolPossibleDiabetesHighBPHome for partial cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 99,
          bloodPressureSystolic: 155,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.PartialFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolPossibleDiabetesHighBPHome');
    });

    test('should render FailedCholesterolPossibleDiabetesHighBPHome for fully failed cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 99,
          bloodPressureSystolic: 155,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolPossibleDiabetesHighBPHome');
    });
  });

  describe('When cholesterol part or fully fails, diabetes is possible diabetes over 86mmol/mol', () => {
    test('should render FailedCholesterolPossibleDiabetesOver86 for partial cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 88
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.PartialFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolPossibleDiabetesOver86');
    });

    test('should render FailedCholesterolPossibleDiabetesOver86 for fully failed cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck();

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 88
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered('FailedCholesterolPossibleDiabetesOver86');
    });
  });

  describe('When cholesterol part or fully fails, diabetes is possible diabetes over 86mmol/mol, high bp at home', () => {
    test('should render FailedCholesterolPossibleDiabetesOver86HighBPHome for partial cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 99,
          bloodPressureSystolic: 155,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 88
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.PartialFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'FailedCholesterolPossibleDiabetesOver86HighBPHome'
      );
    });

    test('should render FailedCholesterolPossibleDiabetesOver86HighBPHome for fully failed cholesterol', () => {
      const mockHealthCheck = createMockHealthCheck({
        questionnaire: {
          bloodPressureDiastolic: 99,
          bloodPressureSystolic: 155,
          bloodPressureLocation: BloodPressureLocation.Monitor
        } as any,
        questionnaireScores: {
          bmiClassification: BmiClassification.Healthy,
          bloodPressureCategory: BloodPressureCategory.High
        } as any
      });

      mockGetLatestBiometricScores.mockReturnValue({
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          hba1c: 88
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.CompleteFailure
        }
      });

      render(<ToDoNextFullResults healthCheck={mockHealthCheck} />);

      expectOnlyCardToBeRendered(
        'FailedCholesterolPossibleDiabetesOver86HighBPHome'
      );
    });
  });
});
