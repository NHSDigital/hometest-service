import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  BloodPressureLocation,
  type IBloodPressure,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import ConfirmBloodPressureReadingPage from '../../../../routes/blood-pressure-journey/steps/ConfirmBloodPressureReadingPage';
import userEvent from '@testing-library/user-event';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
const updateHealthCheckAnswersMock = jest.fn();
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('ConfirmBloodPressureReadingPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    updateHealthCheckAnswersMock.mockReset();
    mockTriggerAuditEvent.mockReset();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  describe('Low blood pressure', () => {
    const lowBloodPressureHealthCheckAnswers: any = {
      bloodPressureSystolic: 85,
      bloodPressureDiastolic: 55,
      bloodPressureLocation: BloodPressureLocation.Monitor,
      lowBloodPressureValuesConfirmed: null,
      highBloodPressureValuesConfirmed: null
    } as IBloodPressure;

    it('renders the component with initial state', () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={lowBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      expect(
        screen.getByText(
          `You told us your blood pressure reading is ${lowBloodPressureHealthCheckAnswers.bloodPressureSystolic}/${lowBloodPressureHealthCheckAnswers.bloodPressureDiastolic}. Is this correct?`
        )
      ).toBeInTheDocument();

      expect(screen.getByText(`Yes, it's correct`)).toBeInTheDocument();
      expect(screen.getByText(`No, I need to change it`)).toBeInTheDocument();
    });

    it('lowBloodPressureValuesConfirmed set to true after continue button pressed', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={lowBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );
      const trueRadioButton = screen.getByText(`Yes, it's correct`);
      await userEvent.click(trueRadioButton);

      const element = screen.getByText('Continue');
      await userEvent.click(element);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        lowBloodPressureValuesConfirmed: true,
        highBloodPressureValuesConfirmed: null
      });
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodPressureConfirmation,
        healthCheck,
        patientId,
        details: {
          bpConfirmed: 'Yes'
        }
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    });

    it('lowBloodPressureValuesConfirmed set to false after continue button pressed', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={lowBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );
      const trueRadioButton = screen.getByText(`No, I need to change it`);
      await userEvent.click(trueRadioButton);

      const element = screen.getByText('Continue');
      await userEvent.click(element);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        lowBloodPressureValuesConfirmed: false,
        highBloodPressureValuesConfirmed: null
      });
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodPressureConfirmation,
        healthCheck,
        patientId,
        details: {
          bpConfirmed: 'No'
        }
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    });

    it('Errors displayed if continue button pressed without a value selected', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={lowBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const element = screen.getByText('Continue');
      await userEvent.click(element);

      expect(screen.getByText(`There is a problem`)).toBeInTheDocument();
      expect(mockTriggerAuditEvent).not.toHaveBeenCalled();
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    });

    it('After error displayed a user can select a value and update the health check', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={lowBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const element = screen.getByText('Continue');
      await userEvent.click(element);

      expect(screen.getByText(`There is a problem`)).toBeInTheDocument();

      const trueRadioButton = screen.getByText(`Yes, it's correct`);
      await userEvent.click(trueRadioButton);

      await userEvent.click(element);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        lowBloodPressureValuesConfirmed: true,
        highBloodPressureValuesConfirmed: null
      });
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodPressureConfirmation,
        healthCheck,
        patientId,
        details: {
          bpConfirmed: 'Yes'
        }
      });
    });
  });

  describe('High blood pressure', () => {
    const highBloodPressureHealthCheckAnswers: any = {
      bloodPressureSystolic: 180,
      bloodPressureDiastolic: 130,
      bloodPressureLocation: BloodPressureLocation.Monitor,
      lowBloodPressureValuesConfirmed: null,
      highBloodPressureValuesConfirmed: null
    } as IBloodPressure;

    it('highBloodPressureValuesConfirmed set to true after continue button pressed', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={highBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );
      const trueRadioButton = screen.getByText(`Yes, it's correct`);
      await userEvent.click(trueRadioButton);

      const element = screen.getByText('Continue');
      await userEvent.click(element);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        highBloodPressureValuesConfirmed: true,
        lowBloodPressureValuesConfirmed: null
      });
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodPressureConfirmation,
        healthCheck,
        patientId,
        details: {
          bpConfirmed: 'Yes'
        }
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    });

    it('highBloodPressureValuesConfirmed set to false after continue button pressed', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheck={healthCheck}
          patientId={patientId}
          healthCheckAnswers={highBloodPressureHealthCheckAnswers}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );
      const trueRadioButton = screen.getByText(`No, I need to change it`);
      await userEvent.click(trueRadioButton);

      const element = screen.getByText('Continue');
      await userEvent.click(element);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        highBloodPressureValuesConfirmed: false,
        lowBloodPressureValuesConfirmed: null
      });
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodPressureConfirmation,
        healthCheck,
        patientId,
        details: {
          bpConfirmed: 'No'
        }
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    });

    it('Errors displayed if continue button pressed without a value selected', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={highBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const element = screen.getByText('Continue');
      await userEvent.click(element);

      expect(screen.getByText(`There is a problem`)).toBeInTheDocument();
      expect(mockTriggerAuditEvent).not.toHaveBeenCalled();
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    });

    it('After error displayed a user can select a value and update the health check', async () => {
      render(
        <ConfirmBloodPressureReadingPage
          healthCheckAnswers={highBloodPressureHealthCheckAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const element = screen.getByText('Continue');
      await userEvent.click(element);

      expect(screen.getByText(`There is a problem`)).toBeInTheDocument();

      const trueRadioButton = screen.getByText(`Yes, it's correct`);
      await userEvent.click(trueRadioButton);

      await userEvent.click(element);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        highBloodPressureValuesConfirmed: true,
        lowBloodPressureValuesConfirmed: null
      });
      expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
        eventType: AuditEventType.BloodPressureConfirmation,
        healthCheck,
        patientId,
        details: {
          bpConfirmed: 'Yes'
        }
      });
    });
  });
});
