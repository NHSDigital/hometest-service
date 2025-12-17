import PreviousHealthCheckCompletedQueryPage, {
  type PreviousHealthCheckCompletedQueryPageProps
} from '../../../../routes/eligibility-journey/steps/PreviousHealthcheckCompletedQueryPage';
import {
  AuditEventType,
  type IEligibility,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
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

describe('PreviousHealthcheckCompletedQueryPage tests', () => {
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

  const props: PreviousHealthCheckCompletedQueryPageProps = {
    healthCheckAnswers: healthCheckAnswers,
    updateHealthCheckAnswers: async (value: Partial<IEligibility>) => {
      healthCheckAnswers = { ...healthCheckAnswers, ...value };
      return Promise.resolve();
    },
    healthCheck,
    patientId
  };

  it('Shows error when submitting form without choosing an answer.', () => {
    render(<PreviousHealthCheckCompletedQueryPage {...props} />);

    clickContinueButton();

    const errorMessages = screen.getAllByText(
      'Select yes if you have completed an NHS Health Check in the last 5 years'
    );
    expect(errorMessages).toHaveLength(2); // same errors appears in two places on the page
    errorMessages.forEach((errorMessage) => {
      expect(errorMessage).toBeVisible();
    });
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  it("Navigates forward if user selects 'Yes'.", async () => {
    render(<PreviousHealthCheckCompletedQueryPage {...props} />);

    clickRadioButton('Yes');
    clickContinueButton();

    await processPendingAwaits();

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientIneligibleHealthCheckInLastFiveYears,
      healthCheck,
      patientId
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  it("Navigates forward and emits audit events if user selects 'No'.", async () => {
    render(<PreviousHealthCheckCompletedQueryPage {...props} />);

    clickRadioButton('No');
    clickContinueButton();

    await processPendingAwaits();

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientNotCompletedHealthCheckInLastFiveYears,
      healthCheck,
      patientId
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
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
