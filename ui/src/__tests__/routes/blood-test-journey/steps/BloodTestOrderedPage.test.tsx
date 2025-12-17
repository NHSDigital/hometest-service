import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BloodTestOrderedPage from '../../../../routes/blood-test-journey/steps/BloodTestOrderedPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import patientInfoService, {
  type IPatientInfo
} from '../../../../services/patient-info-service';
import { type IHealthCheck } from '@dnhc-health-checks/shared';

jest.mock('../../../../services/patient-info-service', () => ({
  getCachedOrFetchPatientInfo: jest.fn()
}));
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('BloodTestOrderedPage tests', () => {
  const addressLines: string[] = [
    'line1',
    'line2',
    'city',
    'county',
    'ABC 123'
  ];
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3',
    questionnaireCompletionDate: '2023-10-01T00:00:00Z'
  } as any;
  const patientId = '456';
  const patient: IPatientInfo = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    termsAccepted: true
  };
  const formattedExpiryDate = '30 December 2023';
  const getPatientInfoMock =
    patientInfoService.getCachedOrFetchPatientInfo as jest.Mock;

  beforeEach(() => {
    getPatientInfoMock.mockResolvedValue(patient);
    mockTriggerAuditEvent.mockReset();
  });

  afterEach(() => {
    getPatientInfoMock.mockReset();
  });

  it('renders the component with initial state', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <BloodTestOrderedPage
            addressLines={addressLines}
            healthCheck={healthCheck}
            patientId={patientId}
          />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Assert
    await waitForTitle('Your blood test kit has been ordered');

    expect(screen.getByText('What happens next')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We will send a blood test kit with full instructions to:'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your test kit will be sent by Royal Mail. Test kits usually arrive in 2 to 4 working days.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Our NHS partner Thriva will send you email updates about the progress of your order. This will be to the email address you use for your NHS login.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you provided your mobile phone number, Thriva will also send you text message updates.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Send your blood sample to the lab as soon as you can. Your NHS Health Check will expire if we do not receive results back from the lab by ${formattedExpiryDate}.`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Notifications about your NHS Health Check results')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'We will contact you to let you know when your results are available.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your results will be shared with your GP and added to your health record.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you have the NHS App, check that you have push notifications switched on in your account settings.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Jan Kowalski/i)).toBeInTheDocument();
    expect(screen.getByText(/line1/i)).toBeInTheDocument();
    expect(screen.getByText(/line2/i)).toBeInTheDocument();
    expect(screen.getByText(/city/i)).toBeInTheDocument();
    expect(screen.getByText(/county/i)).toBeInTheDocument();
    expect(screen.getByText(/ABC 123/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /Blood test help and support/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/nhs-services/online-services/get-your-nhs-health-check-online/help-and-support/blood-tests'
    );
    expect(
      screen.getByRole('link', {
        name: /Manage notification settings/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/nhs-app/nhs-app-help-and-support/nhs-app-account-and-settings/managing-nhs-app-notifications/'
    );

    expect(getPatientInfoMock).toHaveBeenCalled();
  });
});

async function waitForTitle(pageTitle: string): Promise<void> {
  await screen.findByText(pageTitle);
}
