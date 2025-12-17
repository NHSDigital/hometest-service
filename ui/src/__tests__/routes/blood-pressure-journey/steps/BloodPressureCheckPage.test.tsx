import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BloodPressureCheckPage from '../../../../routes/blood-pressure-journey/steps/BloodPressureCheckPage';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('BloodPressureCheckPage tests', () => {
  const mockUpdateHealthCheckAnswers = jest.fn();
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  afterEach(() => {
    mockUpdateHealthCheckAnswers.mockReset();
    mockTriggerAuditEvent.mockReset();
  });

  it('renders the component with initial state', () => {
    render(
      <BrowserRouter>
        <BloodPressureCheckPage
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Check your blood pressure')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We need your blood pressure reading to help calculate your risk of developing heart disease.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can get a free blood pressure reading at a clinic or pharmacy. You can also check your blood pressure with a monitor at home.'
      )
    ).toBeInTheDocument();

    // Check links
    expect(
      screen.getByRole('link', {
        name: /Find a pharmacy that offers free blood pressure checks/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/nhs-services/pharmacies/find-a-pharmacy-that-offers-free-blood-pressure-checks/'
    );
    expect(
      screen.getByRole('link', {
        name: /I cannot take my blood pressure reading/i
      })
    ).toBeInTheDocument();
  });

  it('should call onContinue method on continue button click', async () => {
    // arrange
    render(
      <BrowserRouter>
        <BloodPressureCheckPage
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getByText('Continue');

    // act
    await userEvent.click(element);

    // assert
    expect(mockUpdateHealthCheckAnswers).toHaveBeenCalled();
  });

  it('should send an event upon clicking the cannot take blood reading link', async () => {
    // arrange
    render(
      <BrowserRouter>
        <BloodPressureCheckPage
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getByRole('link', {
      name: /I cannot take my blood pressure reading/i
    });

    // act
    await userEvent.click(element);

    // assert
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.BloodPressureReadingDeclined,
      healthCheck,
      patientId
    });
  });

  it('should send an event upon clicking the Find a pharmacy link', async () => {
    // arrange
    render(
      <BrowserRouter>
        <BloodPressureCheckPage
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const element = screen.getByRole('link', {
      name: /Find a pharmacy that offers free blood pressure checks/i
    });

    // act
    await userEvent.click(element);

    // assert
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PharmacySearchOpened,
      healthCheck,
      patientId
    });
  });
});
