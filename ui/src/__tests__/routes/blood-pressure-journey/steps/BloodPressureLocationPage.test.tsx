import { render, screen } from '@testing-library/react';
import BloodPressureLocationPage from '../../../../routes/blood-pressure-journey/steps/BloodPressureLocationPage';
import { BloodPressureLocation } from '@dnhc-health-checks/shared';
import userEvent from '@testing-library/user-event';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

const updateHealthCheckAnswersMock = jest.fn();

describe('BloodPressureLocationPage tests', () => {
  let setIsPageInErrorMock: jest.Mock;
  beforeEach(() => {
    updateHealthCheckAnswersMock.mockReset();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  it('renders the form with all options and empty answers if no healthCheck answers provided', async () => {
    render(
      <BloodPressureLocationPage
        healthCheckAnswers={{
          bloodPressureDiastolic: null,
          bloodPressureSystolic: null,
          bloodPressureLocation: null,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: null,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: null
        }}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    // assert
    expect(
      await screen.findByText(
        'Confirm where you will get a blood pressure reading'
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        EnumDescriptions.BloodPressureLocation[BloodPressureLocation.Pharmacy]
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        EnumDescriptions.BloodPressureLocation[BloodPressureLocation.Pharmacy]
      )
    ).not.toBeChecked();
    expect(
      await screen.findByText(
        EnumDescriptions.BloodPressureLocation[BloodPressureLocation.Monitor]
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        EnumDescriptions.BloodPressureLocation[BloodPressureLocation.Monitor]
      )
    ).not.toBeChecked();
  });

  it('when no option selected validation error occurs and data is not saved', async () => {
    // act
    render(
      <BloodPressureLocationPage
        healthCheckAnswers={{
          bloodPressureDiastolic: null,
          bloodPressureSystolic: null,
          bloodPressureLocation: null,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: null,
          hasStrongLowBloodPressureSymptoms: null,
          isBloodPressureSectionSubmitted: null
        }}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );
    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(
      await screen.findAllByText(
        'Select how you will take your blood pressure reading'
      )
    ).toHaveLength(2);
    expect(
      (
        await screen.findAllByText(
          'Select how you will take your blood pressure reading'
        )
      )[1]
    ).toBeVisible();
    expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  test.each([
    [BloodPressureLocation.Monitor],
    [BloodPressureLocation.Pharmacy]
  ])(
    'When "%s" is clicked then should save it as answer',
    async (answer: BloodPressureLocation) => {
      render(
        <BloodPressureLocationPage
          healthCheckAnswers={{
            bloodPressureDiastolic: null,
            bloodPressureSystolic: null,
            bloodPressureLocation: null,
            lowBloodPressureValuesConfirmed: null,
            highBloodPressureValuesConfirmed: null,
            hasStrongLowBloodPressureSymptoms: null,
            isBloodPressureSectionSubmitted: null
          }}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );
      const label = EnumDescriptions.BloodPressureLocation[answer];
      const element = screen.getByText(label);
      await userEvent.click(element);

      const continueElement = screen.getByText('Continue');
      await userEvent.click(continueElement);
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        bloodPressureLocation: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    [BloodPressureLocation.Monitor],
    [BloodPressureLocation.Pharmacy]
  ])(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: BloodPressureLocation) => {
      render(
        <BloodPressureLocationPage
          healthCheckAnswers={{
            bloodPressureDiastolic: null,
            bloodPressureSystolic: null,
            bloodPressureLocation: answer,
            lowBloodPressureValuesConfirmed: null,
            highBloodPressureValuesConfirmed: null,
            hasStrongLowBloodPressureSymptoms: null,
            isBloodPressureSectionSubmitted: null
          }}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );
      const label = EnumDescriptions.BloodPressureLocation[answer];
      const element: HTMLInputElement = screen.getByLabelText(label);
      expect(element).toBeChecked();
    }
  );
});
