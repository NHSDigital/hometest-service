import {
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol
} from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import { AuditCategory } from '@dnhc-health-checks/shared/model/enum/score-categories';

export class PatientsWithAlcoholResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-alcohol-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults().updateQuestionnaire({
        alcoholCannotStop: null,
        alcoholConcernedRelative: null,
        alcoholDailyUnits: null,
        alcoholFailedObligations: null,
        alcoholGuilt: null,
        alcoholHowOften: null,
        alcoholMemoryLoss: null,
        alcoholMorningDrink: null,
        alcoholMultipleDrinksOneOccasion: null,
        alcoholPersonInjured: null
      });

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with no alcohol risk')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              drinkAlcohol: DoYouDrinkAlcohol.Never
            })
            .updateQuestionnaireScores({
              auditCategory: AuditCategory.NoRisk,
              auditScore: 0
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with low alcohol risk')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
              alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
              alcoholDailyUnits: AlcoholDailyUnits.ThreeToFour,
              alcoholMultipleDrinksOneOccasion:
                AlcoholEventsFrequency.LessThanMonthly
            })
            .updateQuestionnaireScores({
              auditCategory: AuditCategory.LowRisk,
              auditScore: 3
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with increasing alcohol risk')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
              alcoholHowOften: AlcoholHowOften.TwoToFourTimesAMonth,
              alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
              alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Monthly,
              alcoholConcernedRelative:
                AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear
            })
            .updateQuestionnaireScores({
              auditScore: 8,
              auditCategory: AuditCategory.IncreasingRisk
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with high alcohol risk')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
              alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
              alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
              alcoholMultipleDrinksOneOccasion:
                AlcoholEventsFrequency.DailyOrAlmost,
              alcoholConcernedRelative:
                AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
              alcoholPersonInjured: AlcoholPersonInjuredAndConcernedRelative.No
            })
            .updateQuestionnaireScores({
              auditScore: 16,
              auditCategory: AuditCategory.HighRisk
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with possible alcohol dependency')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
              alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
              alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
              alcoholMultipleDrinksOneOccasion:
                AlcoholEventsFrequency.DailyOrAlmost,
              alcoholConcernedRelative:
                AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
              alcoholPersonInjured:
                AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
              alcoholFailedObligations: AlcoholEventsFrequency.DailyOrAlmost
            })
            .updateQuestionnaireScores({
              auditScore: 24,
              auditCategory: AuditCategory.PossibleDependency
            })
            .build()
        )
        .build()
    );
  }
}
