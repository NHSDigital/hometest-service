import { fireEvent, render, screen } from '@testing-library/react';
import {
  AlcoholEventsFrequency,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import AlcoholOccasionUnitsPage from '../../../../routes/alcohol-consumption-journey/steps/AlcoholOccasionUnitsPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('AlcoholOccasionUnitsPage tests', () => {
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
    [AlcoholEventsFrequency.Never],
    [AlcoholEventsFrequency.LessThanMonthly],
    [AlcoholEventsFrequency.Monthly],
    [AlcoholEventsFrequency.Weekly],
    [AlcoholEventsFrequency.DailyOrAlmost]
  ])(
    'When "%s" is clicked then should save it as answer',
    (answer: AlcoholEventsFrequency) => {
      render(
        <AlcoholOccasionUnitsPage
          healthCheckAnswers={alcoholConsumption}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByText(
        EnumDescriptions.AlcoholEventsFrequency[answer]
      );
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        alcoholMultipleDrinksOneOccasion: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    [AlcoholEventsFrequency.Never],
    [AlcoholEventsFrequency.LessThanMonthly],
    [AlcoholEventsFrequency.Monthly],
    [AlcoholEventsFrequency.Weekly],
    [AlcoholEventsFrequency.DailyOrAlmost]
  ])(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: AlcoholEventsFrequency) => {
      render(
        <AlcoholOccasionUnitsPage
          healthCheckAnswers={
            { alcoholMultipleDrinksOneOccasion: answer } as IAlcoholConsumption
          }
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.AlcoholEventsFrequency[answer]
      );
      expect(element).toBeChecked();
    }
  );

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <AlcoholOccasionUnitsPage
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
