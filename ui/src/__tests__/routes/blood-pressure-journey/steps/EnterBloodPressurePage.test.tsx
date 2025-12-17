/* eslint-disable jest/no-conditional-expect */
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BloodPressureLocation,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import userEvent from '@testing-library/user-event';
import EnterBloodPressurePage from '../../../../routes/blood-pressure-journey/steps/EnterBloodPressurePage';
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

describe('EnterBloodPressurePage tests', () => {
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

  it('renders the form with all inputs empty answers if no healthCheck answers provided', async () => {
    render(
      <EnterBloodPressurePage
        healthCheckAnswers={{
          bloodPressureDiastolic: null,
          bloodPressureSystolic: null,
          bloodPressureLocation: null,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: null,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: false
        }}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    // assert
    expect(
      await screen.findByText(
        'After you take your blood pressure reading, enter it here to continue your NHS Health Check.'
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Systolic (the higher number)')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Systolic (the higher number)')).toHaveValue(
      ''
    );
    expect(
      await screen.findByText('Diastolic (the lower number)')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Diastolic (the lower number)')).toHaveValue(
      ''
    );
  });

  test.each([
    [BloodPressureLocation.Pharmacy, false],
    [BloodPressureLocation.Monitor, true]
  ])(
    'Renders the "blood pressure at home" sections based on bloodPressureLocation = %s',
    (
      location: BloodPressureLocation,
      areBloodPressureAtHomeHelpSectionsShown: boolean
    ) => {
      render(
        <EnterBloodPressurePage
          healthCheckAnswers={{
            bloodPressureDiastolic: null,
            bloodPressureSystolic: null,
            bloodPressureLocation: location,
            lowBloodPressureValuesConfirmed: null,
            highBloodPressureValuesConfirmed: null,
            hasStrongLowBloodPressureSymptoms: null,
            isBloodPressureSectionSubmitted: false
          }}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      // assert
      expect(
        screen.queryByText(
          'I need help measuring my blood pressure at home'
        ) !== null
      ).toBe(areBloodPressureAtHomeHelpSectionsShown);
      expect(
        screen.queryByText(
          "Take another reading a few minutes after your first reading to check it's accurate."
        ) !== null
      ).toBe(areBloodPressureAtHomeHelpSectionsShown);
    }
  );

  it('when blood pressure section was already completed, the values are pre-populated', async () => {
    // act
    render(
      <EnterBloodPressurePage
        healthCheckAnswers={{
          bloodPressureDiastolic: 80,
          bloodPressureSystolic: 100,
          bloodPressureLocation: null,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: null,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: false
        }}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );
    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(screen.getByLabelText('Systolic (the higher number)')).toHaveValue(
      '100'
    );
    expect(screen.getByLabelText('Diastolic (the lower number)')).toHaveValue(
      '80'
    );
  });

  test.each([
    // [systolicValue, systolicError, diastolicValue, diastolicError, boxErrorDescription]
    [null, 'Enter a systolic reading', null, 'Enter a diastolic reading', null],
    [
      20,
      'Systolic reading must be 70 or above',
      10,
      'Diastolic reading must be 40 or above',
      /Your systolic and diastolic readings are out of range used by the tool. Check your numbers and try again. If your numbers are correct call/
    ],
    [
      301,
      'Systolic reading must be 300 or below',
      201,
      'Diastolic reading must be 200 or below',
      /Your systolic and diastolic readings are out of range used by the tool. Check your numbers and try again. If your numbers are correct call/
    ],
    [
      69,
      'Systolic reading must be 70 or above',
      40,
      null,
      /Your systolic reading is out of range used by the tool. Check your number and try again. If your number is correct call/
    ],
    [
      301,
      'Systolic reading must be 300 or below',
      null,
      'Enter a diastolic reading',
      /Your systolic reading is out of range used by the tool. Check your number and try again. If your number is correct call/
    ],
    [
      null,
      'Enter a systolic reading',
      39,
      'Diastolic reading must be 40 or above',
      /Your diastolic reading is out of range used by the tool. Check your number and try again. If your number is correct call/
    ],
    [
      null,
      'Enter a systolic reading',
      201,
      'Diastolic reading must be 200 or below',
      /Your diastolic reading is out of range used by the tool. Check your number and try again. If your number is correct call/
    ],
    [
      100.5,
      'Systolic reading must be a whole number',
      80.5,
      'Diastolic reading must be a whole number',
      null
    ],
    [
      100,
      null,
      110,
      'Diastolic reading should be lower than your systolic reading',
      /The diastolic reading entered is the same or higher than the systolic reading. Check the number and try again. If your reading is correct call/
    ],
    [100, null, null, 'Enter a diastolic reading', null]
  ])(
    'When Systolic/Diastolic values are set incorrectly, the validation errors occur and answers are not saved [%#]',
    async (
      systolic: number | null,
      systolicError: string | null,
      diastolic: number | null,
      diastolicError: string | null,
      boxErrorDescription: RegExp | null
    ) => {
      render(
        <EnterBloodPressurePage
          healthCheckAnswers={{
            bloodPressureDiastolic: diastolic,
            bloodPressureSystolic: systolic,
            bloodPressureLocation: null,
            lowBloodPressureValuesConfirmed: null,
            highBloodPressureValuesConfirmed: null,
            hasStrongLowBloodPressureSymptoms: null,
            isBloodPressureSectionSubmitted: false
          }}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const continueElement = screen.getByText('Continue');
      await userEvent.click(continueElement);
      expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
      if (systolicError) {
        expect(await screen.findAllByText(systolicError)).toHaveLength(2);
      }
      if (diastolicError) {
        expect(await screen.findAllByText(diastolicError)).toHaveLength(2);
      }
      if (boxErrorDescription) {
        expect(
          await screen.findByText(boxErrorDescription)
        ).toBeInTheDocument();
      }
      expect(mockTriggerAuditEvent).not.toHaveBeenCalled();
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    }
  );

  test.each([
    // [systolicValue, systolicError, diastolicValue, diastolicError, boxErrorDescription]
    [
      301,
      'Systolic reading must be 300 or below',
      201,
      'Diastolic reading must be 200 or below',
      /Your systolic and diastolic readings are out of range used by the tool. Check your numbers and try again. If your numbers are correct call/
    ],
    [
      300,
      null,
      201,
      'Diastolic reading must be 200 or below',
      /Your diastolic reading is out of range used by the tool. Check your number and try again. If your number is correct call/
    ],
    [
      301,
      'Systolic reading must be 300 or below',
      200,
      null,
      /Your systolic reading is out of range used by the tool. Check your number and try again. If your number is correct call/
    ],
    [null, 'Enter a systolic reading', null, 'Enter a diastolic reading', null]
  ])(
    'When one Systolic/Diastolic values is set incorrectly, there is an arror message only for the incorrect value and answers are not saved [%#]',
    async (
      systolic: number | null,
      systolicError: string | null,
      diastolic: number | null,
      diastolicError: string | null,
      boxErrorDescription: RegExp | null
    ) => {
      render(
        <EnterBloodPressurePage
          healthCheckAnswers={{
            bloodPressureDiastolic: diastolic,
            bloodPressureSystolic: systolic,
            bloodPressureLocation: null,
            lowBloodPressureValuesConfirmed: null,
            highBloodPressureValuesConfirmed: null,
            hasStrongLowBloodPressureSymptoms: null,
            isBloodPressureSectionSubmitted: false
          }}
          healthCheck={healthCheck}
          patientId={patientId}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const continueElement = screen.getByText('Continue');
      await userEvent.click(continueElement);
      expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
      if (systolicError === null && diastolicError === null) {
        expect(
          await screen.findByText('Enter a systolic reading')
        ).toBeInTheDocument();
        expect(
          await screen.findByText('Enter a diastolic reading')
        ).toBeInTheDocument();
      }
      if (systolicError) {
        expect(await screen.findAllByText(systolicError)).toHaveLength(2);
      }
      if (diastolicError) {
        expect(await screen.findAllByText(diastolicError)).toHaveLength(2);
      }
      if (boxErrorDescription) {
        expect(
          await screen.findByText(boxErrorDescription)
        ).toBeInTheDocument();
      }
      expect(mockTriggerAuditEvent).not.toHaveBeenCalled();
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    }
  );

  it('when blood pressure correct then saves the correct result', async () => {
    // act
    render(
      <EnterBloodPressurePage
        healthCheckAnswers={{
          bloodPressureDiastolic: null,
          bloodPressureSystolic: null,
          bloodPressureLocation: BloodPressureLocation.Monitor,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: null,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: false
        }}
        healthCheck={healthCheck}
        patientId={patientId}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );
    const systolicInput = screen.getByLabelText('Systolic (the higher number)');
    const diastolicInput = screen.getByLabelText(
      'Diastolic (the lower number)'
    );

    fireEvent.change(systolicInput, { target: { value: '110' } });
    fireEvent.change(diastolicInput, { target: { value: '60' } });

    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(systolicInput).toHaveValue('110');
    expect(diastolicInput).toHaveValue('60');
    expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
      bloodPressureDiastolic: 60,
      bloodPressureSystolic: 110
    });
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.BloodPressureEntered,
      healthCheck,
      patientId,
      details: {
        bpRoute: 'Standard',
        bpTakenAt: BloodPressureLocation.Monitor
      }
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });
});
