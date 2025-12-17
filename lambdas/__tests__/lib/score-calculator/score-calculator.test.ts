import Sinon from 'ts-sinon';
import {
  ActivityCategory,
  BmiClassification,
  AuditCategory,
  LeicesterRiskCategory,
  BloodPressureCategory,
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  AsianOrAsianBritish,
  BlackAfricanCaribbeanOrBlackBritish,
  DoYouDrinkAlcohol,
  EthnicBackground,
  ExerciseHours,
  OtherEthnicity,
  WhiteEthnicBackground,
  WorkActivity,
  type IHealthCheckAnswers,
  Sex,
  ParentSiblingChildDiabetes,
  BloodPressureLocation,
  WalkingPace,
  EthnicBackgroundOther
} from '@dnhc-health-checks/shared';
import { ScoreCalculatorService } from '../../../src/lib/score-calculator/score-calculator';
import { Commons } from '../../../src/lib/commons';

describe('Score calculator tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let service: ScoreCalculatorService;

  beforeAll(() => {
    /*
      Mock Date.now() to always return the same date.
      This ensures moment() considers this as the current date,
      making date-dependent tests consistent and avoiding future breakage.
     */
    const fixedDate = new Date('2024-01-01').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(fixedDate);
  });

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    service = new ScoreCalculatorService(commonsStub as unknown as Commons);
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('Alcohol intake', () => {
    test.each([
      [{}, null, null, null],
      [
        {
          isAlcoholSectionSubmitted: false,
          drinkAlcohol: null,
          alcoholHowOften: null,
          alcoholDailyUnits: null,
          alcoholMultipleDrinksOneOccasion: null,
          alcoholConcernedRelative: null,
          alcoholPersonInjured: null,
          alcoholFailedObligations: null,
          alcoholGuilt: null,
          alcoholMemoryLoss: null,
          alcoholMorningDrink: null,
          alcoholCannotStop: null
        } as unknown as IHealthCheckAnswers,
        null,
        null,
        null
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.Never,
          alcoholDailyUnits: AlcoholDailyUnits.ZeroToTwo,
          alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Never
        },
        null,
        0,
        AuditCategory.NoRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.LessThanMonthly
        },
        null,
        4,
        AuditCategory.LowRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.TwoToThreeTimesAWeek,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Monthly
        },
        null,
        7,
        AuditCategory.LowRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.TwoToThreeTimesAWeek,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Weekly
        },
        null,
        8,
        AuditCategory.IncreasingRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.TwoToThreeTimesAWeek,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.DailyOrAlmost,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear
        },
        null,
        15,
        AuditCategory.IncreasingRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.TwoToThreeTimesAWeek,
          alcoholDailyUnits: AlcoholDailyUnits.ThreeToFour,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.DailyOrAlmost,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
          alcoholFailedObligations: AlcoholEventsFrequency.Monthly
        },
        null,
        16,
        AuditCategory.HighRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
          alcoholDailyUnits: AlcoholDailyUnits.SevenToNine,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.DailyOrAlmost,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
          alcoholFailedObligations: AlcoholEventsFrequency.Monthly
        },
        null,
        19,
        AuditCategory.HighRisk
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
          alcoholDailyUnits: AlcoholDailyUnits.SevenToNine,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.DailyOrAlmost,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
          alcoholFailedObligations: AlcoholEventsFrequency.Monthly,
          alcoholGuilt: AlcoholEventsFrequency.LessThanMonthly
        },
        null,
        20,
        AuditCategory.PossibleDependency
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.LessThanMonthly,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholFailedObligations: AlcoholEventsFrequency.Monthly,
          alcoholGuilt: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholMemoryLoss: AlcoholEventsFrequency.Weekly,
          alcoholMorningDrink: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholCannotStop: AlcoholEventsFrequency.Never
        },
        null,
        23,
        AuditCategory.PossibleDependency
      ],
      [
        {
          isAlcoholSectionSubmitted: true,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.TwoToFourTimesAMonth,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.LessThanMonthly,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholFailedObligations: AlcoholEventsFrequency.Never,
          alcoholGuilt: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholMemoryLoss: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholMorningDrink: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholCannotStop: AlcoholEventsFrequency.LessThanMonthly
        },
        null,
        24,
        AuditCategory.PossibleDependency
      ]
    ])(
      'Should calculate correct score and category for alcohol journey when journey is complete',
      (
        answers: IHealthCheckAnswers,
        dateOfBirth: string | null,
        expectedScore: number | null,
        expectedCategory: AuditCategory | null
      ) => {
        const score = service.calculateScore(answers, dateOfBirth);
        expect(score.auditScore).toEqual(expectedScore);
        expect(score.auditCategory).toEqual(expectedCategory);
        expect(score.inProgressAuditScore).toBeNull();
      }
    );

    test.each([
      [{}, null, null],
      [
        {
          isAlcoholSectionSubmitted: false,
          drinkAlcohol: null,
          alcoholHowOften: null,
          alcoholDailyUnits: null,
          alcoholMultipleDrinksOneOccasion: null,
          alcoholConcernedRelative: null,
          alcoholPersonInjured: null,
          alcoholFailedObligations: null,
          alcoholGuilt: null,
          alcoholMemoryLoss: null,
          alcoholMorningDrink: null,
          alcoholCannotStop: null
        } as unknown as IHealthCheckAnswers,
        null,
        null
      ],
      [
        {
          isAlcoholSectionSubmitted: false,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.Never
        },
        null,
        0
      ],
      [
        {
          isAlcoholSectionSubmitted: false,
          drinkAlcohol: DoYouDrinkAlcohol.Yes,
          alcoholHowOften: AlcoholHowOften.TwoToFourTimesAMonth,
          alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
          alcoholMultipleDrinksOneOccasion:
            AlcoholEventsFrequency.LessThanMonthly,
          alcoholConcernedRelative:
            AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
          alcoholPersonInjured:
            AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
          alcoholFailedObligations: AlcoholEventsFrequency.Never,
          alcoholGuilt: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholMemoryLoss: AlcoholEventsFrequency.DailyOrAlmost,
          alcoholMorningDrink: AlcoholEventsFrequency.DailyOrAlmost
        },
        null,
        23
      ]
    ])(
      'Should calculate correct score for when journey is incomplete',
      (
        answers: IHealthCheckAnswers,
        dateOfBirth: string | null,
        expectedScore: number | null
      ) => {
        const score = service.calculateScore(answers, dateOfBirth);
        expect(score.inProgressAuditScore).toEqual(expectedScore);
        expect(score.auditCategory).toBeNull();
        expect(score.auditScore).toBeNull();
      }
    );
  });

  describe('Physical activity score', () => {
    test.each([
      [{}, null, null, null],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.None,
          cycleHours: ExerciseHours.None,
          gardeningHours: ExerciseHours.ThreeHoursOrMore,
          houseworkHours: ExerciseHours.None,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.Unemployed
        },
        null,
        1,
        ActivityCategory.Inactive
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.LessThanOne,
          cycleHours: ExerciseHours.None,
          gardeningHours: ExerciseHours.None,
          houseworkHours: ExerciseHours.None,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.Unemployed
        },
        null,
        2,
        ActivityCategory.Inactive
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.LessThanOne,
          cycleHours: ExerciseHours.LessThanOne,
          gardeningHours: ExerciseHours.LessThanOne,
          houseworkHours: ExerciseHours.BetweenOneAndThree,
          walkHours: ExerciseHours.ThreeHoursOrMore,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.Sitting
        },
        null,
        3,
        ActivityCategory.ModeratelyInactive
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.BetweenOneAndThree,
          cycleHours: ExerciseHours.None,
          gardeningHours: ExerciseHours.None,
          houseworkHours: ExerciseHours.None,
          walkHours: ExerciseHours.ThreeHoursOrMore,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalLight
        },
        null,
        4,
        ActivityCategory.ModeratelyActive
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.None,
          cycleHours: ExerciseHours.None,
          gardeningHours: ExerciseHours.None,
          houseworkHours: ExerciseHours.None,
          walkHours: ExerciseHours.ThreeHoursOrMore,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalHeavy
        },
        null,
        4,
        ActivityCategory.ModeratelyActive
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.None,
          cycleHours: ExerciseHours.BetweenOneAndThree,
          gardeningHours: ExerciseHours.ThreeHoursOrMore,
          houseworkHours: ExerciseHours.LessThanOne,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalMedium
        },
        null,
        5,
        ActivityCategory.Active
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.BetweenOneAndThree,
          cycleHours: ExerciseHours.BetweenOneAndThree,
          gardeningHours: ExerciseHours.ThreeHoursOrMore,
          houseworkHours: ExerciseHours.LessThanOne,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalHeavy
        },
        null,
        8,
        ActivityCategory.Active
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: true,
          exerciseHours: ExerciseHours.ThreeHoursOrMore,
          cycleHours: ExerciseHours.ThreeHoursOrMore,
          gardeningHours: ExerciseHours.ThreeHoursOrMore,
          houseworkHours: ExerciseHours.LessThanOne,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalHeavy
        },
        null,
        10,
        ActivityCategory.Active
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: false,
          exerciseHours: null,
          cycleHours: ExerciseHours.ThreeHoursOrMore,
          gardeningHours: ExerciseHours.ThreeHoursOrMore,
          houseworkHours: ExerciseHours.LessThanOne,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalHeavy
        } as unknown as IHealthCheckAnswers,
        null,
        null,
        null
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: false,
          exerciseHours: ExerciseHours.BetweenOneAndThree,
          cycleHours: ExerciseHours.ThreeHoursOrMore,
          gardeningHours: null,
          houseworkHours: ExerciseHours.LessThanOne,
          walkHours: ExerciseHours.LessThanOne,
          walkPace: WalkingPace.FastPace,
          workActivity: WorkActivity.PhysicalHeavy
        } as unknown as IHealthCheckAnswers,
        null,
        null,
        null
      ],
      [
        {
          isPhysicalActivitySectionSubmitted: false,
          exerciseHours: null,
          cycleHours: null,
          workActivity: null
        } as unknown as IHealthCheckAnswers,
        null,
        null,
        null
      ]
    ])(
      'Should calculate correct score for physical journey',
      (
        answers: IHealthCheckAnswers,
        dateOfBirth: string | null,
        expectedScore: number | null,
        expectedCategory: ActivityCategory | null
      ) => {
        const { gppaqScore, activityCategory } = service.calculateScore(
          answers,
          dateOfBirth
        );
        expect(gppaqScore).toBe(expectedScore);
        expect(activityCategory).toBe(expectedCategory);
      }
    );
  });

  describe('Blood Pressure', () => {
    test.each([
      [
        {
          bloodPressureSystolic: 75,
          bloodPressureDiastolic: 50,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.Low
      ],
      [
        {
          bloodPressureSystolic: 89,
          bloodPressureDiastolic: 59,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.Low
      ],
      [
        {
          bloodPressureSystolic: 90,
          bloodPressureDiastolic: 60,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.Healthy
      ],
      [
        {
          bloodPressureSystolic: 90,
          bloodPressureDiastolic: 58,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.Healthy
      ],
      [
        {
          bloodPressureSystolic: 79,
          bloodPressureDiastolic: 62,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.Healthy
      ],
      [
        {
          bloodPressureSystolic: 100,
          bloodPressureDiastolic: 70,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.Healthy
      ],
      [
        {
          bloodPressureSystolic: 121,
          bloodPressureDiastolic: 81,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 110,
          bloodPressureDiastolic: 81,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 90,
          bloodPressureDiastolic: 81,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 121,
          bloodPressureDiastolic: 58,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 121,
          bloodPressureDiastolic: 81,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 134,
          bloodPressureDiastolic: 84,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 139,
          bloodPressureDiastolic: 89,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.SlightlyRaised
      ],
      [
        {
          bloodPressureSystolic: 135,
          bloodPressureDiastolic: 85,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 140,
          bloodPressureDiastolic: 90,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 169,
          bloodPressureDiastolic: 99,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 179,
          bloodPressureDiastolic: 119,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 58,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 65,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 81,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 53,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 90,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.High
      ],
      [
        {
          bloodPressureSystolic: 181,
          bloodPressureDiastolic: 121,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.VeryHigh
      ],
      [
        {
          bloodPressureSystolic: 181,
          bloodPressureDiastolic: 58,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.VeryHigh
      ],
      [
        {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 110,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.VeryHigh
      ],
      [
        {
          bloodPressureSystolic: 100,
          bloodPressureDiastolic: 121,
          bloodPressureLocation: BloodPressureLocation.Pharmacy
        },
        BloodPressureCategory.VeryHigh
      ],
      [
        {
          bloodPressureSystolic: 171,
          bloodPressureDiastolic: 101,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        BloodPressureCategory.VeryHigh
      ],
      [
        {
          bloodPressureSystolic: 171,
          bloodPressureDiastolic: 101
        },
        null
      ],
      [
        {
          bloodPressureDiastolic: 101,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        null
      ],
      [
        {
          bloodPressureSystolic: 171,
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        null
      ],
      [
        {
          bloodPressureLocation: BloodPressureLocation.Monitor
        },
        null
      ]
    ])(
      `should show correct blood pressure category`,
      (
        answers: IHealthCheckAnswers,
        expectedCategory: BloodPressureCategory | null
      ) => {
        // answers.bloodPressureDiastolic !== undefined && answers.bloodPressureDiastolic > 105;
        const { bloodPressureCategory } = service.calculateScore(answers, null);
        expect(bloodPressureCategory).toBe(expectedCategory);
      }
    );
  });
  test.each([
    {
      answers: {
        height: 170,
        weight: 80,
        ethnicBackground: EthnicBackground.AsianOrAsianBritish,
        detailedEthnicGroup: AsianOrAsianBritish.Bangladeshi
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 27.7,
      expectedClassification: BmiClassification.Obese1
    },
    {
      answers: {
        height: 185,
        weight: 62,
        ethnicBackground: EthnicBackground.AsianOrAsianBritish,
        detailedEthnicGroup: AsianOrAsianBritish.Bangladeshi
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 18.1,
      expectedClassification: BmiClassification.Underweight
    },
    {
      answers: {
        height: 187,
        weight: 80,
        ethnicBackground: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
        detailedEthnicGroup: BlackAfricanCaribbeanOrBlackBritish.African
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 22.9,
      expectedClassification: BmiClassification.Healthy
    },
    {
      answers: {
        height: 180,
        weight: 100,
        ethnicBackground: EthnicBackground.Other,
        detailedEthnicGroup: OtherEthnicity.Arab
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 30.9,
      expectedClassification: BmiClassification.Obese1
    },
    {
      answers: {
        height: 180,
        weight: 110,
        ethnicBackground: EthnicBackground.Other,
        detailedEthnicGroup: OtherEthnicity.Arab
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 34.0,
      expectedClassification: BmiClassification.Obese2
    },
    {
      answers: {
        height: 180,
        weight: 125,
        ethnicBackground: EthnicBackground.Other,
        detailedEthnicGroup: OtherEthnicity.Arab
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 38.6,
      expectedClassification: BmiClassification.Obese3
    },
    {
      answers: {
        height: 170,
        weight: 80,
        ethnicBackground: EthnicBackground.White,
        detailedEthnicGroup: WhiteEthnicBackground.EnglishWelshScottishNIBritish
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 27.7,
      expectedClassification: BmiClassification.Overweight
    },
    {
      answers: {
        height: 185,
        weight: 62,
        ethnicBackground: EthnicBackground.White,
        detailedEthnicGroup: WhiteEthnicBackground.GypsyOrIrishTraveller
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 18.1,
      expectedClassification: BmiClassification.Underweight
    },
    {
      answers: {
        height: 187,
        weight: 82,
        ethnicBackground: EthnicBackground.Other,
        detailedEthnicGroup: EthnicBackgroundOther.PreferNotToSay
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 23.4,
      expectedClassification: BmiClassification.Healthy
    },
    {
      answers: {
        height: 180,
        weight: 110,
        ethnicBackground: EthnicBackground.White,
        detailedEthnicGroup: WhiteEthnicBackground.OtherWhiteBackground
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 34.0,
      expectedClassification: BmiClassification.Obese1
    },
    {
      answers: {
        height: 180,
        weight: 115,
        ethnicBackground: EthnicBackground.White,
        detailedEthnicGroup: WhiteEthnicBackground.Irish
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 35.5,
      expectedClassification: BmiClassification.Obese2
    },
    {
      answers: {
        height: 180,
        weight: 130,
        ethnicBackground: EthnicBackground.Other,
        detailedEthnicGroup: OtherEthnicity.OtherEthnicGroup
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 40.1,
      expectedClassification: BmiClassification.Obese3
    },
    {
      answers: {
        height: 182.3,
        weight: 79.1,
        ethnicBackground: EthnicBackground.Other,
        detailedEthnicGroup: EthnicBackgroundOther.PreferNotToSay
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 23.8,
      expectedClassification: BmiClassification.Healthy
    },
    {
      answers: {
        height: 175.7,
        weight: 99.9,
        ethnicBackground: EthnicBackground.AsianOrAsianBritish,
        detailedEthnicGroup: AsianOrAsianBritish.Pakistani
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 32.4,
      expectedClassification: BmiClassification.Obese1
    },
    {
      answers: {
        height: 203.1,
        weight: 83.2,
        ethnicBackground: EthnicBackground.AsianOrAsianBritish,
        detailedEthnicGroup: AsianOrAsianBritish.Pakistani
      } as unknown as IHealthCheckAnswers,
      dateOfBirth: null,
      expectedScore: 20.2,
      expectedClassification: BmiClassification.Healthy
    }
  ])(
    'For given answers $answers should calculate bmi "$expectedScore" and classification "$expectedClassification"',
    ({ answers, dateOfBirth, expectedScore, expectedClassification }) => {
      const { bmiScore, bmiClassification } = service.calculateScore(
        answers,
        dateOfBirth
      );
      expect(bmiScore).toBe(expectedScore);
      expect(bmiClassification).toBe(expectedClassification);
    }
  );

  test.each([
    ['height'],
    ['weight'],
    ['ethnicBackground'],
    ['detailedEthnicGroup']
  ])(
    'When required field for bmi score are not set then should return null',
    (requiredField: string) => {
      const { bmiScore, bmiClassification } = service.calculateScore(
        {
          [requiredField]: null
        } as unknown as IHealthCheckAnswers,
        null
      );
      expect(bmiScore).toBeNull();
      expect(bmiClassification).toBeNull();
    }
  );

  describe('Leicester Risk Score tests', () => {
    test.each([
      {
        answers: {
          sex: Sex.Female,
          ethnicBackground: EthnicBackground.White,
          detailedEthnicGroup: WhiteEthnicBackground.Irish,
          hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
          waistMeasurement: 80,
          height: 187,
          weight: 80
        } as unknown as IHealthCheckAnswers,
        dateOfBirth: '1985-01-01',
        expectedScore: 0,
        expectedCategory: LeicesterRiskCategory.Low
      },
      {
        answers: {
          sex: null,
          ethnicBackground: EthnicBackground.White,
          detailedEthnicGroup: AsianOrAsianBritish.Bangladeshi,
          hasFamilyDiabetesHistory: null,
          waistMeasurement: null,
          height: null,
          weight: null
        } as unknown as IHealthCheckAnswers,
        dateOfBirth: null,
        expectedScore: null,
        expectedCategory: null
      },
      {
        answers: {
          sex: Sex.Female,
          ethnicBackground: EthnicBackground.White,
          detailedEthnicGroup:
            WhiteEthnicBackground.EnglishWelshScottishNIBritish,
          hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes,
          waistMeasurement: 90,
          height: 170,
          weight: 80
        } as unknown as IHealthCheckAnswers,
        dateOfBirth: '1980-01-01',
        expectedScore: 12,
        expectedCategory: LeicesterRiskCategory.Medium
      },
      {
        answers: {
          sex: Sex.Male,
          ethnicBackground: EthnicBackground.Other,
          detailedEthnicGroup: OtherEthnicity.Arab,
          hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Unknown,
          waistMeasurement: 100,
          height: 180,
          weight: 110
        } as unknown as IHealthCheckAnswers,
        dateOfBirth: '1995-01-01',
        expectedScore: 21,
        expectedCategory: LeicesterRiskCategory.High
      },
      {
        answers: {
          sex: Sex.Male,
          ethnicBackground: EthnicBackground.Other,
          detailedEthnicGroup: OtherEthnicity.Arab,
          hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes,
          waistMeasurement: 110,
          height: 180,
          weight: 125
        } as unknown as IHealthCheckAnswers,
        dateOfBirth: '1950-01-01',
        expectedScore: 42,
        expectedCategory: LeicesterRiskCategory.VeryHigh
      }
    ])(
      'Should calculate correct Leicester risk score and category',
      ({ answers, dateOfBirth, expectedScore, expectedCategory }) => {
        const { leicesterRiskScore, leicesterRiskCategory } =
          service.calculateScore(answers, dateOfBirth);
        expect(leicesterRiskScore).toBe(expectedScore);
        expect(leicesterRiskCategory).toBe(expectedCategory);
      }
    );

    test.each([
      ['sex'],
      ['ethnicBackground'],
      ['hasFamilyDiabetesHistory'],
      ['waistMeasurement']
    ])(
      'When required fields for Leicester score are not set, should handle null/undefined correctly',
      (requiredField: string) => {
        const { leicesterRiskScore, leicesterRiskCategory } =
          service.calculateScore(
            {
              [requiredField]: null
            } as unknown as IHealthCheckAnswers,
            null
          );
        expect(leicesterRiskScore).toBe(null);
        expect(leicesterRiskCategory).toBe(null);
      }
    );
  });
});
