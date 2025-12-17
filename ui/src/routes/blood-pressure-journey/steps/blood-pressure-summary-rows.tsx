import {
  SummaryRows,
  type SummaryItem
} from '../../../lib/components/summary-row';
import {
  ConfirmLowBloodPressureSymptoms,
  type IBloodPressure
} from '@dnhc-health-checks/shared';
import {
  JourneyStepNames,
  RoutePath,
  getStepUrl
} from '../../../lib/models/route-paths';
import { bloodPressureChecker } from '../blood-pressure-checker';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

interface IBloodPressureSummaryRowsProps {
  bloodPressureAnswers: IBloodPressure;
}
export default function BloodPressureSummaryRows({
  bloodPressureAnswers
}: IBloodPressureSummaryRowsProps) {
  function getChangeLink(step: string): string {
    return getStepUrl(RoutePath.BloodPressureJourney, step);
  }

  const items: SummaryItem[] = [
    {
      id: 'blood-how',
      key: 'How did you take your blood pressure reading?',
      value:
        EnumDescriptions.BloodPressureLocation[
          bloodPressureAnswers.bloodPressureLocation!
        ],
      changeLink: getChangeLink(JourneyStepNames.BloodPressureLocationPage),
      screenReaderSuffix: '- how did you take your blood pressure reading?'
    },
    {
      id: 'blood-reading',
      key: 'Enter your reading',
      value: [
        `${bloodPressureAnswers.bloodPressureSystolic} Systolic`,
        `${bloodPressureAnswers.bloodPressureDiastolic} Diastolic`
      ],
      changeLink: getChangeLink(JourneyStepNames.EnterBloodPressurePage),
      screenReaderSuffix: 'your blood pressure reading'
    },
    ...(bloodPressureChecker.isBloodPressureLow(bloodPressureAnswers)
      ? [
          {
            id: 'blood-pressure-symptoms',
            key: 'Do you have symptoms of fainting or dizziness?',
            value: `${bloodPressureAnswers.hasStrongLowBloodPressureSymptoms ? ConfirmLowBloodPressureSymptoms.Positive : ConfirmLowBloodPressureSymptoms.Negative}`,
            changeLink: getChangeLink(
              JourneyStepNames.LowBloodPressureSymptomsPage
            ),
            screenReaderSuffix:
              '- do you have any symptoms of fainting or dizziness?'
          } as SummaryItem
        ]
      : [])
  ];

  return <SummaryRows items={items} />;
}
