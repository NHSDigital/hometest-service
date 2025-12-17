import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NeedBloodPressurePage from '../../../../routes/blood-pressure-journey/steps/NeedBloodPressurePage';
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

describe('NeedBloodPressurePage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  afterEach(() => {
    mockTriggerAuditEvent.mockReset();
  });

  it('renders the component with initial state', () => {
    render(
      <NeedBloodPressurePage healthCheck={healthCheck} patientId={patientId} />
    );

    // Assert
    expect(
      screen.getByText('We need your blood pressure reading to continue')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'To complete your NHS Health Check online we need your blood pressure reading.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can search online for a pharmacy that offers free blood pressure checks.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you would prefer to complete your NHS Health Check in person with your GP, contact your surgery and make an appointment.'
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
        name: /Read NHS guidance about high blood pressure/i
      })
    ).toHaveAttribute(
      'href',
      'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/'
    );
  });

  it('should send an event upon clicking the Find a pharmacy link', async () => {
    // arrange
    render(
      <NeedBloodPressurePage healthCheck={healthCheck} patientId={patientId} />
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
