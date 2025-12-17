import { render, screen } from '@testing-library/react';
import { GiveFeedbackSection } from '../../../lib/components/give-feedback-section';
import { type IHealthCheck } from '@dnhc-health-checks/shared';
import userEvent from '@testing-library/user-event';

const mockAuditEvent = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockAuditEvent
    };
  }
}));

describe('GiveFeedbackSection', () => {
  const healthCheck: IHealthCheck = {
    id: '123456',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = '123456';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with proper text', () => {
    render(
      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    );

    expect(
      screen.getByText('Help us improve this service')
    ).toBeInTheDocument();
    const button = screen.getByText('Give feedback');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('nhsuk-button');
  });

  it('calls triggerAuditEvent when button is clicked', async () => {
    render(
      <GiveFeedbackSection healthCheck={healthCheck} patientId={patientId} />
    );

    const button = screen.getByText('Give feedback');
    await userEvent.click(button);

    expect(mockAuditEvent).toHaveBeenCalledTimes(1);
    expect(mockAuditEvent).toHaveBeenCalledWith({
      eventType: 'UserFeedbackSurveyOpened',
      healthCheck,
      patientId
    });
  });

  it('does not call triggerAuditEvent when logAuditEvent is false', async () => {
    render(
      <GiveFeedbackSection
        healthCheck={healthCheck}
        patientId={patientId}
        logAuditEvent={false}
      />
    );

    const button = screen.getByText('Give feedback');
    await userEvent.click(button);

    expect(mockAuditEvent).toHaveBeenCalledTimes(0);
  });
});
