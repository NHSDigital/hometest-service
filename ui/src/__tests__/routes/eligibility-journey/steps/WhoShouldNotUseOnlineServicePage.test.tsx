import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import {
  type IEligibility,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import WhoShouldNotUseOnlineServicePage, {
  type WhoShouldNotUseOnlineServicePageProps
} from '../../../../routes/eligibility-journey/steps/WhoShouldNotUseOnlineServicePage';

jest.mock('../../../../lib/components/event-audit-button');
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('WhoShouldNotUseOnlineServicePage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';
  const updateHealthCheckAnswers: jest.Mock = jest.fn();
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const healthCheckAnswers: IEligibility = {
    hasReceivedAnInvitation: null,
    hasCompletedHealthCheckInLast5Years: null,
    hasPreExistingCondition: null,
    canCompleteHealthCheckOnline: null
  };

  const props: WhoShouldNotUseOnlineServicePageProps = {
    healthCheckAnswers: healthCheckAnswers,
    updateHealthCheckAnswers,
    healthCheck,
    patientId
  };

  it('Shows error when submitting form without choosing an answer.', () => {
    render(<WhoShouldNotUseOnlineServicePage {...props} />);

    clickContinueButton();

    const errorMessages = screen.getAllByText(
      'Select yes if you need to leave the online service'
    );
    expect(errorMessages).toHaveLength(2); // same errors appears in two places on the page
    errorMessages.forEach((errorMessage) => {
      expect(errorMessage).toBeVisible();
    });
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  it("Navigates forward and emits audit events if user selects 'No'.", async () => {
    render(<WhoShouldNotUseOnlineServicePage {...props} />);

    clickRadioButton('No');
    clickContinueButton();

    await processPendingAwaits();

    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PatientNoExclusions,
        healthCheck,
        patientId
      })
    );
    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.SectionCompleteEligibility,
        healthCheck,
        patientId
      })
    );
    expect(updateHealthCheckAnswers).toHaveBeenCalledTimes(1);

    expect(updateHealthCheckAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        canCompleteHealthCheckOnline: true
      })
    );
  });

  it("Navigates forward and emits audit events if user selects 'Yes'.", async () => {
    render(<WhoShouldNotUseOnlineServicePage {...props} />);

    clickRadioButton('Yes');
    clickContinueButton();

    await processPendingAwaits();

    expect(setIsPageInErrorMock).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PatientIneligibleExclusions,
        healthCheck,
        patientId
      })
    );

    expect(updateHealthCheckAnswers).toHaveBeenCalledTimes(1);

    expect(updateHealthCheckAnswers).toHaveBeenCalledWith(
      expect.objectContaining({
        canCompleteHealthCheckOnline: false
      })
    );

    await waitFor(() =>
      expect(mockTriggerAuditEvent).not.toHaveBeenCalledWith({
        eventType: AuditEventType.SectionCompleteEligibility,
        healthCheck,
        patientId
      })
    );
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
