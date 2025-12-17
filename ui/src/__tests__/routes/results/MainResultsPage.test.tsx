/* eslint-disable jest/no-conditional-expect */
import { render, screen, waitFor } from '@testing-library/react';
import MainResultsPage from '../../../routes/results/MainResultsPage';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { RoutePath } from '../../../lib/models/route-paths';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  HealthCheckSteps,
  AuditEventType,
  AsianOrAsianBritish,
  BloodPressureCategory,
  BloodPressureLocation,
  EthnicBackground,
  ExerciseHours,
  Smoking,
  DiabetesCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  ActivityCategory,
  AuditCategory
} from '@dnhc-health-checks/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import patientInfoService, {
  type IPatientInfo
} from '../../../services/patient-info-service';
import userEvent from '@testing-library/user-event';

jest.mock('../../../services/patient-info-service', () => ({
  getCachedOrFetchPatientInfo: jest.fn()
}));

const mockTriggerAuditEvent = jest.fn();

jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));
afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});
jest.mock('../../../hooks/healthCheckHooks');

describe('MainResultsPage tests', () => {
  const queryClient = new QueryClient();
  const healthCheckData = {
    questionnaire: {
      bloodPressureDiastolic: 92,
      bloodPressureLocation: BloodPressureLocation.Monitor,
      bloodPressureSystolic: 135,
      cycleHours: ExerciseHours.ThreeHoursOrMore,
      detailedEthnicGroup: AsianOrAsianBritish.Bangladeshi,
      drinkAlcohol: 'Never',
      ethnicBackground: EthnicBackground.AsianOrAsianBritish,
      exerciseHours: ExerciseHours.LessThanOne,
      gardeningHours: ExerciseHours.LessThanOne,
      hasCompletedHealthCheckInLast5Years: false,
      hasFamilyHeartAttackHistory: 'No',
      hasPreExistingCondition: false,
      height: 190,
      heightDisplayPreference: 'cm',
      houseworkHours: ExerciseHours.BetweenOneAndThree,
      sex: 'Male',
      smoking: Smoking.Never,
      walkHours: ExerciseHours.BetweenOneAndThree,
      walkPace: 'BriskPace',
      weight: 90,
      weightDisplayPreference: 'kg',
      workActivity: 'Sitting'
    },
    questionnaireScores: {
      activityCategory: ActivityCategory.ModeratelyActive,
      auditCategory: AuditCategory.NoRisk,
      auditScore: 0,
      bmiClassification: 'Overweight',
      bmiScore: 27.6,
      gppaqScore: 4,
      townsendScore: null,
      bloodPressureCategory: BloodPressureCategory.SlightlyRaised
    },
    biometricScores: [
      {
        date: new Date().toISOString(),
        scores: {
          diabetes: {
            hba1c: 52,
            category: DiabetesCategory.High,
            overallCategory: OverallDiabetesCategory.High
          },
          cholesterol: {
            overallCategory: 'Normal',
            totalCholesterol: 2,
            totalCholesterolCategory: TotalCholesterolCategory.Normal,
            hdlCholesterol: 1,
            hdlCholesterolCategory: 'Normal',
            totalCholesterolHdlRatio: 6,
            totalCholesterolHdlRatioCategory: 'Normal'
          }
        }
      }
    ],
    riskScores: {
      heartAge: 84,
      qRiskScore: 16.23,
      qRiskScoreCategory: 'Moderate',
      scoreCalculationDate: '2024-08-13T09:04:53.804Z'
    },
    id: '12345',
    dataModelVersion: '2.3.4',
    step: HealthCheckSteps.INIT,
    ageAtCompletion: 44
  };
  const patientData: IPatientInfo = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    termsAccepted: true
  };

  const getPatientInfoMock =
    patientInfoService.getCachedOrFetchPatientInfo as jest.Mock;
  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({
        healthChecks: [healthCheckData]
      })
    )
  );

  beforeEach(() => {
    getPatientInfoMock.mockResolvedValue(patientData);
    mockTriggerAuditEvent.mockReset();
  });
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => server.close());

  afterEach(() => {
    jest.resetAllMocks();
    server.resetHandlers();
    queryClient.clear();
  });

  const contentTests = [
    ['Hello Jan, here are your results'],
    ['Your heart age is:', '84'],
    ['Your age is:', '44'],
    [
      (content: string | string[]) =>
        content.includes('Your cardiovascular disease (CVD) risk score is')
    ],
    ['Smoking status', 'You have never smoked'],
    ['Your heart and dementia'],
    ['52mmol/mol', 'possible diabetes'],
    ['2mmol/L', 'healthy'],
    ['135/92', 'slightly raised'],
    ['27.6', 'overweight'],
    ['0', 'no risk'],
    ['moderately active']
  ];

  describe.each(contentTests)(
    'Validate content for complete results',
    (...texts) => {
      test(`The page renders successfully with correct content: ${texts.join(', ')}`, async () => {
        (useHealthCheck as jest.Mock).mockReturnValue({
          data: healthCheckData,
          isSuccess: true,
          isPending: false,
          isError: false
        });

        const history = createMemoryHistory();

        render(
          <QueryClientProvider client={queryClient}>
            <Router location={history.location} navigator={history}>
              <MainResultsPage />
            </Router>
          </QueryClientProvider>
        );
        await waitFor(() => {
          expect(screen.getByText(texts[0])).toBeInTheDocument();
        });
        texts.forEach((text) => {
          expect(screen.getByText(text)).toBeInTheDocument();
        });
      });
    }
  );

  const partialBloodsTests = [
    {
      scenario: 'both tests ordered - complete failure',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'CompleteFailure',
                hdlCholesterolFailureReason: 'failure_reason',
                totalCholesterolFailureReason: 'failure_reason',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'CompleteFailure',
                failureReason: 'failure_reason'
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'book another blood test to check your cholesterol levels',
        'screen for diabetes',
        'discuss the rest of your results',
        'There was an issue processing your blood tests at the lab, so we could not get your results for cholesterol and diabetes.',
        'What happened with my blood tests?',
        'Incomplete results',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - no results',
        'Diabetes screen (HbA1c) - no results',
        'Based on some of your answers in the health questionnaire, we recommend you get another diabetes screen to get a fuller picture of your health.',
        'Your heart and dementia',
        'Your GP surgery can help you understand your results and give you any guidance you need.'
      ],
      expectedContentNotPresent: [
        'Your heart age is',
        'Your cardiovascular disease (CVD) risk score is',
        'Your diabetes risk is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario:
        'both tests ordered - partial failure - total cholesterol returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'PartialFailure',
                hdlCholesterolFailureReason: 'failure_reason',
                totalCholesterol: 6,
                totalCholesterolCategory: 'High',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'CompleteFailure',
                failureReason: 'failure_reason'
              }
            }
          }
        ],
        riskScores: {
          heartAge: 84,
          qRiskScore: 16.23,
          qRiskScoreCategory: 'Low',
          scoreCalculationDate: '2024-08-13T09:04:53.804Z'
        }
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get all your results for cholesterol and diabetes.',
        'What happened with my blood tests?',
        'Incomplete results',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - some results available',
        'Diabetes screen (HbA1c) - no results',
        'Based on some of your answers in the health questionnaire, we recommend you get another diabetes screen to get a fuller picture of your health.',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your diabetes risk is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario:
        'both tests ordered - partial failure - hdl cholesterol returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'PartialFailure',
                hdlCholesterol: 2,
                hdlCholesterolCategory: 'Normal',
                totalCholesterolFailureReason: 'failure_reason',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'CompleteFailure',
                failureReason: 'failure_reason'
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get all your results for cholesterol and diabetes.',
        'What happened with my blood tests?',
        'Incomplete results',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - some results available',
        'Diabetes screen (HbA1c) - no results',
        'Based on some of your answers in the health questionnaire, we recommend you get another diabetes screen to get a fuller picture of your health.',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your diabetes risk is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario: 'both tests ordered - partial failure - hba1c returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'CompleteFailure',
                hdlCholesterolFailureReason: 'failure_reason',
                totalCholesterolFailureReason: 'failure_reason',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'Low',
                category: 'Low',
                hba1c: 23
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get your cholesterol results.',
        'What happened with my blood tests?',
        'Incomplete result',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - no results',
        'Your diabetes risk is',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario:
        'both tests ordered - partial failure - hba1c and hdl cholesterol returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'PartialFailure',
                hdlCholesterol: 2,
                hdlCholesterolCategory: 'Normal',
                totalCholesterolFailureReason: 'failure_reason',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'Low',
                category: 'Low',
                hba1c: 23
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get all your cholesterol results.',
        'What happened with my blood tests?',
        'Incomplete result',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - some results available',
        'Diabetes risk',
        'Your diabetes risk is',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario:
        'both tests ordered - partial failure - full cholesterol returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'High',
                hdlCholesterol: 2,
                hdlCholesterolCategory: 'Normal',
                totalCholesterol: 6,
                totalCholesterolCategory: 'High',
                totalCholesterolHdlRatio: 3,
                totalCholesterolHdlRatioCategory: 'Normal'
              },
              diabetes: {
                overallCategory: 'CompleteFailure',
                failureReason: 'failure_reason'
              }
            }
          }
        ]
      },
      expectedContent: [
        'Your heart age is:',
        (content: string | string[]) =>
          content.includes('Your cardiovascular disease (CVD) risk score is'),
        'Incomplete result',
        'Based on some of your answers to the health questions, you may be at risk of developing type 2 diabetes.',
        'We check this by doing a blood test. Unfortunately, there was an issue processing your first blood test at the lab (the issue is not to do with your health).',
        'You need to contact your GP surgery for another blood test.',
        'What to do next',
        'Cholesterol risk',
        'Your cholesterol levels are',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Diabetes screen (Hba1c) - no results',
        'Your diabetes risk is'
      ]
    },
    {
      scenario: 'cholesterol test ordered - complete failure',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'CompleteFailure',
                hdlCholesterolFailureReason: 'failure_reason',
                totalCholesterolFailureReason: 'failure_reason',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'LowRiskNoBloodTest',
                category: 'LowRiskNoBloodTest',
                hba1c: null
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get your cholesterol results.',
        'What happened with my blood tests?',
        'Incomplete result',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - no results',
        'Your diabetes risk is',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario:
        'cholesterol test ordered - partial failure - hdl cholesterol returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'PartialFailure',
                hdlCholesterol: 2,
                hdlCholesterolCategory: 'Normal',
                totalCholesterolFailureReason: 'failure_reason',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'LowRiskNoBloodTest',
                category: 'LowRiskNoBloodTest',
                hba1c: null
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get all your cholesterol results.',
        'What happened with my blood tests?',
        'Incomplete result',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - some results available',
        'Your diabetes risk is',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your cholesterol levels are'
      ]
    },
    {
      scenario:
        'cholesterol test ordered - partial failure - total cholesterol returned',
      partialHealthCheck: {
        biometricScores: [
          {
            date: '2025-03-26T08:41:24.256Z',
            scores: {
              cholesterol: {
                overallCategory: 'PartialFailure',
                hdlCholesterolFailureReason: 'failure_reason',
                totalCholesterol: 6,
                totalCholesterolCategory: 'High',
                totalCholesterolHdlRatioFailureReason: 'failure_reason'
              },
              diabetes: {
                overallCategory: 'LowRiskNoBloodTest',
                category: 'LowRiskNoBloodTest',
                hba1c: null
              }
            }
          }
        ]
      },
      expectedContent: [
        'We could not work out your risk of heart attack or stroke',
        'There was an issue processing your blood tests at the lab, so we could not get all your cholesterol results.',
        'What happened with my blood tests?',
        'Incomplete result',
        'These are the results we could not get from your blood sample.',
        'Cholesterol - some results available',
        'Check your partial cholesterol results',
        'Your diabetes risk is',
        'Your heart and dementia'
      ],
      expectedContentNotPresent: [
        'Your heart age is:',
        'Your cardiovascular disease (CVD) risk score is',
        'Your cholesterol levels are'
      ]
    }
  ];

  describe.each(partialBloodsTests)(
    'Validate content for partial results',
    (partialConfig) => {
      test(`The page renders successfully with correct content: ${partialConfig.scenario}`, () => {
        (useHealthCheck as jest.Mock).mockReturnValue({
          data: {
            ...healthCheckData,
            ...partialConfig.partialHealthCheck
          },
          isSuccess: true,
          isPending: false,
          isError: false
        });

        const history = createMemoryHistory();
        render(
          <QueryClientProvider client={queryClient}>
            <Router location={history.location} navigator={history}>
              <MainResultsPage />
            </Router>
          </QueryClientProvider>
        );

        partialConfig.expectedContent.forEach((text) => {
          expect(screen.getByText(text)).toBeInTheDocument();
        });
        partialConfig.expectedContentNotPresent.forEach((text) => {
          expect(screen.queryByText(text)).not.toBeInTheDocument();
        });
      });
    }
  );

  const navigationTests = [
    ['Blood pressure', RoutePath.BloodPressureResultsPage],
    ['Diabetes risk', RoutePath.DiabetesRiskResultsPage],
    ['BMI results', RoutePath.BMIResultsPage],
    ['Cholesterol risk', RoutePath.CholesterolResultsPage],
    ['Alcohol risk results', RoutePath.AlcoholResultsPage],
    ['Physical activity level', RoutePath.PhysicalActivityResultsPage],
    [
      'Find out how to lower your risk of getting dementia',
      RoutePath.DementiaPage
    ]
  ];

  describe.each(navigationTests)(
    'Validate navigation',
    (linkText, expectedPath) => {
      test(`Navigate to ${linkText} screen`, async () => {
        (useHealthCheck as jest.Mock).mockReturnValue({
          data: healthCheckData,
          isSuccess: true,
          isPending: false,
          isError: false
        });
        const history = createMemoryHistory();

        render(
          <QueryClientProvider client={queryClient}>
            <Router location={history.location} navigator={history}>
              <MainResultsPage />
            </Router>
          </QueryClientProvider>
        );

        const linkElement = screen.getByText(linkText);
        await userEvent.click(linkElement);
        expect(history.location.pathname).toBe(expectedPath);
      });
    }
  );

  it(`send '${AuditEventType.PatientResultsSummaryOpened}' event when page is rendered`, () => {
    (useHealthCheck as jest.Mock).mockReturnValue({
      data: healthCheckData,
      isSuccess: true,
      isPending: false,
      isError: false
    });
    const history = createMemoryHistory();
    render(
      <QueryClientProvider client={queryClient}>
        <Router location={history.location} navigator={history}>
          <MainResultsPage />
        </Router>
      </QueryClientProvider>
    );

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsSummaryOpened,
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      })
    });
  });

  test.each([
    {
      title: "show only 'Continue what you're doing'",
      expected: { keepItUp: true, toImprove: false },
      healthCheck: {
        questionnaireScores: {
          activityCategory: 'Active',
          auditCategory: 'NoRisk',
          auditScore: 0,
          bloodPressureCategory: 'Healthy',
          bmiClassification: 'Healthy',
          bmiScore: 22.5,
          gppaqScore: 4,
          leicesterRiskCategory: 'Low',
          leicesterRiskScore: 1,
          townsendScore: null
        },
        biometricScores: [
          {
            date: new Date().toISOString(),
            scores: {
              diabetes: {
                hba1c: 5,
                category: 'LowRiskNoBloodTest',
                overallCategory: 'LowRiskNoBloodTest'
              },
              cholesterol: {
                overallCategory: 'Normal',
                totalCholesterol: 2,
                totalCholesterolCategory: 'Normal',
                hdlCholesterol: 1,
                hdlCholesterolCategory: 'Normal',
                totalCholesterolHdlRatio: 6,
                totalCholesterolHdlRatioCategory: 'Normal'
              }
            }
          }
        ]
      }
    },
    {
      title: 'show only "Things to improve"',
      expected: { keepItUp: false, toImprove: true },
      healthCheck: {
        questionnaireScores: {
          activityCategory: 'ModeratelyInactive',
          auditCategory: 'HighRisk',
          auditScore: 39,
          bloodPressureCategory: 'High',
          bmiClassification: 'Obese 1',
          bmiScore: 27.8,
          gppaqScore: 6,
          leicesterRiskCategory: 'High',
          leicesterRiskScore: 12,
          smokingCategory: 'CurrentSmoker',
          townsendScore: null
        },
        biometricScores: [
          {
            date: new Date().toISOString(),
            scores: {
              cholesterol: {
                hdlCholesterol: 1.5,
                hdlCholesterolCategory: 'Normal',
                overallCategory: 'High',
                totalCholesterol: 6.3,
                totalCholesterolCategory: 'High',
                totalCholesterolHdlRatio: 5,
                totalCholesterolHdlRatioCategory: 'Normal'
              },
              diabetes: {
                category: 'AtRisk',
                hba1c: 45,
                overallCategory: 'AtRisk'
              }
            }
          }
        ]
      }
    },
    {
      title: "show 'Continue what you're doing' and 'Things to improve'",
      expected: { keepItUp: true, toImprove: true },
      healthCheck: {
        questionnaireScores: {
          activityCategory: 'ModeratelyInactive',
          auditCategory: 'HighRisk',
          auditScore: 39,
          bloodPressureCategory: 'High',
          bmiClassification: 'Obese 1',
          bmiScore: 27.8,
          gppaqScore: 6,
          leicesterRiskCategory: 'High',
          leicesterRiskScore: 12,
          townsendScore: null
        },
        biometricScores: [
          {
            date: new Date().toISOString(),
            scores: {
              cholesterol: {
                hdlCholesterol: 1.5,
                hdlCholesterolCategory: 'Normal',
                overallCategory: 'High',
                totalCholesterol: 6.3,
                totalCholesterolCategory: 'High',
                totalCholesterolHdlRatio: 5,
                totalCholesterolHdlRatioCategory: 'Normal'
              },
              diabetes: {
                category: 'Low',
                hba1c: 15,
                overallCategory: 'Low'
              }
            }
          }
        ]
      }
    }
  ])('should $title', ({ expected, healthCheck }) => {
    (useHealthCheck as jest.Mock).mockReturnValue({
      data: {
        ...healthCheckData,
        questionnaireScores: {
          ...healthCheckData.questionnaireScores,
          ...healthCheck.questionnaireScores
        },
        biometricScores: healthCheck.biometricScores
      },
      isSuccess: true,
      isPending: false,
      isError: false
    });

    const history = createMemoryHistory();
    render(
      <QueryClientProvider client={queryClient}>
        <Router location={history.location} navigator={history}>
          <MainResultsPage />
        </Router>
      </QueryClientProvider>
    );

    const keepItUp = "Continue what you're doing";

    expected.keepItUp
      ? expect(screen.getByText(keepItUp)).toBeInTheDocument()
      : expect(screen.queryByText(keepItUp)).not.toBeInTheDocument();

    const thingsToImprove = 'Things to improve';

    expected.toImprove
      ? expect(screen.getByText(thingsToImprove)).toBeInTheDocument()
      : expect(screen.queryByText(thingsToImprove)).not.toBeInTheDocument();
  });
});
