import {
  SummaryRows,
  type SummaryItem
} from '../../../lib/components/summary-row';
import { type IPhysicalActivity } from '@dnhc-health-checks/shared';
import {
  JourneyStepNames,
  RoutePath,
  getStepUrl
} from '../../../lib/models/route-paths';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface PhysicalActivitySummaryRowsProps {
  physicalActivityAnswers: IPhysicalActivity;
}
export default function getPhysicalActivitySummaryRows({
  physicalActivityAnswers
}: PhysicalActivitySummaryRowsProps) {
  function getChangeLink(step: string): string {
    return getStepUrl(RoutePath.PhysicalActivityJourney, step);
  }

  const notProvidedText = 'Not provided';

  const items: SummaryItem[] = [
    {
      id: 'exercise-hours',
      key: 'How many hours do you exercise in a typical week?',
      value:
        EnumDescriptions.ExerciseHours[physicalActivityAnswers.exerciseHours!],
      changeLink: getChangeLink(JourneyStepNames.HoursExercisedPage),
      screenReaderSuffix: 'hours of exercise last week'
    },
    {
      id: 'walk-hours',
      key: 'How many hours do you walk in a typical week?',
      value: EnumDescriptions.ExerciseHours[physicalActivityAnswers.walkHours!],
      changeLink: getChangeLink(JourneyStepNames.HoursWalkedPage),
      screenReaderSuffix: 'hours of walking last week'
    },
    {
      id: 'walk-pace',
      key: 'How would you describe your usual walking pace? (optional)',
      value: physicalActivityAnswers.walkPace
        ? EnumDescriptions.WalkingPace[physicalActivityAnswers.walkPace]
            .description
        : notProvidedText,
      changeLink: getChangeLink(JourneyStepNames.WalkingPacePage),
      screenReaderSuffix: 'usual walking pace'
    },
    {
      id: 'cycle-hours',
      key: 'How many hours do you cycle in a typical week?',
      value:
        EnumDescriptions.ExerciseHours[physicalActivityAnswers.cycleHours!],
      changeLink: getChangeLink(JourneyStepNames.HoursCycledPage),
      screenReaderSuffix: 'hours of cycling last week'
    },
    {
      id: 'work-active',
      key: 'How active are you in your work?',
      value:
        EnumDescriptions.WorkActivity[physicalActivityAnswers.workActivity!]
          .description,
      changeLink: getChangeLink(JourneyStepNames.WorkActivityPage),
      screenReaderSuffix: '- how active are you in your work?'
    }
  ];

  const optionalItems: SummaryItem[] = [
    {
      id: 'housework-hours',
      key: 'How many hours do you spend on housework or childcare in a typical week? (optional)',
      value: physicalActivityAnswers.houseworkHours
        ? EnumDescriptions.ExerciseHours[physicalActivityAnswers.houseworkHours]
        : notProvidedText,
      changeLink: getChangeLink(JourneyStepNames.HoursHouseworkPage),
      screenReaderSuffix: 'hours of housework or childcare last week'
    },
    {
      id: 'gardening-hours',
      key: 'How many hours do you spend on gardening or DIY in a typical week? (optional)',
      value: physicalActivityAnswers.gardeningHours
        ? EnumDescriptions.ExerciseHours[physicalActivityAnswers.gardeningHours]
        : notProvidedText,
      changeLink: getChangeLink(JourneyStepNames.HoursGardeningPage),
      screenReaderSuffix: 'hours of gardening or DIY last week'
    }
  ];

  const PhysicalActivitySummaryRows = <SummaryRows items={items} />;
  const PhysicalActivityOptionalSummaryRows = (
    <SummaryRows items={optionalItems} />
  );

  return { PhysicalActivitySummaryRows, PhysicalActivityOptionalSummaryRows };
}
