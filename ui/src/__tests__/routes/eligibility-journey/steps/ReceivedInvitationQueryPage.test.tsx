import {
  type IHealthCheck,
  type IEligibility,
  AuditEventType
} from '@dnhc-health-checks/shared';
import { render, screen, fireEvent } from '@testing-library/react';
import ReceivedInvitationQueryPage, {
  type ReceivedInvitationQueryPageProps
} from '../../../../routes/eligibility-journey/steps/ReceivedInvitationQueryPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

jest.mock('../../../../lib/components/event-audit-button');
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('ReceivedInvitationQueryPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;

  const patientId = 'abcd12345';
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    mockTriggerAuditEvent.mockReset();
  });

  let healthCheckAnswers: IEligibility = {
    hasReceivedAnInvitation: null,
    hasCompletedHealthCheckInLast5Years: null,
    hasPreExistingCondition: null,
    canCompleteHealthCheckOnline: null
  };

  const props: ReceivedInvitationQueryPageProps = {
    healthCheckAnswers: healthCheckAnswers,
    updateHealthCheckAnswers: async (value: Partial<IEligibility>) => {
      healthCheckAnswers = { ...healthCheckAnswers, ...value };
      return Promise.resolve();
    },
    healthCheck,
    patientId
  };

  it('Shows error when submitting form without choosing an answer.', () => {
    render(<ReceivedInvitationQueryPage {...props} />);

    clickContinueButton();

    expect(
      screen.getAllByText(
        'Select if you have received an invitation from your GP surgery to do the Health Check online'
      )
    ).toHaveLength(2);
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  it('Submits form when clicking Yes radio button and Continue button.', async () => {
    render(<ReceivedInvitationQueryPage {...props} />);

    clickRadioButton('Yes');
    clickContinueButton();

    await processPendingAwaits();

    expect(healthCheckAnswers.hasReceivedAnInvitation).toBe(true);
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientInvited,
      healthCheck,
      patientId
    });
  });

  it('Submits form when clicking No radio button and Continue button.', async () => {
    render(<ReceivedInvitationQueryPage {...props} />);

    clickRadioButton('No');
    clickContinueButton();

    await processPendingAwaits();

    expect(healthCheckAnswers.hasReceivedAnInvitation).toBe(false);
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientNotInvited,
      healthCheck,
      patientId
    });
  });
});

function clickRadioButton(label: string) {
  const radioButton = screen.getByRole('radio', {
    name: label
  });
  fireEvent.click(radioButton);
}

function clickContinueButton() {
  const continueButton = screen.getByRole('button', { name: 'Continue' });
  fireEvent.click(continueButton);
}

async function processPendingAwaits() {
  await new Promise((resolve) => process.nextTick(resolve));
}
