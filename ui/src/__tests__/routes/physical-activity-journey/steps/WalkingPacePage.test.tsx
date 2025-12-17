import { fireEvent, render, screen } from '@testing-library/react';
import {
  type IPhysicalActivity,
  WalkingPace
} from '@dnhc-health-checks/shared';
import WalkingPacePage from '../../../../routes/physical-activity-journey/steps/WalkingPacePage';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('WalkingPacePage tests', () => {
  const mockUpdateHealthCheckAnswers = jest.fn();
  const mockHealthCheckAnswers = { walkPace: null } as IPhysicalActivity;

  it('renders expected page contents', () => {
    render(
      <WalkingPacePage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );

    // heading
    expect(
      screen.getByText(
        'How would you describe your usual walking pace? (optional)'
      )
    ).toBeInTheDocument();
  });

  test('When continue is pressed without selecting answer, should send value as null', () => {
    render(
      <WalkingPacePage
        healthCheckAnswers={mockHealthCheckAnswers}
        updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
      />
    );

    const submitButton: HTMLInputElement = screen.getByText('Continue');
    fireEvent.click(submitButton);

    expect(mockUpdateHealthCheckAnswers).toHaveBeenCalledWith({
      walkPace: null
    });
  });

  test.each(Object.values(WalkingPace))(
    'Selecting "%s" should be saved in answers and continue to next screen',
    (answer) => {
      const walkingPace = EnumDescriptions.WalkingPace[answer];

      render(
        <WalkingPacePage
          healthCheckAnswers={mockHealthCheckAnswers}
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
        />
      );

      const element = screen.getByText(walkingPace.description);
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);

      expect(mockUpdateHealthCheckAnswers).toHaveBeenCalledWith({
        walkPace: answer
      });
    }
  );

  test.each(Object.values(WalkingPace))(
    'Returning to page, the "%s" answer if selected previously should be selected',
    (answer) => {
      const walkingPace = EnumDescriptions.WalkingPace[answer];

      render(
        <WalkingPacePage
          healthCheckAnswers={{ walkPace: answer } as IPhysicalActivity}
          updateHealthCheckAnswers={mockUpdateHealthCheckAnswers}
        />
      );

      const answerElement: HTMLInputElement = screen.getByLabelText(
        walkingPace.description
      );
      expect(answerElement).toBeChecked();
    }
  );
});
