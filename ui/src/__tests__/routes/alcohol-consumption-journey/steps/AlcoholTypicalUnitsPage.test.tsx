import { fireEvent, render, screen } from '@testing-library/react';
import {
  AlcoholDailyUnits,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import AlcoholTypicalUnitsPage from '../../../../routes/alcohol-consumption-journey/steps/AlcoholTypicalUnitsPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('AlcoholTypicalUnitsPage tests', () => {
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
    [AlcoholDailyUnits.ZeroToTwo],
    [AlcoholDailyUnits.ThreeToFour],
    [AlcoholDailyUnits.FiveToSix],
    [AlcoholDailyUnits.SevenToNine],
    [AlcoholDailyUnits.TenOrMore]
  ])(
    'When "%s" is clicked then should save it as answer',
    (answer: AlcoholDailyUnits) => {
      render(
        <AlcoholTypicalUnitsPage
          healthCheckAnswers={alcoholConsumption}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByText(
        EnumDescriptions.AlcoholDailyUnits[answer]
      );
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        alcoholDailyUnits: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    [AlcoholDailyUnits.ZeroToTwo],
    [AlcoholDailyUnits.ThreeToFour],
    [AlcoholDailyUnits.FiveToSix],
    [AlcoholDailyUnits.SevenToNine],
    [AlcoholDailyUnits.TenOrMore]
  ])(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: AlcoholDailyUnits) => {
      render(
        <AlcoholTypicalUnitsPage
          healthCheckAnswers={
            { alcoholDailyUnits: answer } as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.AlcoholDailyUnits[answer]
      );
      expect(element).toBeChecked();
    }
  );

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <AlcoholTypicalUnitsPage
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
