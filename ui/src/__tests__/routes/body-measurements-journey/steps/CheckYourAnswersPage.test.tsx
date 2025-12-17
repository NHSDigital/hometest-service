import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import {
  HeightDisplayPreference,
  type IBodyMeasurements,
  WaistMeasurementDisplayPreference,
  WeightDisplayPreference,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import CheckYourAnswersPage from '../../../../routes/body-measurements-journey/steps/CheckYourAnswersPage';

jest.mock('../../../../lib/components/event-audit-button');

describe('CheckYourAnswersPage tests', () => {
  const healthCheckAnswers: any = {
    height: 150,
    weight: 50,
    waistMeasurement: 100
  } as IBodyMeasurements;
  const submitAnswers = jest.fn();
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  afterEach(() => {
    jest.resetAllMocks();
  });

  test.each([
    [
      HeightDisplayPreference.Centimetres,
      WeightDisplayPreference.Kilograms,
      WaistMeasurementDisplayPreference.Centimetres
    ],
    [
      HeightDisplayPreference.Centimetres,
      WeightDisplayPreference.Kilograms,
      WaistMeasurementDisplayPreference.Inches
    ],
    [
      HeightDisplayPreference.Centimetres,
      WeightDisplayPreference.StonesAndPounds,
      WaistMeasurementDisplayPreference.Centimetres
    ],
    [
      HeightDisplayPreference.Centimetres,
      WeightDisplayPreference.StonesAndPounds,
      WaistMeasurementDisplayPreference.Inches
    ],
    [
      HeightDisplayPreference.FeetAndInches,
      WeightDisplayPreference.Kilograms,
      WaistMeasurementDisplayPreference.Centimetres
    ],
    [
      HeightDisplayPreference.FeetAndInches,
      WeightDisplayPreference.Kilograms,
      WaistMeasurementDisplayPreference.Inches
    ],
    [
      HeightDisplayPreference.FeetAndInches,
      WeightDisplayPreference.StonesAndPounds,
      WaistMeasurementDisplayPreference.Centimetres
    ],
    [
      HeightDisplayPreference.FeetAndInches,
      WeightDisplayPreference.StonesAndPounds,
      WaistMeasurementDisplayPreference.Inches
    ]
  ])(
    'renders the component with initial state when heightDisplayPreference is "%s", weightDisplayPreference is "%s" and waistMeasurementDisplayPreference is "%s"',
    (
      heightDisplayPreference: string,
      weightDisplayPreference: string,
      waistMeasurementDisplayPreference: string
    ) => {
      const heightFeet = 4;
      const heightInches = 11;
      const weightStones = 7;
      const weightPounds = 12;
      const waistMeasurementInches = 39.4;

      healthCheckAnswers.heightDisplayPreference = heightDisplayPreference;
      healthCheckAnswers.weightDisplayPreference = weightDisplayPreference;
      healthCheckAnswers.waistMeasurementDisplayPreference =
        waistMeasurementDisplayPreference;
      render(
        <MemoryRouter>
          <CheckYourAnswersPage
            healthCheckAnswers={healthCheckAnswers}
            submitAnswers={submitAnswers}
            healthCheck={healthCheck}
            patientId={patientId}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Check your answers')).toBeInTheDocument();

      expect(screen.getByText('What is your height?')).toBeInTheDocument();
      expect(screen.getByText('What is your weight?')).toBeInTheDocument();
      expect(
        screen.getByText('What is your waist measurement?')
      ).toBeInTheDocument();
      expect(screen.getAllByText('Change')).toHaveLength(3);

      if (
        (heightDisplayPreference as HeightDisplayPreference) ===
        HeightDisplayPreference.Centimetres
      ) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(
          screen.getByText(`${healthCheckAnswers.height}cm`, {
            exact: false
          })
        ).toBeInTheDocument();
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(
          screen.getByText(`${heightFeet}ft and ${heightInches}in`)
        ).toBeInTheDocument();
      }

      if (
        (weightDisplayPreference as WeightDisplayPreference) ===
        WeightDisplayPreference.Kilograms
      ) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(
          screen.getByText(`${healthCheckAnswers.weight}kg`, {
            exact: false
          })
        ).toBeInTheDocument();
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(
          screen.getByText(`${weightStones}st and ${weightPounds}lb`)
        ).toBeInTheDocument();
      }

      if (
        (waistMeasurementDisplayPreference as WaistMeasurementDisplayPreference) ===
        WaistMeasurementDisplayPreference.Centimetres
      ) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(
          screen.getByText(`${healthCheckAnswers.waistMeasurement}cm`, {
            exact: false
          })
        ).toBeInTheDocument();
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(
          screen.getByText(`${waistMeasurementInches}in`)
        ).toBeInTheDocument();
      }
    }
  );

  it(`should submit answers and send '${AuditEventType.SectionCompleteBodyMeasurements}' event on Save and continue button click`, async () => {
    // arrange
    render(
      <MemoryRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={healthCheckAnswers}
          submitAnswers={submitAnswers}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </MemoryRouter>
    );
    const element = screen.getByText('Save and continue');

    // act
    await userEvent.click(element);

    // assert
    expect(submitAnswers).toHaveBeenCalled();
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.SectionCompleteBodyMeasurements,
            healthCheck,
            patientId
          }
        ])
      )
    ).toBeInTheDocument();
  });
});
