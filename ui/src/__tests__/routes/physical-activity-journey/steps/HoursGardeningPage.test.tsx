import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HoursGardeningPage from '../../../../routes/physical-activity-journey/steps/HoursGardeningPage';
import {
  ExerciseHours,
  type IPhysicalActivity
} from '@dnhc-health-checks/shared';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('HoursGardeningPage', () => {
  const mockUpdateHealthCheckAnswers = jest.fn();
  const mockHealthCheckAnswers = { gardeningHours: null } as IPhysicalActivity;

  it('renders expected page contents', () => {
    render(
      <HoursGardeningPage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );

    // heading
    expect(
      screen.getByText(
        'How many hours do you spend on gardening or DIY in a typical week? (optional)'
      )
    ).toBeInTheDocument();
  });

  it('When continue is pressed without selecting answer, should send value as null', () => {
    render(
      <HoursGardeningPage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );

    const continueButton: HTMLInputElement = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(mockUpdateHealthCheckAnswers).toHaveBeenCalledWith({
      gardeningHours: null
    });
  });

  it.each(Object.values(ExerciseHours))(
    'When "%s" is clicked then the radio button is checked and stores the data when submitted',
    (answer: ExerciseHours) => {
      render(
        <HoursGardeningPage
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
        gardeningHours: answer
      });
    }
  );

  it.each(Object.values(ExerciseHours))(
    'When %s is previously selected as an answer, then it should be shown as checked',
    (answer: ExerciseHours) => {
      render(
        <HoursGardeningPage
          healthCheckAnswers={{ gardeningHours: answer } as IPhysicalActivity}
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
        />
      );

      const label = EnumDescriptions.ExerciseHours[answer];
      const radioButton: HTMLInputElement = screen.getByLabelText(label);
      expect(radioButton).toBeChecked();
    }
  );
});
