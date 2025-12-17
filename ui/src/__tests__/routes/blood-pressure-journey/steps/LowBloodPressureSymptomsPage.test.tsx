import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  BloodPressureLocation,
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import LowBloodPressureSymptomsPage from '../../../../routes/blood-pressure-journey/steps/low-blood-pressure/LowBloodPressureSymptomsPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

jest.mock('../../../../lib/components/event-audit-button');
const updateHealthCheckAnswersMock = jest.fn();
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('LowBloodPressureSymptomsPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';
  const radioButtonTrueText = 'Yes, I do';
  const radioButtonFalseText = 'No, I do not';
  const continueButtonText = 'Continue';
  let setIsPageInErrorMock: jest.Mock;

  const healthCheckAnswers: any = {
    bloodPressureSystolic: 85,
    bloodPressureDiastolic: 55,
    bloodPressureLocation: BloodPressureLocation.Monitor,
    hasStrongLowBloodPressureSymptoms: null
  } as IBloodPressure;

  beforeEach(() => {
    updateHealthCheckAnswersMock.mockReset();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  it('renders the component with initial state', () => {
    render(
      <LowBloodPressureSymptomsPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    expect(
      screen.getByText(`Do you have symptoms of fainting or dizziness?`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `For example, passing out for short periods of time, feeling lightheaded or off-balance.`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(radioButtonTrueText)).toBeInTheDocument();
    expect(screen.getByText(radioButtonFalseText)).toBeInTheDocument();
  });

  it('hasStrongLowBloodPressureSymptoms set to true after continue button pressed', async () => {
    render(
      <LowBloodPressureSymptomsPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );
    const trueRadioButton = screen.getByText(radioButtonTrueText);
    await userEvent.click(trueRadioButton);

    const element = screen.getByText(continueButtonText);
    await userEvent.click(element);
    expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
      hasStrongLowBloodPressureSymptoms: true
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.LowBloodPressureSymptoms,
      healthCheck,
      patientId,
      details: {
        bpSymptoms: 'Yes'
      }
    });
  });

  it('hasStrongLowBloodPressureSymptoms set to false after continue button pressed', async () => {
    render(
      <LowBloodPressureSymptomsPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );
    const trueRadioButton = screen.getByText(radioButtonFalseText);
    await userEvent.click(trueRadioButton);

    const element = screen.getByText(continueButtonText);
    await userEvent.click(element);
    expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
      hasStrongLowBloodPressureSymptoms: false
    });
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.LowBloodPressureSymptoms,
      healthCheck,
      patientId,
      details: {
        bpSymptoms: 'No'
      }
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  it('Errors displayed if continue button pressed without a value selected', async () => {
    render(
      <LowBloodPressureSymptomsPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    const element = screen.getByText(continueButtonText);
    await userEvent.click(element);

    expect(screen.getByText(`There is a problem`)).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  it('After error displayed a user can select a value and update the health check', async () => {
    render(
      <LowBloodPressureSymptomsPage
        healthCheckAnswers={healthCheckAnswers}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    const element = screen.getByText(continueButtonText);
    await userEvent.click(element);

    expect(screen.getByText(`There is a problem`)).toBeInTheDocument();

    const trueRadioButton = screen.getByText(radioButtonTrueText);
    await userEvent.click(trueRadioButton);

    await userEvent.click(element);
    expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
      hasStrongLowBloodPressureSymptoms: true
    });
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.LowBloodPressureSymptoms,
      healthCheck,
      patientId,
      details: {
        bpSymptoms: 'Yes'
      }
    });
  });
});
