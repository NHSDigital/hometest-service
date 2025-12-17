import { fireEvent, render, screen } from '@testing-library/react';
import {
  DoYouDrinkAlcohol,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import AlcoholQuestionPage from '../../../../routes/alcohol-consumption-journey/steps/AlcoholQuestionPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('AlcoholQuestionPage tests', () => {
  let aboutYou = {} as IAlcoholConsumption;
  let updateHealthCheckAnswersMock: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    aboutYou = {} as IAlcoholConsumption;
    updateHealthCheckAnswersMock = jest.fn(async () => {
      return Promise.resolve();
    });
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
    [DoYouDrinkAlcohol.Never],
    [DoYouDrinkAlcohol.UsedTo],
    [DoYouDrinkAlcohol.Yes]
  ])(
    'When "%s" is clicked then should save it as answer',
    (answer: DoYouDrinkAlcohol) => {
      render(
        <AlcoholQuestionPage
          healthCheckAnswers={aboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.DoYouDrinkAlcohol[answer]
      );
      const submitButton: HTMLInputElement = screen.getByText('Continue');

      expect(radioButton).not.toBeChecked();

      fireEvent.click(radioButton);
      fireEvent.click(submitButton);

      expect(radioButton).toBeChecked();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        drinkAlcohol: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test('renders the error message when trying to press continue without selecting an answer', () => {
    render(
      <AlcoholQuestionPage
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
    [DoYouDrinkAlcohol.Never],
    [DoYouDrinkAlcohol.UsedTo],
    [DoYouDrinkAlcohol.Yes]
  ])(
    'When %s is previously selected as an answer, then it should be displayed as checked',
    (answer: DoYouDrinkAlcohol) => {
      render(
        <AlcoholQuestionPage
          healthCheckAnswers={{ drinkAlcohol: answer } as IAlcoholConsumption}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.DoYouDrinkAlcohol[answer]
      );
      expect(radioButton).toBeChecked();
    }
  );
});
