import { render, screen, fireEvent } from '@testing-library/react';
import HoursWalkedPage from '../../../../routes/physical-activity-journey/steps/HoursWalkedPage';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('HoursWalkedPage', () => {
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
      <HoursWalkedPage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );

    // heading
    expect(
      screen.getByText('How many hours do you walk in a typical week?')
    ).toBeInTheDocument();

    // hint text
    expect(
      screen.getByText(
        'This includes walking to work, running errands or walking for pleasure'
      )
    ).toBeInTheDocument();
  });

  it('displays error message when no walk hours are selected', () => {
    render(
      <HoursWalkedPage
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
    [ExerciseHours.ThreeHoursOrMore]
  ])(
    'When %s is clicked then the radio button is checked and stores the data when submitted',
    (answer: ExerciseHours) => {
      render(
        <HoursWalkedPage
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
      expect(mockUpdateHealthCheckAnswers).toHaveBeenCalled();
      expect(mockUpdateHealthCheckAnswers).toHaveBeenCalledWith({
        walkHours: answer
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
        <HoursWalkedPage
          healthCheckAnswers={{ walkHours: answer } as IPhysicalActivity}
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
        />
      );

      const label = EnumDescriptions.ExerciseHours[answer];
      const radioButton: HTMLInputElement = screen.getByLabelText(label);
      expect(radioButton).toBeChecked();
    }
  );
});
