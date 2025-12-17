import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';
import ProtectedRoute from '../../../lib/route-guards/protected-route';
import { HealthCheckSteps, AuditEventType } from '@dnhc-health-checks/shared';
import BloodPressureJourney from '../../../routes/blood-pressure-journey/BloodPressureJourney';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { routeConditionsForLoggedUser } from '../../../lib/route-guards/route-conditions';
import axios, { HttpStatusCode } from 'axios';
import TermsAndConditions from '../../../routes/terms-and-conditions-journey/TermsAndConditionsPage';
import HealthCheckVersionMigration from '../../../routes/health-check-version-migration/HealthCheckVersionMigrationPage';
import { rum } from '../../../lib/rum/rum-client';
import { RumEventType } from '../../../lib/models/rum-event-type';
import EligibilityJourney from '../../../routes/eligibility-journey/EligibilityJourney';

jest.mock('../../../settings', () => ({
  ...jest.requireActual('../../../settings'),
  healthCheckDataModelVersion: '2.0.0'
}));

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  const mockAxiosInstance = {
    interceptors: {
      response: {
        use: jest.fn()
      }
    }
  };

  return {
    ...actualAxios,
    create: jest.fn(() => mockAxiosInstance)
  };
});

const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

const recordErrorEventSpy = jest
  .spyOn(rum, 'recordErrorEvent')
  .mockImplementation(async () => {});

const mockHealthCheckService = {
  getHealthCheckById: jest.fn(),
  updateHealthCheckQuestionnaireAnswers: jest.fn(),
  createHealthCheck: jest.fn(),
  getHealthChecksByToken: jest.fn(),
  runVersionMigration: jest.fn()
};

const mockPatientInfoService = {
  getCachedOrFetchPatientInfo: jest.fn(),
  updatePatientInfo: jest.fn()
};

const queryClient = new QueryClient();

