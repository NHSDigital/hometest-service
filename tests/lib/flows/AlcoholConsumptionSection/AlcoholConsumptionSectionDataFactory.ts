import {
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol
} from '../../enum/health-check-answers';

export enum AlcoholConsumptionSectionDataType {
  HEAVY_DRINKING = 'HEAVY_DRINKING',
  NO_DRINKING = 'NO_DRINKING',
  MEDIUM_DRINKING = 'MEDIUM_DRINKING'
}

export interface AlcoholConsumptionSectionFlowData {
  drinksAlcohol: DoYouDrinkAlcohol;
  howOften?: AlcoholHowOften;
  howManyUnits?: AlcoholDailyUnits;
  sixOrMoreUnitsFrequency?: AlcoholEventsFrequency;
  unableToStopFrequency?: AlcoholEventsFrequency;
  failedObligationsFrequency?: AlcoholEventsFrequency;
  morningDrinkFrequency?: AlcoholEventsFrequency;
  guiltFrequency?: AlcoholEventsFrequency;
  memoryLossFrequency?: AlcoholEventsFrequency;
  injuredPastYear?: boolean;
  relativeConcernedPastYear?: AlcoholPersonInjuredAndConcernedRelative;
}

export class AlcoholConsumptionSectionDataFactory {
  readonly dataType: AlcoholConsumptionSectionDataType;

  constructor(dataType: AlcoholConsumptionSectionDataType) {
    this.dataType = dataType;
  }

  public getData(): AlcoholConsumptionSectionFlowData {
    switch (this.dataType) {
      case AlcoholConsumptionSectionDataType.HEAVY_DRINKING:
        return {
          drinksAlcohol: DoYouDrinkAlcohol.Yes,
          howOften: AlcoholHowOften.FourTimesOrMoreAWeek,
          howManyUnits: AlcoholDailyUnits.TenOrMore,
          sixOrMoreUnitsFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          unableToStopFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          failedObligationsFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          morningDrinkFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          guiltFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          memoryLossFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          injuredPastYear: true,
          relativeConcernedPastYear:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear
        };
      case AlcoholConsumptionSectionDataType.NO_DRINKING:
        return {
          drinksAlcohol: DoYouDrinkAlcohol.Never
        };
      case AlcoholConsumptionSectionDataType.MEDIUM_DRINKING:
        return {
          drinksAlcohol: DoYouDrinkAlcohol.Yes,
          howOften: AlcoholHowOften.FourTimesOrMoreAWeek,
          howManyUnits: AlcoholDailyUnits.SevenToNine,
          sixOrMoreUnitsFrequency: AlcoholEventsFrequency.DailyOrAlmost,
          unableToStopFrequency: AlcoholEventsFrequency.Monthly,
          failedObligationsFrequency: AlcoholEventsFrequency.Monthly,
          morningDrinkFrequency: AlcoholEventsFrequency.Monthly,
          guiltFrequency: AlcoholEventsFrequency.Monthly,
          memoryLossFrequency: AlcoholEventsFrequency.Monthly,
          injuredPastYear: false,
          relativeConcernedPastYear: AlcoholPersonInjuredAndConcernedRelative.No
        };
      default:
        throw new Error('Unknown strategy type');
    }
  }
}
