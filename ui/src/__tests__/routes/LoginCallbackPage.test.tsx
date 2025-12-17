import LoginCallbackPage from '../../routes/LoginCallbackPage';
import { render, waitFor, screen } from '@testing-library/react';
import { httpClient } from '../../lib/http/http-client';
import {
  type IHealthCheck,
  HealthCheckSteps
} from '@dnhc-health-checks/shared';
import '@testing-library/jest-dom';
import { HttpCallStatus } from '../../services/health-check-service';
import { RoutePath } from '../../lib/models/route-paths';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../lib/route-guards/protected-route';

const mockedUseNavigate = jest.fn();
const urlSearchParamsSpy = jest.spyOn(URLSearchParams.prototype, 'get');
const nhsLoginAuthCode = 'code-from-nhs-login';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));
jest.mock('../../lib/rum/rum-client', () => ({
  rum: {
    enable: jest.fn(),
    recordErrorEvent: jest.fn()
  }
}));

jest.mock('../../settings', () => ({
  ...jest.requireActual('../../settings'),
  healthCheckDataModelVersion: '2.0.0'
}));

function configureUrlSearchParamsMock(params: { [key: string]: string }) {
  urlSearchParamsSpy.mockImplementation((name: string) => {
    return params[name] || null;
  });
}

function configureUrlSearchParamsMockSuccess({
  code,
  stateParams
}: {
  code: string;
  stateParams?: Record<string, string>;
}) {
  const encodedState = stateParams
    ? new URLSearchParams(stateParams).toString()
    : undefined;

  configureUrlSearchParamsMock({
    code,
    state: encodedState ?? ''
  });
}

