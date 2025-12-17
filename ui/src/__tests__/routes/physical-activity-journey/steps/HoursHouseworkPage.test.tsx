import { fireEvent, render, screen } from '@testing-library/react';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import HoursHouseworkPage from '../../../../routes/physical-activity-journey/steps/HoursHouseworkPage';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('HoursHouseworkPage tests', () => {
  const healthCheckAnswers = { houseworkHours: null } as IPhysicalActivity;
  const updateHealthCheckAnswers = jest.fn();

  it('renders expected page contents', () => {
    render(
      <HoursHouseworkPage
        healthCheckAnswers={healthCheckAnswers}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    // heading
    expect(
      screen.getByText(
        'How many hours do you spend on housework or childcare in a typical week? (optional)'
      )
    ).toBeInTheDocument();
  });

  test('Will display error when no option is selected', () => {
    render(
      <HoursHouseworkPage
        healthCheckAnswers={healthCheckAnswers}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
      houseworkHours: null
    });
  });

  test.each([
    [ExerciseHours.None],
    [ExerciseHours.LessThanOne],
    [ExerciseHours.BetweenOneAndThree],
    [ExerciseHours.ThreeHoursOrMore]
  ])(
    'When %s is selected, save answer and continue',
    (answer: ExerciseHours) => {
      render(
        <HoursHouseworkPage
          healthCheckAnswers={healthCheckAnswers}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );
      const label = EnumDescriptions.ExerciseHours[answer];
      const element = screen.getByText(label);
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);

      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        houseworkHours: answer
      });
    }
  );

  test.each([
    [ExerciseHours.None],
    [ExerciseHours.LessThanOne],
    [ExerciseHours.BetweenOneAndThree],
    [ExerciseHours.ThreeHoursOrMore]
  ])(
    'When %s is selected, returning to page should have it selected',
    (answer: ExerciseHours) => {
      render(
        <HoursHouseworkPage
          healthCheckAnswers={{ houseworkHours: answer } as IPhysicalActivity}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const label = EnumDescriptions.ExerciseHours[answer];
      const answerElement: HTMLInputElement = screen.getByLabelText(label);
      expect(answerElement).toBeChecked();
    }
  );
});
