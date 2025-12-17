import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage from '../../routes/HomePage';
import { NhsAppService } from '../../lib/nhs-app/NhsAppService';
import '@testing-library/jest-dom';
import { type IHealthCheck } from '@dnhc-health-checks/shared';
import { HttpCallStatus } from '../../services/health-check-service';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../lib/nhs-app/NhsAppService');
// Simulated redirector URL to NHS App homepage
const loginUrl =
  'https://nhsAppMockHomepage.com?redirect_to=https%3A%2F%2Fsome-env.dhctest.org%2Fsso';

describe('HomePage', () => {
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

  let mockCreateNhsAppRedirectorUri: jest.Mock;

  beforeEach(() => {
    mockCreateNhsAppRedirectorUri = jest
      .fn()
      .mockImplementation(() => loginUrl);
    const mockNhsAppService = {
      createNhsAppRedirectorUri: mockCreateNhsAppRedirectorUri
    } as any;
    (NhsAppService as jest.Mock).mockReturnValue(mockNhsAppService);
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' }
    });
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
    mockCreateNhsAppRedirectorUri.mockReset();
  });

  test('renders the correct content', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <HomePage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Get your NHS Health Check online')
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/The NHS Health Check is a free check-up of your health/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Doing your NHS Health Check online means you do not have to make a GP appointment/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Log in or open NHS App/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create an account/i })
    ).toBeInTheDocument();
  });

  describe.each([
    {
      description: 'without s parameter',
      location: { href: '', search: '' },
      expectedStateParams: { urlSource: undefined }
    },
    {
      description: 'with s parameter',
      location: { href: '', search: '?s=nudge' },
      expectedStateParams: { urlSource: 'nudge' }
    }
  ])('login button click $description', ({ location, expectedStateParams }) => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: location
      });
    });

    test.each([[/Log in or open NHS App/i], [/Create an account/i]])(
      'calls createNhsAppRedirectorUri with correct params and sets window.location.href to redirector on %s button click',
      async (buttonSelector: RegExp) => {
        render(
          <MemoryRouter>
            <QueryClientProvider client={new QueryClient()}>
              <HomePage />
            </QueryClientProvider>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(
            screen.getByText('Get your NHS Health Check online')
          ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: buttonSelector }));

        expect(mockCreateNhsAppRedirectorUri).toHaveBeenCalledWith(
          expectedStateParams
        );
        expect(window.location.href).toBe(loginUrl);
      }
    );
  });
});