describe('LoginCallbackPage', () => {
  window.nhsapp = { tools: { isOpenInNHSApp: () => false } };
  const existingHealthChecks: IHealthCheck[] = [
    {
      id: '1234',
      dataModelVersion: '2.0.0',
      nhsNumber: '56565656',
      questionnaire: {}
    } as unknown as IHealthCheck
  ];

  const existingHealthChecksWithEligibility: IHealthCheck[] = [
    {
      id: '1234',
      dataModelVersion: '2.0.0',
      nhsNumber: '56565656',
      questionnaire: {
        hasReceivedAnInvitation: true,
        canCompleteHealthCheckOnline: true
      }
    } as unknown as IHealthCheck
  ];

  const postRequestSpy = jest.spyOn(httpClient, 'postRequest');

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
  const renderWithProviders = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[RoutePath.LoginCallbackPage]}>
          <Routes>
            <Route
              path={RoutePath.HomePage}
              element={
                <ProtectedRoute
                  healthCheckApiService={mockHealthCheckService}
                  patientInfoService={mockPatientInfoService}
                />
              }
            >
              <Route
                path={RoutePath.LoginCallbackPage}
                element={<LoginCallbackPage />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    configureUrlSearchParamsMockSuccess({ code: nhsLoginAuthCode });
  });

  afterEach(() => {
    mockHealthCheckService.getHealthChecksByToken.mockReset();
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockReset();
    mockedUseNavigate.mockReset();
    urlSearchParamsSpy.mockReset();
    postRequestSpy.mockReset();
    queryClient.clear();
  });

  it.each([
    { stateParams: { urlSource: 'nudge' } },
    { stateParams: { urlSource: 'initial-email' } },
    { stateParams: {} }
  ])(
    'correctly calls /login with s parameter if present (stateParams: %j)',
    async ({ stateParams }) => {
      const stringStateParams: Record<string, string> = Object.fromEntries(
        Object.entries(stateParams).map(([key, value]) => [
          key,
          value === undefined ? '' : String(value)
        ])
      );
      configureUrlSearchParamsMockSuccess({
        code: nhsLoginAuthCode,
        stateParams: stringStateParams
      });
      postRequestSpy.mockResolvedValue({});
      mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
        status: HttpCallStatus.Successful,
        healthChecks: existingHealthChecks
      });

      mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
        termsAccepted: true
      });

      // act
      renderWithProviders();

      // assert
      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith(
          RoutePath.EligibilityJourney,
          {
            replace: true
          }
        );
      });
      expectSpinnerDisplayed();
      expect(postRequestSpy).toHaveBeenCalledWith(
        expect.stringMatching('test.com/login'),
        expect.objectContaining({
          code: nhsLoginAuthCode,
          source: 'browser',
          ...stateParams
        })
      );
    }
  );

  function expectSpinnerDisplayed() {
    expect(screen.getByText('Spinner')).toBeInTheDocument();
  }

  it('redirects to TaskListPage page if there is an existing health check with newest T&Cs accepted and eligibility completed', async () => {
    // arrange
    postRequestSpy.mockResolvedValue({});
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: existingHealthChecksWithEligibility
    });

    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(RoutePath.TaskListPage, {
        replace: true
      });
    });
    expectSpinnerDisplayed();
  });

  it('redirects to Eligibility page if there is an existing health check with newest T&Cs accepted', async () => {
    // arrange
    postRequestSpy.mockResolvedValue({});
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: existingHealthChecks
    });

    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.EligibilityJourney,
        {
          replace: true
        }
      );
    });
    expectSpinnerDisplayed();
  });

  it('redirects to TermsAndConditions page if there is an existing health check without newest T&Cs accepted', async () => {
    // arrange
    postRequestSpy.mockResolvedValue({});
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: existingHealthChecks
    });

    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.TermsAndConditions,
        { replace: true }
      );
    });
    expectSpinnerDisplayed();
  });

  it(`redirects to ${RoutePath.HealthCheckExpiredPage} page if there is an existing health check on step AUTO_EXPIRED even when T&Cs not accepted`, async () => {
    // arrange
    postRequestSpy.mockResolvedValue({});
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: [
        {
          id: '1234',
          nhsNumber: '56565656',
          step: HealthCheckSteps.AUTO_EXPIRED
        } as unknown as IHealthCheck
      ]
    });

    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: false
    });

    // act
    renderWithProviders();

    // assert
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
    expectSpinnerDisplayed();
  });

  it(`redirects to ${RoutePath.HomePage} page if there is no existing health check`, async () => {
    // arrange
    postRequestSpy.mockResolvedValue({});
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.NotFound,
      healthChecks: []
    });
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(RoutePath.HomePage, {
        replace: true
      });
    });
    expectSpinnerDisplayed();
  });

  it(`redirects to ${RoutePath.NotEligiblePage} page when login status is 403`, async () => {
    // arrange
    postRequestSpy.mockRejectedValue({
      response: {
        status: 403,
        data: {
          reason: 'test'
        }
      }
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.NotEligiblePage,
        { replace: true }
      );
    });
    expectSpinnerDisplayed();
  });

  it(`redirects to ${RoutePath.OdsNhsNumberNotEligiblePage} page when login status is 403 and reason is ods-code-disabled`, async () => {
    // arrange
    postRequestSpy.mockRejectedValue({
      response: {
        status: 403,
        data: {
          reason: 'ods-code-disabled'
        }
      }
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.OdsNhsNumberNotEligiblePage,
        { replace: true }
      );
    });
    expectSpinnerDisplayed();
  });

  it(`redirects to ${RoutePath.OdsNhsNumberNotEligiblePage} page when login status is 403 and reason is nhs-number-not-allowed`, async () => {
    // arrange
    postRequestSpy.mockRejectedValue({
      response: {
        status: 403,
        data: {
          reason: 'nhs-number-not-allowed'
        }
      }
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.OdsNhsNumberNotEligiblePage,
        { replace: true }
      );
    });
    expectSpinnerDisplayed();
  });

  it(`redirects to ${RoutePath.NhsLoginErrorPage} page when login status is 500`, async () => {
    // arrange
    postRequestSpy.mockRejectedValue({ response: { status: 500 } });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.NhsLoginErrorPage,
        { replace: true }
      );
    });
  });

  it('Displays an error text on nhsLoginResponse error', async () => {
    // arrange
    const errorDescription = 'some error';
    urlSearchParamsSpy.mockImplementation((name: string) => {
      switch (name) {
        case 'error':
          return 'error';
        case 'error_description':
          return errorDescription;
        default:
          return null;
      }
    });

    // act
    renderWithProviders();

    expect(await screen.findByText('There was a problem')).toBeInTheDocument();
    expect(await screen.findByText(errorDescription)).toBeInTheDocument();
  });

  it(`navigates to ${RoutePath.ConsentNotGivenErrorPage} when errorDescription is ConsentNotGiven`, async () => {
    //Arrange
    configureUrlSearchParamsMock({
      error: 'error',
      error_description: 'ConsentNotGiven'
    });

    //Act
    renderWithProviders();

    // Assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.ConsentNotGivenErrorPage,
        { replace: true }
      );
    });
  });

  it(`navigates to ${RoutePath.NhsLoginErrorPage} when there is error with nhs login response`, async () => {
    //Arrange
    configureUrlSearchParamsMock({
      error: 'error',
      error_description: 'Some error'
    });

    //Act
    renderWithProviders();

    // Assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.NhsLoginErrorPage,
        { replace: true }
      );
    });
  });

  it(`redirects to ${RoutePath.NhsLoginErrorPage} page when p9 authentication failed`, async () => {
    // arrange
    postRequestSpy.mockRejectedValue({
      response: {
        status: 403,
        data: {
          reason: 'patient-ineligible-identity-proofing-level'
        }
      }
    });

    // act
    renderWithProviders();

    // assert
    await waitFor(() => {
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.NhsLoginErrorPage,
        { replace: true }
      );
    });
    expectSpinnerDisplayed();
  });
});
