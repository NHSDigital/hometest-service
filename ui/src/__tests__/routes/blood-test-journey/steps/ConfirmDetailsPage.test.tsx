import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ConfirmDetailsPage from '../../../../routes/blood-test-journey/steps/ConfirmDetailsPage';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../../lib/models/route-paths';
import patientInfoService, {
  type IPatientInfo
} from '../../../../services/patient-info-service';
import { type IHealthCheckBloodTestOrder } from '@dnhc-health-checks/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate
}));
jest.mock('../../../../services/patient-info-service', () => ({
  getCachedOrFetchPatientInfo: jest.fn()
}));

describe('ConfirmDetailsPage tests', () => {
  const patient: IPatientInfo = {
    firstName: 'Jan',
    lastName: 'Nowak',
    termsAccepted: true
  };
  const bloodTest: IHealthCheckBloodTestOrder = {
    address: {
      addressLine1: 'line1',
      addressLine2: 'line2',
      addressLine3: 'line3',
      postcode: 'ABC 123',
      townCity: 'city'
    },
    phoneNumber: '07771900900',
    isBloodTestSectionSubmitted: true
  };

  const getPatientInfoMock =
    patientInfoService.getCachedOrFetchPatientInfo as jest.Mock;
  const submitAnswers = jest.fn().mockImplementation(() => {
    return { isSubmitValid: true };
  });

  beforeEach(() => {
    getPatientInfoMock.mockResolvedValue(patient);
  });

  afterEach(() => {
    getPatientInfoMock.mockReset();
  });

  it('renders the component with initial state', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <ConfirmDetailsPage
            bloodTestOrder={bloodTest}
            submitAnswers={submitAnswers}
          />
        </BrowserRouter>
      </QueryClientProvider>
    );
    await waitForTitle('Confirm your details');

    // Assert
    expect(
      screen.getByText(
        'This is the address we will send your blood test kit to.'
      )
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /change/i })[0]).toHaveAttribute(
      'href',
      `${getStepUrl(RoutePath.BloodTestJourney, JourneyStepNames.EnterAddressPage)}`
    );
    expect(screen.getByText('UK mobile phone number')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /change/i })[1]).toHaveAttribute(
      'href',
      `${getStepUrl(RoutePath.BloodTestJourney, JourneyStepNames.EnterPhoneNumberPage)}`
    );
    expect(screen.getByText(/Jan Nowak/i)).toBeInTheDocument();
    expect(screen.getByText(/line1/i)).toBeInTheDocument();
    expect(screen.getByText(/line2/i)).toBeInTheDocument();
    expect(screen.getByText(/line3/i)).toBeInTheDocument();
    expect(screen.getByText(/city/i)).toBeInTheDocument();
    expect(screen.getByText(/ABC 123/i)).toBeInTheDocument();
    expect(screen.getByText(/07771900900/i)).toBeInTheDocument();
    expect(getPatientInfoMock).toHaveBeenCalled();
  });

  it('should submit answers on Save and continue button click', async () => {
    // arrange
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <ConfirmDetailsPage submitAnswers={submitAnswers} />
        </BrowserRouter>
      </QueryClientProvider>
    );
    await waitForTitle('Confirm your details');

    const element = screen.getByText('Confirm and order blood test');

    // act
    await userEvent.click(element);

    // assert
    expect(submitAnswers).toHaveBeenCalled();
  });
});

async function waitForTitle(pageTitle: string): Promise<void> {
  await screen.findByText(pageTitle);
}
