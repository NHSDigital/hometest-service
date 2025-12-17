import '@testing-library/jest-dom';
import {
  type IPhysicalActivity,
  WorkActivity
} from '@dnhc-health-checks/shared';
import { screen, render, fireEvent } from '@testing-library/react';
import WorkActivityPage from '../../../../routes/physical-activity-journey/steps/WorkActivityPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('WorkActivityPage tests', () => {
  let healthCheckAnswers = {} as IPhysicalActivity;
  let updateHealthCheckAnswers: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    healthCheckAnswers = { workActivity: null } as IPhysicalActivity;
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

  test('Will display an error when no option is selected', () => {
    render(
      <WorkActivityPage
        healthCheckAnswers={healthCheckAnswers}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  test.each(Object.values(WorkActivity))(
    'Selecting "%s" should be saved in answers and continue to next screen',
    (answer) => {
      const workActivity = EnumDescriptions.WorkActivity[answer];

      render(
        <WorkActivityPage
          healthCheckAnswers={healthCheckAnswers}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByText(workActivity.description);
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);

      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        workActivity: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each(Object.values(WorkActivity))(
    'Returning to page, the "%s" answer if selected previously should be selected',
    (answer) => {
      const workActivity = EnumDescriptions.WorkActivity[answer];

      render(
        <WorkActivityPage
          healthCheckAnswers={{ workActivity: answer } as IPhysicalActivity}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const answerElement: HTMLInputElement = screen.getByLabelText(
        workActivity.description
      );
      expect(answerElement).toBeChecked();
    }
  );
});
