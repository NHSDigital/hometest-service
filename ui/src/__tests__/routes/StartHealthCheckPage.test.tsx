import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpCallStatus } from '../../services/health-check-service';
import type { IHealthCheck } from '@dnhc-health-checks/shared';
import StartHealthCheckPage from '../../routes/StartHealthCheckPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Router } from 'react-router';
import { RoutePath } from '../../lib/models/route-paths';
import { createMemoryHistory } from 'history';

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));

describe('StartHealthCheckPage tests', () => {
  const existingHealthChecks: IHealthCheck[] = [
    {
      id: '1234',
      nhsNumber: '56565656'
    } as unknown as IHealthCheck
  ];

  const mockHealthCheckService = {
    getHealthCheckById: jest.fn(),
    updateHealthCheckQuestionnaireAnswers: jest.fn(),
    createHealthCheck: jest.fn(),
    getHealthChecksByToken: jest.fn()
  };

  const mockPatientInfoService = {
    getPatientInfo: jest.fn(),
    updatePatientInfo: jest.fn()
  };

  beforeEach(() => {
    mockedUseNavigate.mockReset();
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: existingHealthChecks
    });
    mockPatientInfoService.getPatientInfo.mockResolvedValue({
      termsAccepted: true
    });
  });

  afterEach(() => {
    mockHealthCheckService.getHealthChecksByToken.mockReset();
    mockPatientInfoService.getPatientInfo.mockReset();
  });

  test('renders the correct content', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <StartHealthCheckPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // assert
    await waitFor(async () => {
      expect(
        await screen.findByText('Get your NHS Health Check online')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /Take the NHS Health Check online at home, at your own pace/
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/How it works/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Start now/i })
    ).toBeInTheDocument();
  });

  it(`when Start now button clicked then should navigate to ${RoutePath.TermsAndConditions}`, async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <StartHealthCheckPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
    await waitFor(async () => {
      expect(await screen.findByText('Start now')).toBeInTheDocument();
    });
    const element = screen.getByText('Start now');

    // act
    await userEvent.click(element);

    // assert
    expect(mockedUseNavigate).toHaveBeenCalledWith(
      RoutePath.TermsAndConditions
    );
  });

  it(`When About this software link clicked then should navigate to ${RoutePath.AboutThisSoftwarePage}`, async () => {
    const history = createMemoryHistory({ initialEntries: ['/'] });
    render(
      <Router location={history.location} navigator={history}>
        <QueryClientProvider client={new QueryClient()}>
          <StartHealthCheckPage />
        </QueryClientProvider>
      </Router>
    );
    await waitFor(async () => {
      expect(
        await screen.findByText('About this software')
      ).toBeInTheDocument();
    });
    const element = screen.getByText('About this software');

    // act
    await userEvent.click(element);

    // assert
    expect(history.location.pathname).toBe(RoutePath.AboutThisSoftwarePage);
  });
});
