import { render, screen, fireEvent } from '@testing-library/react';
import HoursCycledPage from '../../../../routes/physical-activity-journey/steps/HoursCycledPage';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('HoursCycledPage', () => {
  const mockUpdateHealthCheckAnswers = jest.fn();
  const mockHealthCheckAnswers = {} as IPhysicalActivity;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  it('renders expected page contents', () => {
    render(
      <HoursCycledPage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );

    // heading
    expect(
      screen.getByText('How many hours do you cycle in a typical week?')
    ).toBeInTheDocument();

    // hint
    expect(
      screen.getByText('This includes commuting and cycling for pleasure')
    ).toBeInTheDocument();
  });

  it('displays error message when no cycle hours are selected', () => {
    render(
      <HoursCycledPage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );
    let errorMessage = screen.queryByText('There is a problem');
    expect(errorMessage).not.toBeInTheDocument();

    const submitButton: HTMLInputElement = screen.getByText('Continue');
    fireEvent.click(submitButton);

    errorMessage = screen.getByText('There is a problem');
    expect(errorMessage).toBeInTheDocument();
    expect(mockUpdateHealthCheckAnswers).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  it.each([
    [ExerciseHours.None],
    [ExerciseHours.LessThanOne],
    [ExerciseHours.BetweenOneAndThree],
    [ExerciseHours.LessThanOne]
  ])(
    'When %s is clicked then the radio button is checked and stores the data when submitted',
    (answer: ExerciseHours) => {
      render(
        <HoursCycledPage
          healthCheckAnswers={mockHealthCheckAnswers}
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
        />
      );

      const label = EnumDescriptions.ExerciseHours[answer];
      const radioButton: HTMLInputElement = screen.getByLabelText(label);
      const submitButton: HTMLInputElement = screen.getByText('Continue');

      expect(radioButton).not.toBeChecked();

      fireEvent.click(radioButton);
      fireEvent.click(submitButton);

      expect(radioButton).toBeChecked();
      expect(mockUpdateHealthCheckAnswers).toHaveBeenCalledWith({
        cycleHours: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    [ExerciseHours.None],
    [ExerciseHours.LessThanOne],
    [ExerciseHours.BetweenOneAndThree],
    [ExerciseHours.ThreeHoursOrMore]
  ])(
    'When %s is previously selected as an answer, then it should be shown as checked',
    (answer: ExerciseHours) => {
      render(
        <HoursCycledPage
          healthCheckAnswers={{ cycleHours: answer } as IPhysicalActivity}
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.ExerciseHours[answer]
      );
      expect(radioButton).toBeChecked();
    }
  );
});
