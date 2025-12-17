import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsAndConditions from '../../../routes/terms-and-conditions-journey/TermsAndConditionsPage';
import { type IHealthCheck, AuditEventType } from '@dnhc-health-checks/shared';
import { HttpCallStatus } from '../../../services/health-check-service';
import { RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CacheKeys } from '../../../lib/models/cache-keys';

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => ({ triggerAuditEvent: mockTriggerAuditEvent })
}));

jest.mock('../../../settings', () => ({
  ...jest.requireActual('../../../settings'),
  termsAndConditionsVersion: '1.0'
}));

describe('TermsAndConditions tests', () => {
  let setIsPageInErrorMock: jest.Mock;
  let queryClient: QueryClient;

  const existingHealthChecks: IHealthCheck[] = [
    { id: '1234', nhsNumber: '56565656', questionnaire: {} } as IHealthCheck
  ];

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

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <TermsAndConditions
            healthCheckApiService={mockHealthCheckService}
            patientInfoService={mockPatientInfoService}
          />
        </QueryClientProvider>
      </MemoryRouter>
    );

  beforeEach(() => {
    queryClient = new QueryClient();
    setIsPageInErrorMock = jest.fn();

    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: existingHealthChecks
    });
    mockPatientInfoService.updatePatientInfo.mockResolvedValue({
      statusCode: '200'
    });
    mockPatientInfoService.getCachedOrFetchPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  test('displays error when the checkbox is not checked and button is clicked', async () => {
    renderComponent();

    await screen.findByText('Accept terms of use');
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-describedby');
  });

  test('does not display error when the checkbox is checked and button is clicked', async () => {
    renderComponent();

    await screen.findByText('Accept terms of use');

    fireEvent.click(screen.getByLabelText(/I agree/i));
    fireEvent.click(screen.getByText('Continue'));

    expect(
      screen.queryByText(
        /Select if you have read and agree to the terms of use/i
      )
    ).not.toBeInTheDocument();

    expect(screen.getByRole('checkbox')).not.toHaveAttribute(
      'aria-describedby'
    );

    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test('navigates to eligibility when checkbox is checked and button is clicked with existing health checks', async () => {
    renderComponent();

    fireEvent.click(screen.getByLabelText(/I agree/i));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.EligibilityJourney
      )
    );
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartEligibility,
      healthCheck: existingHealthChecks[0]
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test('navigates to task page when checkbox is checked and button is clicked with existing health check and eligibility completed', async () => {
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: [
        {
          id: '1234',
          nhsNumber: '56565656',
          questionnaire: {
            hasReceivedAnInvitation: false,
            hasPreExistingCondition: false,
            hasCompletedHealthCheckInLast5Years: false,
            canCompleteHealthCheckOnline: true
          }
        } as IHealthCheck
      ]
    });
    renderComponent();

    fireEvent.click(screen.getByLabelText(/I agree/i));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(mockedUseNavigate).toHaveBeenCalledWith(RoutePath.TaskListPage)
    );
    expect(mockTriggerAuditEvent).not.toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartEligibility
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test(`sends '${AuditEventType.TermsAndConditionsOpened}' event on page render`, async () => {
    renderComponent();

    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.TermsAndConditionsOpened,
        details: { termsAndConditionsVersion: '1.0' }
      })
    );
  });

  test('creates and caches a new health check when it does not exist', async () => {
    const newHealthCheck = {
      id: 'new1234',
      nhsNumber: '12345678'
    } as IHealthCheck;
    mockHealthCheckService.createHealthCheck.mockResolvedValue(newHealthCheck);
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: []
    });

    renderComponent();

    fireEvent.click(screen.getByLabelText(/I agree/i));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.EligibilityJourney
      )
    );
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartEligibility,
      healthCheck: newHealthCheck
    });
    expect(queryClient.getQueryData([CacheKeys.HealthCheck])).toEqual(
      newHealthCheck
    );
  });

  test('handles error when creating a new health check fails', async () => {
    mockHealthCheckService.createHealthCheck.mockRejectedValue(
      new Error('Failed to create health check')
    );
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: []
    });

    renderComponent();

    fireEvent.click(screen.getByLabelText(/I agree/i));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.UnexpectedErrorPage
      )
    );
  });

  test('handles error when updating patient info fails', async () => {
    mockPatientInfoService.updatePatientInfo.mockRejectedValue(
      new Error('Failed to update patient info')
    );

    renderComponent();

    fireEvent.click(screen.getByLabelText(/I agree/i));
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() =>
      expect(mockedUseNavigate).toHaveBeenCalledWith(
        RoutePath.UnexpectedErrorPage
      )
    );
  });
});
