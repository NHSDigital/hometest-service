import { fireEvent, render, screen } from '@testing-library/react';
import {
  AlcoholEventsFrequency,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import AlcoholMorningDrinkPage from '../../../../routes/alcohol-consumption-journey/steps/AlcoholMorningDrinkPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('AlcoholMorningDrinkPage tests', () => {
  let aboutYou = {} as IAlcoholConsumption;
  let updateHealthCheckAnswersMock: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    aboutYou = {} as IAlcoholConsumption;
    updateHealthCheckAnswersMock = jest.fn();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test.each([
    [AlcoholEventsFrequency.DailyOrAlmost],
    [AlcoholEventsFrequency.LessThanMonthly],
    [AlcoholEventsFrequency.Monthly],
    [AlcoholEventsFrequency.Never],
    [AlcoholEventsFrequency.Weekly]
  ])(
    'When "%s" is clicked then should save it as answer',
    (answer: AlcoholEventsFrequency) => {
      render(
        <AlcoholMorningDrinkPage
          healthCheckAnswers={aboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.AlcoholEventsFrequency[answer]
      );
      const submitButton: HTMLInputElement = screen.getByText('Continue');

      expect(radioButton).not.toBeChecked();

      fireEvent.click(radioButton);
      fireEvent.click(submitButton);

      expect(radioButton).toBeChecked();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        alcoholMorningDrink: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );
  test('renders the error message when trying to press continue without selecting an answer', () => {
    render(
      <AlcoholMorningDrinkPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    let errorMessage = screen.queryByText('There is a problem');
    expect(errorMessage).not.toBeInTheDocument();

    const submitButton: HTMLInputElement = screen.getByText('Continue');

    fireEvent.click(submitButton);

    errorMessage = screen.getByText('There is a problem');
    expect(errorMessage).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  test.each([
    [AlcoholEventsFrequency.DailyOrAlmost],
    [AlcoholEventsFrequency.LessThanMonthly],
    [AlcoholEventsFrequency.Monthly],
    [AlcoholEventsFrequency.Never],
    [AlcoholEventsFrequency.Weekly]
  ])(
    'When %s is previously selected as an answer, then it should be shown as checked',
    (answer: AlcoholEventsFrequency) => {
      render(
        <AlcoholMorningDrinkPage
          healthCheckAnswers={
            { alcoholMorningDrink: answer } as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.AlcoholEventsFrequency[answer]
      );
      expect(radioButton).toBeChecked();
    }
  );
});
