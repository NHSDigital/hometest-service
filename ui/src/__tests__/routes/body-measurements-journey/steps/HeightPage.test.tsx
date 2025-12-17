import { fireEvent, render, screen } from '@testing-library/react';
import {
  HeightDisplayPreference,
  type IBodyMeasurements
} from '@dnhc-health-checks/shared';
import HeightPage from '../../../../routes/body-measurements-journey/steps/HeightPage';
import { MemoryRouter } from 'react-router-dom';
import { convertToNumber } from '../../../../lib/converters/integer-converter';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

describe('HeightPage tests', () => {
  const errorMessage = {
    default: 'Enter your height',
    inCmTooHighOrTooLow: 'Height must be between 139.7cm and 243.8cm',
    inFtTooHighOrTooLow: 'Height must be between 4 feet 7 inches and 8 feet',
    inFtInchesOutsideLimits: 'Inches must be between 0 and 11',
    inFtFeetOutsideLimits: 'Feet must be between 4 and 8',
    inFtInchesDecimalPlace: 'Inches must be in whole numbers',
    inFtFeetDecimalPlace: 'Feet must be in whole numbers'
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

  describe('In centimetres', () => {
    test('when heightDisplayPreference is "cm" the page should be rendered only with the option to fill the height in centimetres', () => {
      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                heightDisplayPreference: HeightDisplayPreference.Centimetres
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Centimetres')).toBeInTheDocument();
      expect(screen.getByText('Switch to feet and inches')).toBeInTheDocument();
      expect(screen.queryByLabelText('Feet')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Inches')).not.toBeInTheDocument();
    });

    test('when heightDisplayPreference is "cm" then the user should be able to switch to feet and inches', () => {
      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                heightDisplayPreference: HeightDisplayPreference.Centimetres,
                height: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Switch to feet and inches')).toBeInTheDocument();
      expect(screen.getByLabelText('Centimetres')).toBeInTheDocument();
      const link: HTMLLinkElement = screen.getByText(
        'Switch to feet and inches'
      );
      expect(link.attributes.getNamedItem('aria-label')?.value).toBe(
        'Switch to feet and inches'
      );

      fireEvent.click(link);

      expect(screen.getByLabelText('Feet')).toBeInTheDocument();
      expect(screen.getByLabelText('Inches')).toBeInTheDocument();
      expect(screen.getByText('Switch to centimetres')).toBeInTheDocument();
    });

    test.each([[243.8], [139.7]])(
      'when heightDisplayPreference is "cm" and the answer "%s" is filled in then it should be saved',
      (answer: number) => {
        render(
          <MemoryRouter>
            <HeightPage
              healthCheckAnswers={
                {
                  heightDisplayPreference: HeightDisplayPreference.Centimetres,
                  height: null
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const heightInput: HTMLInputElement =
          screen.getByLabelText('Centimetres');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(heightInput).not.toHaveValue();

        fireEvent.change(heightInput, { target: { value: answer } });
        fireEvent.click(submitButton);

        expect(heightInput).toHaveValue(answer.toString());
        expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
          height: answer,
          heightDisplayPreference: HeightDisplayPreference.Centimetres
        });
        expect(setIsPageInErrorMock).not.toHaveBeenCalled();
      }
    );

    test.each([
      [243.9, errorMessage.inCmTooHighOrTooLow],
      [139.6, errorMessage.inCmTooHighOrTooLow],
      [null, errorMessage.default]
    ])(
      'when heightDisplayPreference is "cm", the answer "%s" is filled in and submitted then error should be displayed and answer not saved',
      async (answer: number | null, errorMessage: string) => {
        render(
          <MemoryRouter>
            <HeightPage
              healthCheckAnswers={
                {
                  height: answer,
                  heightDisplayPreference: HeightDisplayPreference.Centimetres
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

    test('when heightDisplayPreference is "cm" and the answer exists in the database then the field should be pre-populated', () => {
      const answer = 170;

      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                height: answer,
                heightDisplayPreference: HeightDisplayPreference.Centimetres
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const heightInput: HTMLInputElement =
        screen.getByLabelText('Centimetres');
      expect(heightInput).toHaveValue(answer.toString());
    });

    test('when heightDisplayPreference is "cm" and there are no answers recorded then the field should be empty', () => {
      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                height: null,
                heightDisplayPreference: HeightDisplayPreference.Centimetres
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const heightInput: HTMLInputElement =
        screen.getByLabelText('Centimetres');
      expect(heightInput.value).toBe('');
    });
  });

  describe('In feet and inches', () => {
    test('when heightDisplayPreference is "feetAndInches" the page should be rendered only with the option to fill the height in feet and inches', () => {
      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                heightDisplayPreference: HeightDisplayPreference.FeetAndInches,
                height: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Feet')).toBeInTheDocument();
      expect(screen.getByLabelText('Inches')).toBeInTheDocument();
      expect(screen.getByText('Switch to centimetres')).toBeInTheDocument();
      expect(screen.queryByLabelText('Centimetres')).not.toBeInTheDocument();
    });

    test('when heightDisplayPreference is "feetAndInches" then the user should be able to switch to centimetres', () => {
      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                heightDisplayPreference: HeightDisplayPreference.FeetAndInches,
                height: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Switch to centimetres')).toBeInTheDocument();
      expect(screen.getByLabelText('Feet')).toBeInTheDocument();
      expect(screen.getByLabelText('Inches')).toBeInTheDocument();
      const link: HTMLLinkElement = screen.getByText('Switch to centimetres');
      expect(link.attributes.getNamedItem('aria-label')?.value).toBe(
        'Switch to centimetres'
      );

      fireEvent.click(link);

      expect(screen.getByLabelText('Centimetres')).toBeInTheDocument();
      expect(screen.getByText('Switch to feet and inches')).toBeInTheDocument();
    });

    test.each([
      [4, 7, 139.7],
      [8, 0, 243.8],
      [8, null, 243.8]
    ])(
      'when heightDisplayPreference is "feetAndInches" and the answers "%s" and "%s" are filled in then it should be saved',
      (
        answerInFeet: number,
        answerInInches: number | null,
        expectedAnswer: number
      ) => {
        render(
          <MemoryRouter>
            <HeightPage
              healthCheckAnswers={
                {
                  heightDisplayPreference:
                    HeightDisplayPreference.FeetAndInches,
                  height: null
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const heightInputInFeet: HTMLInputElement =
          screen.getByLabelText('Feet');
        const heightInputInInches: HTMLInputElement =
          screen.getByLabelText('Inches');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(heightInputInFeet).not.toHaveValue();
        expect(convertToNumber(heightInputInInches.value)).toBeNull();

        fireEvent.change(heightInputInFeet, {
          target: { value: answerInFeet }
        });
        fireEvent.change(heightInputInInches, {
          target: { value: answerInInches }
        });
        fireEvent.click(submitButton);

        expect(heightInputInFeet).toHaveValue(answerInFeet.toString());
        expect(heightInputInInches).toHaveValue(
          answerInInches?.toString() ?? ''
        );
        expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
          height: expectedAnswer,
          heightDisplayPreference: HeightDisplayPreference.FeetAndInches
        });
        expect(setIsPageInErrorMock).not.toHaveBeenCalled();
      }
    );

    test.each([
      [8, 1, errorMessage.inFtTooHighOrTooLow],
      [4, 6, errorMessage.inFtTooHighOrTooLow],
      [5.5, 5, errorMessage.inFtFeetDecimalPlace],
      [5, 5.5, errorMessage.inFtInchesDecimalPlace],
      [5.5, 5.5, errorMessage.inFtFeetDecimalPlace],
      [9, 0, errorMessage.inFtFeetOutsideLimits],
      [-1, 0, errorMessage.inFtFeetOutsideLimits],
      [7, 12, errorMessage.inFtInchesOutsideLimits],
      [5, -20, errorMessage.inFtInchesOutsideLimits],
      [3, null, errorMessage.inFtFeetOutsideLimits],
      [7.5, null, errorMessage.inFtFeetDecimalPlace],
      [null, null, errorMessage.default],
      [null, 0, errorMessage.default]
    ])(
      'when heightDisplayPreference is "cm", the answers "%s" and "%s" are filled in and submitted then error should be displayed and answer not saved',
      async (
        answerInFeet: number | null,
        answerInInches: number | null,
        errorMessage: string
      ) => {
        render(
          <MemoryRouter>
            <HeightPage
              healthCheckAnswers={
                {
                  heightDisplayPreference:
                    HeightDisplayPreference.FeetAndInches,
                  height: null
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const heightInputInFeet: HTMLInputElement =
          screen.getByLabelText('Feet');
        const heightInputInInches: HTMLInputElement =
          screen.getByLabelText('Inches');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(heightInputInFeet).not.toHaveValue();
        expect(convertToNumber(heightInputInInches.value)).toBeNull();

        fireEvent.change(heightInputInFeet, {
          target: { value: answerInFeet }
        });
        fireEvent.change(heightInputInInches, {
          target: { value: answerInInches }
        });
        fireEvent.click(submitButton);

        expect(
          (await screen.findAllByText(errorMessage)).at(0)
        ).toBeInTheDocument();
        expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
        expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
      }
    );

    test('when heightDisplayPreference is "feetAndInches" and the answer exists in the database then the field should be pre-populated', () => {
      const answer = 150;
      const expectedAnswer = { ft: 4, inch: 11 };

      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                height: answer,
                heightDisplayPreference: HeightDisplayPreference.FeetAndInches
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const heightInputInFeet: HTMLInputElement = screen.getByLabelText('Feet');
      const heightInputInInches: HTMLInputElement =
        screen.getByLabelText('Inches');

      expect(heightInputInFeet).toHaveValue(expectedAnswer.ft.toString());
      expect(heightInputInInches).toHaveValue(expectedAnswer.inch.toString());
    });

    test('when heightDisplayPreference is "feetAndInches" and there are no answers recorded then the field should be empty', () => {
      render(
        <MemoryRouter>
          <HeightPage
            healthCheckAnswers={
              {
                height: null,
                heightDisplayPreference: HeightDisplayPreference.FeetAndInches
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const heightInputInFeet: HTMLInputElement = screen.getByLabelText('Feet');
      const heightInputInInches: HTMLInputElement =
        screen.getByLabelText('Inches');

      expect(convertToNumber(heightInputInFeet.value)).toBeNull();
      expect(convertToNumber(heightInputInInches.value)).toBeNull();
    });
  });
});
