import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AlcoholConsumptionSummaryRows from '../../../../routes/alcohol-consumption-journey/steps/alcohol-consumption-summary-rows';
import {
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol
} from '@dnhc-health-checks/shared';

const answers = {
  drinkAlcohol: null,
  alcoholHowOften: null,
  alcoholDailyUnits: null,
  alcoholConcernedRelative: null,
  alcoholFailedObligations: null,
  alcoholGuilt: null,
  alcoholMemoryLoss: null,
  alcoholMorningDrink: null,
  alcoholMultipleDrinksOneOccasion: null,
  alcoholPersonInjured: null,
  alcoholCannotStop: null,
  isAlcoholSectionSubmitted: null
};

describe('AlcoholConsumptionSummaryRows', () => {
  it('renders correctly if never drank alcohol', () => {
    const props = {
      alcoholConsumptionAnswers: {
        ...answers,
        drinkAlcohol: DoYouDrinkAlcohol.Never,
        alcoholHowOften: AlcoholHowOften.TwoToThreeTimesAWeek
      },
      auditScore: 0
    };

    render(
      <MemoryRouter>
        <AlcoholConsumptionSummaryRows {...props} />
      </MemoryRouter>
    );

    expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();

    expect(
      screen.queryByText('How often do you have a drink containing alcohol?')
    ).not.toBeInTheDocument();
  });

  it('renders correctly if audit score under threshold', () => {
    const props = {
      alcoholConsumptionAnswers: {
        ...answers,
        drinkAlcohol: DoYouDrinkAlcohol.Yes,
        alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
        alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
        alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.LessThanMonthly
      },
      auditScore: 2
    };

    render(
      <MemoryRouter>
        <AlcoholConsumptionSummaryRows {...props} />
      </MemoryRouter>
    );

    expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();
    expect(
      screen.getByText('How often do you have a drink containing alcohol?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'On a typical day when you drink alcohol, how many units do you have?'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "In the past year, how often have you had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion?"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        'In the past year, how often have you found that you were not able to stop drinking once you started?'
      )
    ).not.toBeInTheDocument();
  });

  it('renders correctly if audit score over threshold', () => {
    const props = {
      alcoholConsumptionAnswers: {
        ...answers,
        drinkAlcohol: DoYouDrinkAlcohol.Yes,
        alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
        alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
        alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.LessThanMonthly
      },
      auditScore: 2
    };

    render(
      <MemoryRouter>
        <AlcoholConsumptionSummaryRows {...props} />
      </MemoryRouter>
    );

    expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();
    expect(
      screen.getByText('How often do you have a drink containing alcohol?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'On a typical day when you drink alcohol, how many units do you have?'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "In the past year, how often have you had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion?"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        'In the past year, how often have you found that you were not able to stop drinking once you started?'
      )
    ).not.toBeInTheDocument();
  });

  it.each([
    { alcoholHowOften: AlcoholHowOften.Never, expectedContent: 'Never' },
    {
      alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
      expectedContent: 'Monthly or less'
    },
    {
      alcoholHowOften: AlcoholHowOften.TwoToFourTimesAMonth,
      expectedContent: '2 to 4 times a month'
    },
    {
      alcoholHowOften: AlcoholHowOften.TwoToThreeTimesAWeek,
      expectedContent: '2 to 3 times a week'
    },
    {
      alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
      expectedContent: '4 times or more a week'
    }
  ])(
    'renders alcoholHowOften content correctly - $alcoholHowOften',
    ({ alcoholHowOften, expectedContent }) => {
      const props = {
        alcoholConsumptionAnswers: {
          ...answers,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften
        },
        auditScore: 1
      };

      render(
        <MemoryRouter>
          <AlcoholConsumptionSummaryRows {...props} />
        </MemoryRouter>
      );

      expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();

      expect(
        screen.getByText('How often do you have a drink containing alcohol?')
      ).toBeInTheDocument();

      expect(screen.getByText(expectedContent)).toBeInTheDocument();
    }
  );

  it.each([
    {
      alcoholDailyUnits: AlcoholDailyUnits.ZeroToTwo,
      expectedContent: '0 to 2'
    },
    {
      alcoholDailyUnits: AlcoholDailyUnits.ThreeToFour,
      expectedContent: '3 to 4'
    },
    {
      alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
      expectedContent: '5 to 6'
    },
    {
      alcoholDailyUnits: AlcoholDailyUnits.SevenToNine,
      expectedContent: '7 to 9'
    },
    {
      alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
      expectedContent: '10 or more'
    }
  ])(
    'renders alcoholDailyUnits content correctly - $alcoholDailyUnits',
    ({ alcoholDailyUnits, expectedContent }) => {
      const props = {
        alcoholConsumptionAnswers: {
          ...answers,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholDailyUnits
        },
        auditScore: 1
      };

      render(
        <MemoryRouter>
          <AlcoholConsumptionSummaryRows {...props} />
        </MemoryRouter>
      );

      expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();

      expect(
        screen.getByText(
          'On a typical day when you drink alcohol, how many units do you have?'
        )
      ).toBeInTheDocument();
      expect(screen.getByText(expectedContent)).toBeInTheDocument();
    }
  );

  it.each([
    {
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Never,
      expectedContent: 'Never'
    },
    {
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.LessThanMonthly,
      expectedContent: 'Less than monthly'
    },
    {
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Monthly,
      expectedContent: 'Monthly'
    },
    {
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Weekly,
      expectedContent: 'Weekly'
    },
    {
      alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.DailyOrAlmost,
      expectedContent: 'Daily or almost daily'
    }
  ])(
    'renders alcoholMultipleDrinksOneOccasion content correctly - $alcoholMultipleDrinksOneOccasion',
    ({ alcoholMultipleDrinksOneOccasion, expectedContent }) => {
      const props = {
        alcoholConsumptionAnswers: {
          ...answers,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholMultipleDrinksOneOccasion
        },
        auditScore: 1
      };

      render(
        <MemoryRouter>
          <AlcoholConsumptionSummaryRows {...props} />
        </MemoryRouter>
      );

      expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();

      expect(
        screen.getByText(
          'On a typical day when you drink alcohol, how many units do you have?'
        )
      ).toBeInTheDocument();
      expect(screen.getByText(expectedContent)).toBeInTheDocument();
    }
  );

  it.each([
    {
      alcoholEventsFrequency: AlcoholEventsFrequency.Never,
      expectedContent: 'Never'
    },
    {
      alcoholEventsFrequency: AlcoholEventsFrequency.LessThanMonthly,
      expectedContent: 'Less than monthly'
    },
    {
      alcoholEventsFrequency: AlcoholEventsFrequency.Monthly,
      expectedContent: 'Monthly'
    },
    {
      alcoholEventsFrequency: AlcoholEventsFrequency.Weekly,
      expectedContent: 'Weekly'
    },
    {
      alcoholEventsFrequency: AlcoholEventsFrequency.DailyOrAlmost,
      expectedContent: 'Daily or almost daily'
    }
  ])(
    'renders alcohol events frequency (after audit score threshold) content correctly - $alcoholEventsFrequency',
    ({ alcoholEventsFrequency, expectedContent }) => {
      const props = {
        alcoholConsumptionAnswers: {
          ...answers,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholCannotStop: alcoholEventsFrequency,
          alcoholFailedObligations: alcoholEventsFrequency,
          alcoholMorningDrink: alcoholEventsFrequency,
          alcoholGuilt: alcoholEventsFrequency,
          alcoholMemoryLoss: alcoholEventsFrequency
        },
        auditScore: 10
      };

      render(
        <MemoryRouter>
          <AlcoholConsumptionSummaryRows {...props} />
        </MemoryRouter>
      );

      expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();

      expect(
        screen.getByText(
          'In the past year, how often have you found that you were not able to stop drinking once you started?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'In the past year, how often have you failed to do what was expected of you because of your drinking?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'In the past year, how often have you needed an alcoholic drink in the morning to get going after a heavy drinking session?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'In the past year, how often have you felt guilty or remorseful after drinking?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'In the past year, how often have you been unable to remember what happened the night before because of your drinking?'
        )
      ).toBeInTheDocument();
      expect(screen.getAllByText(expectedContent)).toHaveLength(5);
    }
  );

  it.each([
    {
      alcoholPersonInjuredAndConcernedRelative:
        AlcoholPersonInjuredAndConcernedRelative.No,
      expectedContent: 'No'
    },
    {
      alcoholPersonInjuredAndConcernedRelative:
        AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
      expectedContent: 'Yes, but not in the past year'
    },
    {
      alcoholPersonInjuredAndConcernedRelative:
        AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
      expectedContent: 'Yes, during the past year'
    }
  ])(
    'renders alcoholPersonInjured and alcoholConcernedRelative content correctly - $alcoholPersonInjuredAndConcernedRelative',
    ({ alcoholPersonInjuredAndConcernedRelative, expectedContent }) => {
      const props = {
        alcoholConsumptionAnswers: {
          ...answers,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholPersonInjured: alcoholPersonInjuredAndConcernedRelative,
          alcoholConcernedRelative: alcoholPersonInjuredAndConcernedRelative
        },
        auditScore: 6
      };

      render(
        <MemoryRouter>
          <AlcoholConsumptionSummaryRows {...props} />
        </MemoryRouter>
      );

      expect(screen.getByText('Do you drink alcohol?')).toBeInTheDocument();

      expect(
        screen.getByText(
          'Have you or somebody else been injured as a result of your drinking?'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Has a relative, friend, doctor or other health worker been concerned about your drinking, or suggested that you cut down?'
        )
      ).toBeInTheDocument();
      expect(screen.getAllByText(expectedContent)).toHaveLength(2);
    }
  );
});
