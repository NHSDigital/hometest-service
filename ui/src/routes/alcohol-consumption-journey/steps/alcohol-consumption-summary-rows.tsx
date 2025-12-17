import { doesExceedAlcoholScore } from '../alcoholScoreHelper';
import {
  SummaryRows,
  type SummaryItem
} from '../../../lib/components/summary-row';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';
import {
  DoYouDrinkAlcohol,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import {
  JourneyStepNames,
  RoutePath,
  getStepUrl
} from '../../../lib/models/route-paths';

interface AlcoholConsumptionSummaryRowsProps {
  alcoholConsumptionAnswers: IAlcoholConsumption;
  auditScore: number;
}
export default function AlcoholConsumptionSummaryRows({
  alcoholConsumptionAnswers,
  auditScore
}: AlcoholConsumptionSummaryRowsProps) {
  function getChangeLink(step: string): string {
    return getStepUrl(RoutePath.AlcoholConsumptionJourney, step);
  }

  let items: SummaryItem[] = [
    {
      id: 'drink-alcohol',
      key: 'Do you drink alcohol?',
      value:
        EnumDescriptions.DoYouDrinkAlcohol[
          alcoholConsumptionAnswers.drinkAlcohol!
        ],
      changeLink: getChangeLink(JourneyStepNames.AlcoholQuestionPage),
      screenReaderSuffix: '- do you drink alcohol?'
    }
  ];

  if (alcoholConsumptionAnswers.drinkAlcohol === DoYouDrinkAlcohol.Never) {
    return <SummaryRows items={items} />;
  }
  items = [
    ...items,
    ...[
      {
        id: 'alcohol-how-often',
        key: 'How often do you have a drink containing alcohol?',
        value: alcoholConsumptionAnswers.alcoholHowOften
          ? EnumDescriptions.AlcoholHowOften[
              alcoholConsumptionAnswers.alcoholHowOften
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholOftenPage),
        screenReaderSuffix:
          '- how often do you have a drink containing alcohol?'
      },
      {
        id: 'alcohol-how-many-units',
        key: 'On a typical day when you drink alcohol, how many units do you have?',
        value: alcoholConsumptionAnswers.alcoholDailyUnits
          ? EnumDescriptions.AlcoholDailyUnits[
              alcoholConsumptionAnswers.alcoholDailyUnits
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholTypicalUnitsPage),
        screenReaderSuffix: 'units of alcohol on a typical day'
      },
      {
        id: 'alcohol-how-often-past-year',
        key: "In the past year, how often have you had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion?",
        value: alcoholConsumptionAnswers.alcoholMultipleDrinksOneOccasion
          ? EnumDescriptions.AlcoholEventsFrequency[
              alcoholConsumptionAnswers.alcoholMultipleDrinksOneOccasion
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholOccasionUnitsPage),
        screenReaderSuffix: `- how often in the past year have you had 6 or more units (if you're female) or 8 or more (if male) on a single occasion?`
      }
    ]
  ];
  if (!doesExceedAlcoholScore(auditScore)) {
    return <SummaryRows items={items} />;
  }
  items = [
    ...items,
    ...[
      {
        id: 'alcohol-stop',
        key: 'In the past year, how often have you found that you were not able to stop drinking once you started?',
        value: alcoholConsumptionAnswers.alcoholCannotStop
          ? EnumDescriptions.AlcoholEventsFrequency[
              alcoholConsumptionAnswers.alcoholCannotStop
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholStopPage),
        screenReaderSuffix: '- not able to stop drinking once started'
      },
      {
        id: 'alcohol-fail',
        key: 'In the past year, how often have you failed to do what was expected of you because of your drinking?',
        value: alcoholConsumptionAnswers.alcoholFailedObligations
          ? EnumDescriptions.AlcoholEventsFrequency[
              alcoholConsumptionAnswers.alcoholFailedObligations
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholFailPage),
        screenReaderSuffix:
          '- failed to do what was expected because of your drinking'
      },
      {
        id: 'alcohol-morning',
        key: 'In the past year, how often have you needed an alcoholic drink in the morning to get going after a heavy drinking session?',
        value: alcoholConsumptionAnswers.alcoholMorningDrink
          ? EnumDescriptions.AlcoholEventsFrequency[
              alcoholConsumptionAnswers.alcoholMorningDrink
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholMorningDrinkPage),
        screenReaderSuffix:
          '- needed an alcoholic drink in the morning to get going'
      },
      {
        id: 'alcohol-guilty',
        key: 'In the past year, how often have you felt guilty or remorseful after drinking?',
        value: alcoholConsumptionAnswers.alcoholGuilt
          ? EnumDescriptions.AlcoholEventsFrequency[
              alcoholConsumptionAnswers.alcoholGuilt
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholGuiltPage),
        screenReaderSuffix: '- felt guilt or remorse after drinking'
      },
      {
        id: 'alcohol-forgot',
        key: 'In the past year, how often have you been unable to remember what happened the night before because of your drinking?',
        value: alcoholConsumptionAnswers.alcoholMemoryLoss
          ? EnumDescriptions.AlcoholEventsFrequency[
              alcoholConsumptionAnswers.alcoholMemoryLoss
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholMemoryLossPage),
        screenReaderSuffix:
          '- unable to remember what happened because of drinking'
      },
      {
        id: 'alcohol-injured',
        key: 'Have you or somebody else been injured as a result of your drinking?',
        value: alcoholConsumptionAnswers.alcoholPersonInjured
          ? EnumDescriptions.AlcoholPersonInjuredAndConcernedRelative[
              alcoholConsumptionAnswers.alcoholPersonInjured
            ]
          : '',
        changeLink: getChangeLink(JourneyStepNames.AlcoholPersonInjuredPage),
        screenReaderSuffix:
          '- have you or someone else been injured as a result of your drinking?'
      },
      {
        id: 'alcohol-relative',
        key: 'Has a relative, friend, doctor or other health worker been concerned about your drinking, or suggested that you cut down?',
        value: alcoholConsumptionAnswers.alcoholConcernedRelative
          ? EnumDescriptions.AlcoholPersonInjuredAndConcernedRelative[
              alcoholConsumptionAnswers.alcoholConcernedRelative
            ]
          : '',
        changeLink: getChangeLink(
          JourneyStepNames.AlcoholConcernedRelativePage
        ),
        screenReaderSuffix:
          '- has a relative, friend, doctor or other health worker been concerned about your drinking or suggested you cut down?'
      }
    ]
  ];

  return <SummaryRows items={items} />;
}
