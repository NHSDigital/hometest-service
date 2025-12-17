import {
  screen,
  render,
  queryHelpers,
  fireEvent
} from '@testing-library/react';
import {
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol,
  type IAlcoholConsumption,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import CheckYourAnswersPage from '../../../../routes/alcohol-consumption-journey/steps/CheckYourAnswersPage';
import { MemoryRouter } from 'react-router';

jest.mock('../../../../lib/components/event-audit-button');

describe('Alcohol Journey: CheckYourAnswersPage tests', () => {
  let alcoholConsumption = {} as IAlcoholConsumption;
  let submitAnswers: jest.Mock;
  let auditScore: number;
  const healthCheck: IHealthCheck = {
    id: '123456',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  const queryByClass = queryHelpers.queryAllByAttribute.bind(null, 'class');

  beforeEach(() => {
    alcoholConsumption = {} as IAlcoholConsumption;
    submitAnswers = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Should display one answer when user doesnt drink alcohol', () => {
    alcoholConsumption = {
      drinkAlcohol: DoYouDrinkAlcohol.Never
    } as IAlcoholConsumption;
    auditScore = 0;
    const view = render(
      <MemoryRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={alcoholConsumption}
          healthCheck={healthCheck}
          patientId={patientId}
          submitAnswers={submitAnswers}
          auditScore={auditScore}
        />
      </MemoryRouter>
    );

    expect(
      queryByClass(view.container, 'nhsuk-summary-list__row').length
    ).toEqual(1);
  });

  test('Should display four first answers when user score is below 5', () => {
    alcoholConsumption = {
      drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
      alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
      alcoholDailyUnits: AlcoholDailyUnits.ZeroToTwo,
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.LessThanMonthly
    } as IAlcoholConsumption;
    auditScore = 2;
    const view = render(
      <MemoryRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={alcoholConsumption}
          healthCheck={healthCheck}
          patientId={patientId}
          submitAnswers={submitAnswers}
          auditScore={auditScore}
        />
      </MemoryRouter>
    );

    expect(
      queryByClass(view.container, 'nhsuk-summary-list__row').length
    ).toEqual(4);
  });

  test('Should display all answers when user score after first 4 questions is more than 5', () => {
    alcoholConsumption = {
      drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
      alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
      alcoholDailyUnits: AlcoholDailyUnits.SevenToNine,
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.DailyOrAlmost,
      alcoholCannotStop: AlcoholEventsFrequency.DailyOrAlmost,
      alcoholFailedObligations: AlcoholEventsFrequency.DailyOrAlmost,
      alcoholMorningDrink: AlcoholEventsFrequency.DailyOrAlmost,
      alcoholGuilt: AlcoholEventsFrequency.DailyOrAlmost,
      alcoholMemoryLoss: AlcoholEventsFrequency.DailyOrAlmost,
      alcoholPersonInjured: AlcoholPersonInjuredAndConcernedRelative.No,
      alcoholConcernedRelative: AlcoholPersonInjuredAndConcernedRelative.No
    } as IAlcoholConsumption;
    auditScore = 31;
    const view = render(
      <MemoryRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={alcoholConsumption}
          healthCheck={healthCheck}
          patientId={patientId}
          submitAnswers={submitAnswers}
          auditScore={auditScore}
        />
      </MemoryRouter>
    );

    expect(
      queryByClass(view.container, 'nhsuk-summary-list__row').length
    ).toEqual(11);
  });

  test('Should submit answers and emit an audit event when button is clicked', () => {
    alcoholConsumption = {
      drinkAlcohol: DoYouDrinkAlcohol.Never
    } as IAlcoholConsumption;
    auditScore = 0;
    render(
      <MemoryRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={alcoholConsumption}
          healthCheck={healthCheck}
          patientId={patientId}
          submitAnswers={submitAnswers}
          auditScore={auditScore}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Save and continue'));

    expect(submitAnswers).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.SectionCompleteAlcoholConsumption,
            healthCheck,
            patientId
          }
        ])
      )
    ).toBeInTheDocument();
  });
});