const renderWithProviders = (
  initialEntries = [RoutePath.HomePage] as string[]
) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute
                healthCheckApiService={mockHealthCheckService}
                patientInfoService={mockPatientInfoService}
              />
            }
          >
            <Route
              key={RoutePath.BloodPressureJourney}
              path={RoutePath.BloodPressureJourney}
              element={<BloodPressureJourney />}
            />
            ,
            <Route
              key={RoutePath.TermsAndConditions}
              path={RoutePath.TermsAndConditions}
              element={
                <TermsAndConditions
                  healthCheckApiService={mockHealthCheckService}
                  patientInfoService={mockPatientInfoService}
                />
              }
            />
            ,
            <Route
              key={RoutePath.EligibilityJourney}
              path={RoutePath.EligibilityJourney}
              element={<EligibilityJourney />}
            />
            ,
            <Route
              key={RoutePath.HealthCheckVersionMigration}
              path={RoutePath.HealthCheckVersionMigration}
              element={
                <HealthCheckVersionMigration
                  healthCheckApiService={mockHealthCheckService}
                />
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeAll(() => {
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.AlcoholQuestionPage,
      setCurrentStep: jest.fn()
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    recordErrorEventSpy.mockClear();
    mockHealthCheckService.getHealthChecksByToken.mockClear();
  });

  it('should redirect to TermsAndConditions if terms are not accepted', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: []
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.TermsAndConditions,
        { replace: true }
      );
    });
  });

  it('should not redirect to TermsAndConditions if terms are not accepted, but the health check expired', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [{ id: '123', step: HealthCheckSteps.AUTO_EXPIRED }]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.HealthCheckExpiredPage,
        { replace: true }
      );
    });

    expect(mockedUseNavigate).not.toHaveBeenCalledWith(
      RoutePath.TermsAndConditions,
      { replace: true }
    );
  });

  it('should redirect to HealthCheckExpired and emit an event if health check expired', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          step: HealthCheckSteps.AUTO_EXPIRED,
          dataModelVersion: '2.3.4'
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.HealthCheckExpiredPage,
        { replace: true }
      );
    });

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.ExpiredScreenOpened,
      healthCheck: expect.objectContaining({
        id: '123',
        dataModelVersion: '2.3.4'
      })
    });
  });

  it.each([
    HealthCheckSteps.AUTO_EXPIRED_BLOOD_NOT_ORDERED,
    HealthCheckSteps.AUTO_EXPIRED_BLOOD_ORDERED,
    HealthCheckSteps.AUTO_EXPIRED_BLOOD_RECEIVED,
    HealthCheckSteps.AUTO_EXPIRED_BLOOD_FINAL,
    HealthCheckSteps.AUTO_EXPIRED_NO_BLOOD_FINAL
  ])(
    'should redirect to BloodTestDataExpiredShutterPage and emit an event if health check expired with step = %s after questionnaire is completed',
    async (step: HealthCheckSteps) => {
      mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
        healthChecks: [
          {
            id: '123',
            step,
            dataModelVersion: '2.3.4'
          }
        ]
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith(
          RoutePath.BloodTestDataExpiredShutterPage,
          { replace: true }
        );
      });

      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodTestExpiredScreenOpened,
        healthCheck: expect.objectContaining({
          id: '123',
          dataModelVersion: '2.3.4'
        })
      });
    }
  );

  it('should redirect to Eligibility if health check exists, but eligibility not started', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '2.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: {}
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.EligibilityJourney,
        {
          replace: true
        }
      );
    });

    expect(mockTriggerAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartEligibility,
      healthCheck: expect.objectContaining({
        id: '123',
        dataModelVersion: '2.0.0'
      })
    });
  });

  it('should redirect to Eligibility if health check exists, but eligibility not completed', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '2.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: {
            hasReceivedAnInvitation: false,
            hasCompletedHealthCheckInLast5Years: false,
            hasPreExistingCondition: false
          }
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.EligibilityJourney,
        {
          replace: true
        }
      );
    });

    expect(mockTriggerAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartEligibility,
      healthCheck: expect.objectContaining({
        id: '123',
        dataModelVersion: '2.0.0'
      })
    });
  });

  it('should redirect to TermsAndConditions if a version is accepted but out of date', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      acceptedTermsVersion: '0.1'
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '2.0.0',
          step: HealthCheckSteps.INIT
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.TermsAndConditions,
        {
          replace: true
        }
      );
    });
  });

  it('should redirect to HealthCheckVersionMigration if version on the health check is out of date', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '1.0.0',
          step: HealthCheckSteps.INIT
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.HealthCheckVersionMigration,
        {
          replace: true
        }
      );
    });
  });

  it('should redirect to Eligibility if version of health check is up to date', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '2.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: {}
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.EligibilityJourney,
        {
          replace: true
        }
      );
    });

    expect(mockTriggerAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartEligibility,
      healthCheck: expect.objectContaining({
        id: '123',
        dataModelVersion: '2.0.0'
      })
    });
  });

  it('should redirect to StartHealthCheckPage if no health check exists', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: []
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.StartHealthCheckPage,
        { replace: true }
      );
    });
  });

  it('should redirect to StartHealthCheckPage if no patient exists', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue(null);
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: []
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.StartHealthCheckPage,
        { replace: true }
      );
    });
  });

  it('should redirect to LowBloodPressureShutterPage if strong low blood pressure symptoms are confirmed even if new terms are not accepted and new version of health check exists', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '1.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: { hasStrongLowBloodPressureSymptoms: true }
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        `${RoutePath.BloodPressureJourney}?step=${JourneyStepNames.LowBloodPressureShutterPage}`,
        { replace: true }
      );
    });
  });

  it('should redirect to BloodPressureVeryHighShutterPage if high blood pressure values are confirmed even if new terms are not accepted and new version of health check exists', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '1.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: { highBloodPressureValuesConfirmed: true }
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        `${RoutePath.BloodPressureJourney}?step=${JourneyStepNames.BloodPressureVeryHighShutterPage}`,
        { replace: true }
      );
    });
  });

  it('should redirect to DiabetesShutterPage if health symptoms are confirmed even if new terms are not accepted and new version of health check exists', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '1.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: { hasHealthSymptoms: true }
        }
      ]
    });

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        `${RoutePath.BodyMeasurementsJourney}?step=${JourneyStepNames.DiabetesShutterPage}`,
        { replace: true }
      );
    });
  });

  it('should allow access to the page without additional steps', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '2.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: { highBloodPressureValuesConfirmed: false }
        }
      ]
    });

    const canAccessSpy = jest.spyOn(
      routeConditionsForLoggedUser[RoutePath.EligibilityJourney],
      'canAccess'
    );
    canAccessSpy.mockReturnValue(true);

    renderWithProviders([`${RoutePath.EligibilityJourney}`]);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Did you receive an invitation from your GP surgery to do the NHS Health Check online?'
        )
      ).toBeInTheDocument();
    });

    expect(mockedUseNavigate).not.toHaveBeenCalled();
  });

  it('should allow access to the journey step if there are no restrictions', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          dataModelVersion: '2.0.0',
          step: HealthCheckSteps.INIT,
          questionnaire: {
            highBloodPressureValuesConfirmed: false,
            hasReceivedAnInvitation: true,
            canCompleteHealthCheckOnline: true
          }
        }
      ]
    });

    const canAccessSpy = jest.spyOn(
      routeConditionsForLoggedUser[RoutePath.BloodPressureJourney],
      'canAccess'
    );
    canAccessSpy.mockReturnValue(true);

    renderWithProviders([
      `${RoutePath.BloodPressureJourney}?step=${JourneyStepNames.BloodPressureCheckPage}`
    ]);

    await waitFor(() => {
      expect(screen.getByText('Check your blood pressure')).toBeInTheDocument();
    });

    expect(mockedUseNavigate).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockRejectedValue(
      new Error('Unexpected error')
    );

    renderWithProviders();

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.UnexpectedErrorPage,
        { replace: true }
      );
    });

    expect(recordErrorEventSpy).toHaveBeenCalledTimes(1);
    expect(recordErrorEventSpy).toHaveBeenCalledWith({
      eventType: RumEventType.UNEXPECTED_ERROR,
      errorMessage: 'Unexpected error',
      healthCheckId: '123',
      patientId: undefined
    });
  });

  it('should redirect to HomePage on Unauthorized error', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockRejectedValue({
      response: {
        status: HttpStatusCode.Unauthorized
      }
    });
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError');
    isAxiosErrorSpy.mockReturnValue(true);

    renderWithProviders([`${RoutePath.EligibilityJourney}`]);

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(RoutePath.HomePage, {
        replace: true
      });
    });
  });

  it('should redirect to StartHealthCheckPage on NotFound error', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockRejectedValue({
      response: {
        status: HttpStatusCode.NotFound
      }
    });
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError');
    isAxiosErrorSpy.mockReturnValue(true);

    renderWithProviders([`${RoutePath.EligibilityJourney}`]);

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.StartHealthCheckPage,
        { replace: true }
      );
    });
  });

  it('should redirect to UnexpectedErrorPage on other errors', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockRejectedValue({
      response: {
        status: HttpStatusCode.InternalServerError,
        data: { prop: 'value' }
      },
      message: 'Error'
    });
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError');
    isAxiosErrorSpy.mockReturnValue(true);

    renderWithProviders([`${RoutePath.EligibilityJourney}`]);

    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.UnexpectedErrorPage,
        { replace: true }
      );
    });

    expect(recordErrorEventSpy).toHaveBeenCalledTimes(1);
    expect(recordErrorEventSpy).toHaveBeenCalledWith({
      eventType: RumEventType.UNEXPECTED_ERROR,
      errorMessage: 'Error',
      errorDetails: { prop: 'value' },
      healthCheckId: undefined,
      patientId: undefined
    });
  });

  it.each([
    [RoutePath.MainResultsPage, HealthCheckSteps.GP_UPDATE_SUCCESS],
    [
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.BloodTestOrderedPage
      ),
      HealthCheckSteps.LAB_ORDERS_SCHEDULED
    ],
    [
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.BloodTestOrderedPage
      ),
      HealthCheckSteps.LAB_ORDERS_PLACED
    ],
    [
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.BloodTestOrderedPage
      ),
      HealthCheckSteps.RISK_SCORES_CALCULATED
    ],
    [
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.BloodTestOrderedPage
      ),
      HealthCheckSteps.GP_UPDATE_FAILED
    ],
    [RoutePath.TaskListPage, '<any other step>']
  ])(
    'should redirect to %s if health check step is %s',
    async (expectedPath, step) => {
      mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
        termsAccepted: true
      });
      mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
        healthChecks: [
          {
            id: '123',
            dataModelVersion: '2.0.0',
            questionnaire: {
              hasReceivedAnInvitation: true,
              canCompleteHealthCheckOnline: true
            },
            step
          }
        ]
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith(expectedPath, {
          replace: true
        });
      });
    }
  );

  it.each([
    [RoutePath.MainResultsPage, HealthCheckSteps.GP_UPDATE_SUCCESS],
    [
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.BloodTestOrderedPage
      ),
      HealthCheckSteps.LAB_ORDERS_SCHEDULED
    ],
    [
      getStepUrl(
        RoutePath.BloodTestJourney,
        JourneyStepNames.BloodTestOrderedPage
      ),
      HealthCheckSteps.LAB_ORDERS_PLACED
    ]
  ])(
    'should redirect to %s if health check step is %s even if eligibility section is not completed',
    async (expectedPath, step) => {
      mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
        termsAccepted: true
      });
      mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
        healthChecks: [
          {
            id: '123',
            dataModelVersion: '2.0.0',
            questionnaire: {
              hasReceivedAnInvitation: false,
              canCompleteHealthCheckOnline: false
            },
            step
          }
        ]
      });

      renderWithProviders();

      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith(expectedPath, {
          replace: true
        });
      });
    }
  );

  it('should not redirect from TermsAndConditions to StartHealthCheckPage to avoid redirection loop', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: []
    });

    renderWithProviders([RoutePath.TermsAndConditions]);

    await waitFor(() => {
      expect(mockedUseNavigate).not.toHaveBeenCalledWith(
        RoutePath.StartHealthCheckPage,
        {
          replace: true
        }
      );
    });
  });

  it('should not redirect from TaskListPage to HealthCheckVersionMigrationPage to avoid redirection loop', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: []
    });

    renderWithProviders([RoutePath.TaskListPage]);

    await waitFor(() => {
      expect(mockedUseNavigate).not.toHaveBeenCalledWith(
        RoutePath.HealthCheckVersionMigration,
        {
          replace: true
        }
      );
    });
  });

  it('should update page title when user is redirected to shutter page', async () => {
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      healthChecks: [
        {
          id: '123',
          step: HealthCheckSteps.INIT,
          questionnaire: { highBloodPressureValuesConfirmed: true }
        }
      ]
    });

    const canAccessSpy = jest.spyOn(
      routeConditionsForLoggedUser[RoutePath.BloodPressureJourney],
      'canAccess'
    );
    canAccessSpy.mockReturnValue(true);

    renderWithProviders([
      `${RoutePath.BloodPressureJourney}?step=${JourneyStepNames.BloodPressureVeryHighShutterPage}`
    ]);

    await waitFor(() => {
      expect(
        screen.getByText('Your blood pressure reading is:')
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.title).toBe(
        'You have very high blood pressure - NHS Health Check online - NHS'
      );
    });
  });
});
