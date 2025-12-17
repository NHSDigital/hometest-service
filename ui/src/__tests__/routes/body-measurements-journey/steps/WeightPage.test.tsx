import { fireEvent, render, screen } from '@testing-library/react';
import {
  WeightDisplayPreference,
  type IBodyMeasurements
} from '@dnhc-health-checks/shared';
import WeightPage from '../../../../routes/body-measurements-journey/steps/WeightPage';
import { MemoryRouter } from 'react-router-dom';
import { convertToNumber } from '../../../../lib/converters/integer-converter';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

describe('WeightPage tests', () => {
  const errorMessage = {
    default: 'Enter your weight',
    inKgTooHighOrTooLow: 'Weight must be between 25.4kg and 317.5kg',
    inStTooHighOrTooLow: 'Weight must be between 4 stone and 50 stone',
    inStPoundsOutsideLimits: 'Pounds must be between 0 and 13',
    inStStonesDecimalPlace: 'Stone must be in whole numbers',
    inStPoundsDecimalPlace: 'Pounds must be in whole numbers'
  };
  let updateHealthCheckAnswersMock: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
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

  describe('In kilograms', () => {
    test('when weightDisplayPreference is "kg" the page should be rendered only with the option to fill the weight in kilograms', () => {
      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weightDisplayPreference: WeightDisplayPreference.Kilograms,
                weight: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Kilograms')).toBeInTheDocument();
      expect(
        screen.getByText('Switch to stone and pounds')
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Stones')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Pounds')).not.toBeInTheDocument();
    });

    test('when weightDisplayPreference is "kg" then the user should be able to switch to stone and pounds', () => {
      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weightDisplayPreference: WeightDisplayPreference.Kilograms,
                weight: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(
        screen.getByText('Switch to stone and pounds')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Kilograms')).toBeInTheDocument();
      const link: HTMLLinkElement = screen.getByText(
        'Switch to stone and pounds'
      );
      expect(link.attributes.getNamedItem('aria-label')?.value).toBe(
        'Switch to stone and pounds'
      );

      fireEvent.click(link);

      expect(screen.getByLabelText('Stone')).toBeInTheDocument();
      expect(screen.getByLabelText('Pounds')).toBeInTheDocument();
      expect(screen.getByText('Switch to kilograms')).toBeInTheDocument();
    });

    test.each([[25.4], [317.5]])(
      'when weightDisplayPreference is "kg" and the answer "%s" is filled in then it should be saved',
      (answer: number) => {
        render(
          <MemoryRouter>
            <WeightPage
              healthCheckAnswers={
                {
                  weightDisplayPreference: WeightDisplayPreference.Kilograms,
                  weight: null
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const weightInput: HTMLInputElement =
          screen.getByLabelText('Kilograms');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(weightInput).not.toHaveValue();

        fireEvent.change(weightInput, { target: { value: answer } });
        fireEvent.click(submitButton);

        expect(weightInput).toHaveValue(answer.toString());
        expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
          weight: answer,
          weightDisplayPreference: WeightDisplayPreference.Kilograms
        });
        expect(setIsPageInErrorMock).not.toHaveBeenCalled();
      }
    );

    test.each([
      [25.3, errorMessage.inKgTooHighOrTooLow],
      [317.6, errorMessage.inKgTooHighOrTooLow],
      [null, errorMessage.default]
    ])(
      'when weightDisplayPreference is "kg", the answer "%s" is filled in and submitted then error should be displayed and answer not saved',
      async (answer: number | null, errorMessage: string) => {
        render(
          <MemoryRouter>
            <WeightPage
              healthCheckAnswers={
                {
                  weight: answer,
                  weightDisplayPreference: WeightDisplayPreference.Kilograms
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const submitButton: HTMLInputElement = screen.getByText('Continue');
        fireEvent.click(submitButton);

        expect(
          (await screen.findAllByText(errorMessage)).at(0)
        ).toBeInTheDocument();
        expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
        expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
      }
    );

    test('when weightDisplayPreference is "kg" and the answer exists in the database then the field should be pre-populated', () => {
      const answer = 170;

      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weight: answer,
                weightDisplayPreference: WeightDisplayPreference.Kilograms
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const weightInput: HTMLInputElement = screen.getByLabelText('Kilograms');
      expect(weightInput).toHaveValue(answer.toString());
    });

    test('when weightDisplayPreference is "kg" and there are no answers recorded then the field should be empty', () => {
      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weight: null,
                weightDisplayPreference: WeightDisplayPreference.Kilograms
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const weightInput: HTMLInputElement = screen.getByLabelText('Kilograms');
      expect(weightInput.value).toBe('');
    });
  });

  describe('In stones and pounds', () => {
    test('when weightDisplayPreference is "stonesAndPounds" the page should be rendered only with the option to fill the height in feet and inches', () => {
      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weight: null,
                weightDisplayPreference: WeightDisplayPreference.StonesAndPounds
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Stone')).toBeInTheDocument();
      expect(screen.getByLabelText('Pounds')).toBeInTheDocument();
      expect(screen.getByText('Switch to kilograms')).toBeInTheDocument();
      expect(screen.queryByLabelText('Kilograms')).not.toBeInTheDocument();
    });

    test('when weightDisplayPreference is "stoneAndPounds" then the user should be able to switch to kilograms', () => {
      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weight: null,
                weightDisplayPreference: WeightDisplayPreference.StonesAndPounds
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Stone')).toBeInTheDocument();
      expect(screen.getByLabelText('Pounds')).toBeInTheDocument();
      expect(screen.getByText('Switch to kilograms')).toBeInTheDocument();
      const link: HTMLLinkElement = screen.getByText('Switch to kilograms');
      expect(link.attributes.getNamedItem('aria-label')?.value).toBe(
        'Switch to kilograms'
      );

      fireEvent.click(link);

      expect(
        screen.getByText('Switch to stone and pounds')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Kilograms')).toBeInTheDocument();
    });

    test.each([
      [4, 0, 25.4],
      [50, 0, 317.5],
      [4, null, 25.4]
    ])(
      'when weightDisplayPreference is "stonesAndPounds" and the answers "%s" and "%s" are filled in then it should be saved',
      (
        answerinStones: number,
        answerInPounds: number | null,
        expectedAnswer: number
      ) => {
        render(
          <MemoryRouter>
            <WeightPage
              healthCheckAnswers={
                {
                  weight: null,
                  weightDisplayPreference:
                    WeightDisplayPreference.StonesAndPounds
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const weightInputinStTooHighOrTooLowones: HTMLInputElement =
          screen.getByLabelText('Stone');
        const weightInputInPounds: HTMLInputElement =
          screen.getByLabelText('Pounds');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(weightInputinStTooHighOrTooLowones).not.toHaveValue();
        expect(convertToNumber(weightInputInPounds.value)).toBeNull();

        fireEvent.change(weightInputinStTooHighOrTooLowones, {
          target: { value: answerinStones }
        });
        fireEvent.change(weightInputInPounds, {
          target: { value: answerInPounds }
        });
        fireEvent.click(submitButton);

        expect(weightInputinStTooHighOrTooLowones).toHaveValue(
          answerinStones.toString()
        );
        expect(weightInputInPounds).toHaveValue(
          answerInPounds?.toString() ?? ''
        );
        expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
          weight: expectedAnswer,
          weightDisplayPreference: WeightDisplayPreference.StonesAndPounds
        });
      }
    );

    test.each([
      [3, 13, errorMessage.inStTooHighOrTooLow],
      [50, 1, errorMessage.inStTooHighOrTooLow],
      [3, 14, errorMessage.inStPoundsOutsideLimits],
      [51, -28, errorMessage.inStPoundsOutsideLimits],
      [40.5, 0, errorMessage.inStStonesDecimalPlace],
      [40, 5.5, errorMessage.inStPoundsDecimalPlace],
      [40.5, 5.5, errorMessage.inStStonesDecimalPlace],
      [null, null, errorMessage.default],
      [null, 0, errorMessage.default]
    ])(
      'when weightDisplayPreference is "stonesAndPounds", the answers "%s" and "%s" are filled in and submitted then error should be displayed and answer not saved',
      async (
        answerinStTooHighOrTooLowones: number | null,
        answerInPounds: number | null,
        errorMessage: string
      ) => {
        render(
          <MemoryRouter>
            <WeightPage
              healthCheckAnswers={
                {
                  weight: null,
                  weightDisplayPreference:
                    WeightDisplayPreference.StonesAndPounds
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const weightInputinStTooHighOrTooLowones: HTMLInputElement =
          screen.getByLabelText('Stone');
        const weightInputInPounds: HTMLInputElement =
          screen.getByLabelText('Pounds');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(weightInputinStTooHighOrTooLowones).not.toHaveValue();
        expect(convertToNumber(weightInputInPounds.value)).toBeNull();

        fireEvent.change(weightInputinStTooHighOrTooLowones, {
          target: { value: answerinStTooHighOrTooLowones }
        });
        fireEvent.change(weightInputInPounds, {
          target: { value: answerInPounds }
        });

        fireEvent.click(submitButton);

        expect(
          (await screen.findAllByText(errorMessage)).at(0)
        ).toBeInTheDocument();
        expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
        expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
      }
    );

    test('when weightDisplayPreference is "stonesAndPounds" and the answer exists in the database then the field should be pre-populated', () => {
      const answer = 30;
      const expectedAnswer = { stones: 4, pounds: 10 };

      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weight: answer,
                weightDisplayPreference: WeightDisplayPreference.StonesAndPounds
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const weightInputinStTooHighOrTooLowones: HTMLInputElement =
        screen.getByLabelText('Stone');
      const weightInputInPounds: HTMLInputElement =
        screen.getByLabelText('Pounds');

      expect(weightInputinStTooHighOrTooLowones).toHaveValue(
        expectedAnswer.stones.toString()
      );
      expect(weightInputInPounds).toHaveValue(expectedAnswer.pounds.toString());
    });

    test('when weightDisplayPreference is "stonesAndPounds" and there are no answers recorded then the field should be empty', () => {
      render(
        <MemoryRouter>
          <WeightPage
            healthCheckAnswers={
              {
                weight: null,
                weightDisplayPreference: WeightDisplayPreference.StonesAndPounds
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const weightInputinStTooHighOrTooLowones: HTMLInputElement =
        screen.getByLabelText('Stone');
      const weightInputInPounds: HTMLInputElement =
        screen.getByLabelText('Pounds');

      expect(
        convertToNumber(weightInputinStTooHighOrTooLowones.value)
      ).toBeNull();
      expect(convertToNumber(weightInputInPounds.value)).toBeNull();
    });
  });
});
