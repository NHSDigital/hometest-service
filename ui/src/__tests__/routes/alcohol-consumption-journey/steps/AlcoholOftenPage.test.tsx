import { fireEvent, render, screen } from '@testing-library/react';
import {
  AlcoholHowOften,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import AlcoholOftenPage from '../../../../routes/alcohol-consumption-journey/steps/AlcoholOftenPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('AlcoholOftenPage tests', () => {
  let alcoholConsumption: IAlcoholConsumption;
  let updateHealthCheckAnswers: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    alcoholConsumption = {} as IAlcoholConsumption;
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

  test.each([
    [AlcoholHowOften.Never],
    [AlcoholHowOften.MonthlyOrLess],
    [AlcoholHowOften.TwoToFourTimesAMonth],
    [AlcoholHowOften.TwoToThreeTimesAWeek],
    [AlcoholHowOften.FourTimesOrMoreAWeek]
  ])(
    'When "%s" is clicked then should save it as answer',
    (answer: AlcoholHowOften) => {
      render(
        <AlcoholOftenPage
          healthCheckAnswers={alcoholConsumption}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByText(
        EnumDescriptions.AlcoholHowOften[answer]
      );
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        alcoholHowOften: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    [AlcoholHowOften.Never],
    [AlcoholHowOften.MonthlyOrLess],
    [AlcoholHowOften.TwoToFourTimesAMonth],
    [AlcoholHowOften.TwoToThreeTimesAWeek],
    [AlcoholHowOften.FourTimesOrMoreAWeek]
  ])(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: AlcoholHowOften) => {
      render(
        <AlcoholOftenPage
          healthCheckAnswers={
            { alcoholHowOften: answer } as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.AlcoholHowOften[answer]
      );
      expect(element).toBeChecked();
    }
  );

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <AlcoholOftenPage
        healthCheckAnswers={alcoholConsumption}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(updateHealthCheckAnswers).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });
});
