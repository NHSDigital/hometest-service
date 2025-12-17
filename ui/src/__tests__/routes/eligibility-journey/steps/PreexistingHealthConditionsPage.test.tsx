import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreexistingHealthConditionsPage from '../../../../routes/eligibility-journey/steps/PreexistingHealthConditionsPage';
import {
  type IEligibility,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('PreexistingHealthConditions tests', () => {
  const healthCheck: IHealthCheck = {
    id: '123456',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';
  let hasPreExistingCondition = {} as IEligibility;
  let updateHealthCheckAnswers: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    hasPreExistingCondition = { hasPreExistingCondition: null } as IEligibility;
    updateHealthCheckAnswers = jest.fn();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('when not selecting an option and clicking continue, show error', () => {
    render(
      <PreexistingHealthConditionsPage
        healthCheckAnswers={hasPreExistingCondition}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(updateHealthCheckAnswers).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);

    expect(screen.getByText('Error:')).toBeVisible();
    const errorMessages = screen.getAllByText(
      'Select if you have have one or more of these pre-existing conditions'
    );
    expect(errorMessages).toHaveLength(2); // same errors appears in two places on the page
    errorMessages.forEach((errorMessage) => {
      expect(errorMessage).toBeVisible();
    });
  });

  test('when selecting no, it will submit successfully and return to task list and emit an event', async () => {
    render(
      <PreexistingHealthConditionsPage
        healthCheckAnswers={hasPreExistingCondition}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    const answerElement = screen.getByText('No');
    fireEvent.click(answerElement);

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
      hasPreExistingCondition: false
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PatientNoExistingConditions,
        healthCheck,
        patientId
      })
    );
  });

  test('when selecting yes, it will move the user to an ineligible screen, send an event and update that they have a pre-existing condition', async () => {
    render(
      <PreexistingHealthConditionsPage
        healthCheckAnswers={hasPreExistingCondition}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    const answerElement = screen.getByText('Yes');
    fireEvent.click(answerElement);

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
      hasPreExistingCondition: true
    });

    await waitFor(() =>
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.PatientIneligibleHasExistingConditions,
        healthCheck,
        patientId
      })
    );
  });
});
