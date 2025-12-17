import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventAuditButton } from '../../../lib/components/event-audit-button';
import { useAuditEvent } from '../../../hooks/eventAuditHook';
import { AuditEventType } from '@dnhc-health-checks/shared';

jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: jest.fn()
}));

describe('EventAuditButton', () => {
  const onClick = jest.fn().mockResolvedValue(true);
  const triggerAuditEvent = jest.fn();
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls onClick and sends the proper audit event when clicked', async () => {
    const auditEvents = [
      { eventType: AuditEventType.BloodTestOrdered, healthCheckId: '123456' }
    ];

    (useAuditEvent as jest.Mock).mockReturnValue({ triggerAuditEvent });

    render(
      <EventAuditButton auditEvents={auditEvents} onClick={onClick}>
        Save
      </EventAuditButton>
    );

    const button = screen.getByText('Save');

    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(button).toBeDisabled();

    jest.runAllTimers();

    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(triggerAuditEvent).toHaveBeenCalledWith(auditEvents[0])
    );
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('calls onClick and sends the all audit events if there are multiple when clicked', async () => {
    const auditEvents = [
      {
        eventType: AuditEventType.SectionCompleteBloodTest,
        healthCheckId: '123456'
      },
      { eventType: AuditEventType.HealthCheckCreated, healthCheckId: '123456' }
    ];
    render(
      <EventAuditButton onClick={onClick} auditEvents={auditEvents}>
        Save
      </EventAuditButton>
    );

    const button = screen.getByText('Save');

    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(button).toBeDisabled();

    jest.runAllTimers();
    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(triggerAuditEvent).toHaveBeenCalledWith(auditEvents[0])
    );
    await waitFor(() =>
      expect(triggerAuditEvent).toHaveBeenCalledWith(auditEvents[1])
    );
    await waitFor(() => expect(button).toBeEnabled());
  });
});
