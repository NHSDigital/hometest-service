import { fireEvent, render, screen } from '@testing-library/react';
import {
  type IBodyMeasurements,
  WaistMeasurementDisplayPreference
} from '@dnhc-health-checks/shared';
import { MemoryRouter } from 'react-router-dom';
import { convertToNumber } from '../../../../lib/converters/integer-converter';
import WaistMeasurementPage from '../../../../routes/body-measurements-journey/steps/WaistMeasurementPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

describe('WaistMeasurementPage tests', () => {
  const errorMessage = {
    default: 'Enter your waist measurement',
    inCentimetresTooHighOrTooLow:
      'Waist measurement must be between 35.6 centimetres and 304.8 centimetres',
    inInchesTooHighOrTooLow:
      'Waist measurement must be between 14 inches and 120 inches'
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
    test('when waistMeasurementDisplayPreference is "cm" the page should be rendered only with the option to fill the waist measurement in centimetres', () => {
      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Centimetres,
                waistMeasurement: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Centimetres')).toBeInTheDocument();
      expect(screen.getByText('Switch to inches')).toBeInTheDocument();
      expect(screen.queryByLabelText('Inches')).not.toBeInTheDocument();
    });

    test('when waistMeasurementDisplayPreference is "cm" then the user should be able to switch to inches', () => {
      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Centimetres,
                waistMeasurement: null
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Switch to inches')).toBeInTheDocument();
      expect(screen.getByLabelText('Centimetres')).toBeInTheDocument();
      const link: HTMLLinkElement = screen.getByText('Switch to inches');

      fireEvent.click(link);

      expect(screen.getByLabelText('Inches')).toBeInTheDocument();
      expect(screen.getByText('Switch to centimetres')).toBeInTheDocument();
    });

    test.each([[35.6], [304.8]])(
      'when waistMeasurementDisplayPreference is "cm" and the answer "%s" is filled in then it should be saved',
      (answer: number) => {
        render(
          <MemoryRouter>
            <WaistMeasurementPage
              healthCheckAnswers={
                {
                  waistMeasurement: null,
                  waistMeasurementDisplayPreference:
                    WaistMeasurementDisplayPreference.Centimetres
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const waistMeasurementInput: HTMLInputElement =
          screen.getByLabelText('Centimetres');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(waistMeasurementInput).not.toHaveValue();

        fireEvent.change(waistMeasurementInput, { target: { value: answer } });
        fireEvent.click(submitButton);

        expect(waistMeasurementInput).toHaveValue(answer.toString());
        expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
          waistMeasurement: answer,
          waistMeasurementDisplayPreference:
            WaistMeasurementDisplayPreference.Centimetres
        });
        expect(setIsPageInErrorMock).not.toHaveBeenCalled();
      }
    );

    test.each([
      [35.5, errorMessage.inCentimetresTooHighOrTooLow],
      [304.9, errorMessage.inCentimetresTooHighOrTooLow],
      [null, errorMessage.default]
    ])(
      'when waistMeasurementDisplayPreference is "cm", the answer "%s" is filled in and submitted then error should be displayed and answer not saved',
      async (answer: number | null, errorMessage: string) => {
        render(
          <MemoryRouter>
            <WaistMeasurementPage
              healthCheckAnswers={
                {
                  waistMeasurement: answer,
                  waistMeasurementDisplayPreference:
                    WaistMeasurementDisplayPreference.Centimetres
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

    test('when waistMeasurementDisplayPreference is "cm" and the answer exists in the database then the field should be pre-populated', () => {
      const answer = 170;

      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurement: answer,
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Centimetres
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const waistMeasurementInput: HTMLInputElement =
        screen.getByLabelText('Centimetres');
      expect(waistMeasurementInput).toHaveValue(answer.toString());
    });

    test('when waistMeasurementDisplayPreference is "cm" and there are no answers recorded then the field should be empty', () => {
      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurement: null,
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Centimetres
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const waistMeasurementInput: HTMLInputElement =
        screen.getByLabelText('Centimetres');
      expect(waistMeasurementInput.value).toBe('');
    });
  });

  describe('In inches', () => {
    test('when waistMeasurementDisplayPreference is "in" the page should be rendered only with the option to fill the waist measurement in inches', () => {
      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurement: null,
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Inches
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Inches')).toBeInTheDocument();
      expect(screen.getByText('Switch to centimetres')).toBeInTheDocument();
      expect(screen.queryByLabelText('Centimetres')).not.toBeInTheDocument();
    });

    test('when waistMeasurementDisplayPreference is "in" then the user should be able to switch to centimetres', () => {
      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurement: null,
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Inches
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Inches')).toBeInTheDocument();
      expect(screen.getByText('Switch to centimetres')).toBeInTheDocument();
      const link: HTMLLinkElement = screen.getByText('Switch to centimetres');

      fireEvent.click(link);

      expect(screen.getByText('Switch to inches')).toBeInTheDocument();
      expect(screen.getByLabelText('Centimetres')).toBeInTheDocument();
    });

    test.each([
      [14, 35.6],
      [120, 304.8]
    ])(
      'when waistMeasurementDisplayPreference is "in" and the answers "%s" and "%s" are filled in then it should be saved',
      (answerInInches: number, expectedAnswer: number) => {
        render(
          <MemoryRouter>
            <WaistMeasurementPage
              healthCheckAnswers={
                {
                  waistMeasurement: null,
                  waistMeasurementDisplayPreference:
                    WaistMeasurementDisplayPreference.Inches
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const waistMeasurementInputInInchesTooHighOrTooLowOnes: HTMLInputElement =
          screen.getByLabelText('Inches');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(
          waistMeasurementInputInInchesTooHighOrTooLowOnes
        ).not.toHaveValue();

        fireEvent.change(waistMeasurementInputInInchesTooHighOrTooLowOnes, {
          target: { value: answerInInches }
        });
        fireEvent.click(submitButton);

        expect(waistMeasurementInputInInchesTooHighOrTooLowOnes).toHaveValue(
          answerInInches.toString()
        );
        expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
          waistMeasurement: expectedAnswer,
          waistMeasurementDisplayPreference:
            WaistMeasurementDisplayPreference.Inches
        });
        expect(setIsPageInErrorMock).not.toHaveBeenCalled();
      }
    );

    test.each([
      [13, errorMessage.inInchesTooHighOrTooLow],
      [121, errorMessage.inInchesTooHighOrTooLow],
      [120.01, errorMessage.inInchesTooHighOrTooLow],
      [13.99, errorMessage.inInchesTooHighOrTooLow],
      [null, errorMessage.default]
    ])(
      'when waistMeasurementDisplayPreference is "in", the answers "%s" and "%s" are filled in and submitted then error should be displayed and answer not saved',
      async (answer: number | null, errorMessage: string) => {
        render(
          <MemoryRouter>
            <WaistMeasurementPage
              healthCheckAnswers={
                {
                  waistMeasurement: null,
                  waistMeasurementDisplayPreference:
                    WaistMeasurementDisplayPreference.Inches
                } as IBodyMeasurements
              }
              updateHealthCheckAnswers={updateHealthCheckAnswersMock}
            />
          </MemoryRouter>
        );

        const waistMeasurementInputInInchesTooHighOrTooLowOnes: HTMLInputElement =
          screen.getByLabelText('Inches');
        const submitButton: HTMLInputElement = screen.getByText('Continue');

        expect(
          waistMeasurementInputInInchesTooHighOrTooLowOnes
        ).not.toHaveValue();

        fireEvent.change(waistMeasurementInputInInchesTooHighOrTooLowOnes, {
          target: { value: answer }
        });

        fireEvent.click(submitButton);

        expect(
          (await screen.findAllByText(errorMessage)).at(0)
        ).toBeInTheDocument();
        expect(updateHealthCheckAnswersMock).not.toHaveBeenCalled();
        expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
      }
    );

    test('when waistMeasurementDisplayPreference is "in" and the answer exists in the database then the field should be pre-populated', () => {
      const answer = 30;
      const expectedAnswer = 11.8;

      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurement: answer,
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Inches
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const waistMeasurementInputInInchesTooHighOrTooLowOnes: HTMLInputElement =
        screen.getByLabelText('Inches');

      expect(waistMeasurementInputInInchesTooHighOrTooLowOnes).toHaveValue(
        expectedAnswer.toString()
      );
    });

    test('when waistMeasurementDisplayPreference is "in" and there are no answers recorded then the field should be empty', () => {
      render(
        <MemoryRouter>
          <WaistMeasurementPage
            healthCheckAnswers={
              {
                waistMeasurement: null,
                waistMeasurementDisplayPreference:
                  WaistMeasurementDisplayPreference.Inches
              } as IBodyMeasurements
            }
            updateHealthCheckAnswers={updateHealthCheckAnswersMock}
          />
        </MemoryRouter>
      );

      const waistMeasurementInputInInchesTooHighOrTooLowOnes: HTMLInputElement =
        screen.getByLabelText('Inches');

      expect(
        convertToNumber(waistMeasurementInputInInchesTooHighOrTooLowOnes.value)
      ).toBeNull();
    });
  });
});
