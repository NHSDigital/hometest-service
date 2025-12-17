import {
  SummaryRows,
  type SummaryItem
} from '../../../lib/components/summary-row';
import {
  convertCmToFtAndInches,
  convertCmToInches,
  convertKgToLbsAndStones
} from '../../../lib/converters/body-measurements-converter';
import {
  HeightDisplayPreference,
  type IBodyMeasurements,
  WaistMeasurementDisplayPreference,
  WeightDisplayPreference
} from '@dnhc-health-checks/shared';
import {
  JourneyStepNames,
  RoutePath,
  getStepUrl
} from '../../../lib/models/route-paths';
import { round } from '../../../lib/converters/integer-converter';

interface IBodyMeasurementsSummaryRowsProps {
  bodyMeasurementsAnswers: IBodyMeasurements;
}
export default function BodyMeasurementsSummaryRows({
  bodyMeasurementsAnswers
}: IBodyMeasurementsSummaryRowsProps) {
  function getChangeLink(step: string): string {
    return getStepUrl(RoutePath.BodyMeasurementsJourney, step);
  }

  const items: SummaryItem[] = [
    {
      id: JourneyStepNames.HeightPage,
      key: 'What is your height?',
      value:
        bodyMeasurementsAnswers.heightDisplayPreference ===
        HeightDisplayPreference.Centimetres
          ? `${bodyMeasurementsAnswers.height}cm`
          : (() => {
              const { ft, inch } = convertCmToFtAndInches(
                bodyMeasurementsAnswers.height ?? null
              );
              return `${ft}ft and ${inch}in`;
            })(),
      changeLink: getChangeLink(JourneyStepNames.HeightPage),
      screenReaderSuffix: 'height'
    },
    {
      id: JourneyStepNames.WeightPage,
      key: 'What is your weight?',
      value:
        bodyMeasurementsAnswers.weightDisplayPreference ===
        WeightDisplayPreference.Kilograms
          ? `${bodyMeasurementsAnswers.weight}kg`
          : (() => {
              const { stones, pounds } = convertKgToLbsAndStones(
                bodyMeasurementsAnswers.weight ?? null
              );
              return `${stones}st and ${pounds}lb`;
            })(),
      changeLink: getChangeLink(JourneyStepNames.WeightPage),
      screenReaderSuffix: 'weight'
    },
    {
      id: JourneyStepNames.WaistMeasurementPage,
      key: 'What is your waist measurement?',
      value:
        bodyMeasurementsAnswers.waistMeasurementDisplayPreference ===
        WaistMeasurementDisplayPreference.Centimetres
          ? `${bodyMeasurementsAnswers.waistMeasurement}cm`
          : `${round(
              convertCmToInches(
                bodyMeasurementsAnswers.waistMeasurement ?? null
              ),
              1
            )}in`,
      changeLink: getChangeLink(JourneyStepNames.WaistMeasurementPage),
      screenReaderSuffix: 'waist measurement'
    }
  ];
  return <SummaryRows items={items} />;
}
