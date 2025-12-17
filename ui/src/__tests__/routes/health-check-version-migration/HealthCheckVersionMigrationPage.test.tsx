import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HealthCheckVersionMigration from '../../../routes/health-check-version-migration/HealthCheckVersionMigrationPage';

import { HttpCallStatus } from '../../../services/health-check-service';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import { RoutePath } from '../../../lib/models/route-paths';
import { AuditEventType } from '@dnhc-health-checks/shared';

const mockedUseNavigate = jest.fn();
jest.mock('../../../hooks/healthCheckHooks');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));

jest.mock('../../../settings', () => ({
  ...jest.requireActual('../../../settings'),
  healthCheckDataModelVersion: '2.0.0'
}));

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => ({ triggerAuditEvent: mockTriggerAuditEvent })
}));

describe('HealthCheckVersionMigration tests', () => {
  const healthCheckData = {
    id: '12345',
    nhsNumber: '56565656',
    dataModelVersion: '1.0.0',
    patientId: 'abcd12345'
  };

  let queryClient: QueryClient;

  let setIsPageInErrorMock: jest.Mock;

  const mockHealthCheckService = {
    getHealthCheckById: jest.fn(),
    updateHealthCheckQuestionnaireAnswers: jest.fn(),
    createHealthCheck: jest.fn(),
    getHealthChecksByToken: jest.fn(),
    runVersionMigration: jest.fn()
  };

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <HealthCheckVersionMigration
            healthCheckApiService={mockHealthCheckService}
          />
        </QueryClientProvider>
      </MemoryRouter>
    );

  beforeEach(() => {
    queryClient = new QueryClient();
    setIsPageInErrorMock = jest.fn();

    (useHealthCheck as jest.Mock).mockReturnValue({
      data: healthCheckData,
      isSuccess: true,
      isPending: false,
      isError: false
    });

    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });

    mockHealthCheckService.runVersionMigration.mockResolvedValue({
      status: HttpCallStatus.Successful
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('renders the page content correctly', () => {
    renderComponent();

    expect(
      screen.getByText('Your NHS Health Check online is incomplete')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Release: 1.0.0/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Release: 2.0.0/)).toBeInTheDocument();
    expect(screen.getByText(/Section: About You/)).toBeInTheDocument();
    expect(
      screen.getByText('New questions about your health and family history.')
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toHaveAttribute(
      'aria-describedby'
    );
  });

  it(`sends '${AuditEventType.HealthCheckDataModelVersionMigrationOpened}' event on page render`, async () => {
    renderComponent();

    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.HealthCheckDataModelVersionMigrationOpened,
        healthCheck: healthCheckData
      })
    );
  });

  it('renders error when continue pressed without checking the checkbox', async () => {
    renderComponent();

    await screen.findByText('Your NHS Health Check online is incomplete');
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-describedby');
  });

  it('navigates to the tasklist page after accepting change in version of the health check', async () => {
    renderComponent();

    await screen.findByText('Your NHS Health Check online is incomplete');

    fireEvent.click(
      screen.getByLabelText(
        /I understand that I need to review the updates and submit my answers to complete the NHS Health Check online./i
      )
    );

    fireEvent.click(screen.getByText('Continue'));
    expect(
      screen.queryByText(
        /Confirm that you understand that you need to review the updates and submit your answers to complete the NHS Health Check online./i
      )
    ).not.toBeInTheDocument();

    expect(mockHealthCheckService.runVersionMigration).toHaveBeenCalledWith(
      healthCheckData.id
    );

    await waitFor(() =>
      expect(mockedUseNavigate).toHaveBeenCalledWith(RoutePath.TaskListPage)
    );
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });
});
