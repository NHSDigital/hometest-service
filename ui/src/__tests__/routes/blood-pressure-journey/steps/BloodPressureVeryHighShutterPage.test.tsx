import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BloodPressureVeryHighShutterPage from '../../../../routes/blood-pressure-journey/steps/BloodPressureVeryHighShutterPage';
import {
  BloodPressureLocation,
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('BloodPressureVeryHighPage tests', () => {
  const bloodPressureSystolic = 200;
  const bloodPressureDiastolic = 90;
  const healthCheckAnswers: IBloodPressure = {
    bloodPressureSystolic,
    bloodPressureDiastolic,
    bloodPressureLocation: BloodPressureLocation.Monitor,
    lowBloodPressureValuesConfirmed: null,
    highBloodPressureValuesConfirmed: true,
    hasStrongLowBloodPressureSymptoms: null,
    isBloodPressureSectionSubmitted: false
  };
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  beforeEach(() => {
    mockTriggerAuditEvent.mockReset();
  });

  it('renders the component with initial state', () => {
    render(
      <BloodPressureVeryHighShutterPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    // Assert
    expect(
      screen.getByText('Your blood pressure reading is:')
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${bloodPressureSystolic}/${bloodPressureDiastolic}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "If you're currently being treated for high blood pressure follow your doctor's advice. If you did not get any advice, contact your doctor."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ask for an urgent GP appointment if:')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Call 999 or go to A&E now if:')
    ).toBeInTheDocument();

    // Check links
    expect(
      screen.getByRole('link', {
        name: /^one one one/i
      })
    ).toHaveAttribute('href', 'tel:111');
    expect(
      screen.getByRole('link', {
        name: /Call one one one/i
      })
    ).toHaveAttribute('href', 'tel:111');
    expect(
      screen.getByRole('link', {
        name: /Find your nearest A&E/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/'
    );
    expect(
      screen.getByRole('link', {
        name: /Read about treatment for high blood pressure/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/treatment/'
    );
  });

  it('should call EventAuditClient on render', () => {
    render(
      <BloodPressureVeryHighShutterPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    // assert
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.UrgentHighBloodPressure,
      healthCheck,
      patientId
    });
  });
});
