import {
  AuditCategory,
  ActivityCategory,
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  AsianOrAsianBritish,
  BlackAfricanCaribbeanOrBlackBritish,
  DoYouDrinkAlcohol,
  BloodPressureCategory,
  BloodPressureLocation,
  EthnicBackground,
  EthnicBackgroundOther,
  ExerciseHours,
  MixedOrMultipleGroups,
  OtherEthnicity,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  Sex,
  Smoking,
  WalkingPace,
  WhiteEthnicBackground,
  WorkActivity
} from '@dnhc-health-checks/shared';

type EnumDescriptionMap<T extends PropertyKey> = Record<T, string>;
type EnumDescriptionMapWithExtraFields<
  T extends PropertyKey,
  U = object
> = Record<T, { description: string } & U>;

interface EnumDescriptionSchema {
  ParentSiblingHeartAttack: EnumDescriptionMap<ParentSiblingHeartAttack>;
  ParentSiblingChildDiabetes: EnumDescriptionMap<ParentSiblingChildDiabetes>;
  Sex: EnumDescriptionMap<Sex>;
  EthnicBackground: EnumDescriptionMap<EthnicBackground>;
  DetailedEthnicGroup: {
    [EthnicBackground.AsianOrAsianBritish]: EnumDescriptionMap<AsianOrAsianBritish>;
    [EthnicBackground.BlackAfricanCaribbeanOrBlackBritish]: EnumDescriptionMap<BlackAfricanCaribbeanOrBlackBritish>;
    [EthnicBackground.MixedOrMultipleGroups]: EnumDescriptionMap<MixedOrMultipleGroups>;
    [EthnicBackground.White]: EnumDescriptionMap<WhiteEthnicBackground>;
    [EthnicBackground.Other]: EnumDescriptionMap<OtherEthnicity>;
  };
  OtherDetailedEthnicGroup: EnumDescriptionMap<EthnicBackgroundOther>;
  Smoking: EnumDescriptionMapWithExtraFields<Smoking, { heading: string }>;
  WalkingPace: EnumDescriptionMapWithExtraFields<WalkingPace, { hint: string }>;
  WorkActivity: EnumDescriptionMapWithExtraFields<
    WorkActivity,
    { hint: string }
  >;
  ExerciseHours: EnumDescriptionMap<ExerciseHours>;
  BloodPressureLocation: EnumDescriptionMap<BloodPressureLocation>;
  ActivityCategory: EnumDescriptionMap<ActivityCategory>;
  BloodPressureCategory: EnumDescriptionMap<BloodPressureCategory>;
  DoYouDrinkAlcohol: EnumDescriptionMap<DoYouDrinkAlcohol>;
  AlcoholHowOften: EnumDescriptionMap<AlcoholHowOften>;
  AlcoholDailyUnits: EnumDescriptionMap<AlcoholDailyUnits>;
  AlcoholPersonInjuredAndConcernedRelative: EnumDescriptionMap<AlcoholPersonInjuredAndConcernedRelative>;
  AlcoholEventsFrequency: EnumDescriptionMap<AlcoholEventsFrequency>;
  AuditCategory: EnumDescriptionMap<AuditCategory>;
}

export const EnumDescriptions: EnumDescriptionSchema = {
  ParentSiblingHeartAttack: {
    [ParentSiblingHeartAttack.Yes]: 'Yes',
    [ParentSiblingHeartAttack.No]: 'No',
    [ParentSiblingHeartAttack.Unknown]: 'I do not know'
  },
  ParentSiblingChildDiabetes: {
    [ParentSiblingChildDiabetes.Yes]: 'Yes',
    [ParentSiblingChildDiabetes.No]: 'No',
    [ParentSiblingChildDiabetes.Unknown]: 'I do not know'
  },
  Sex: {
    [Sex.Female]: 'Female',
    [Sex.Male]: 'Male'
  },
  EthnicBackground: {
    [EthnicBackground.AsianOrAsianBritish]: 'Asian or Asian British',
    [EthnicBackground.BlackAfricanCaribbeanOrBlackBritish]:
      'Black, African, Caribbean or Black British',
    [EthnicBackground.MixedOrMultipleGroups]: 'Mixed or multiple ethnic groups',
    [EthnicBackground.White]: 'White',
    [EthnicBackground.Other]: 'Other ethnic group'
  },
  DetailedEthnicGroup: {
    [EthnicBackground.AsianOrAsianBritish]: {
      [AsianOrAsianBritish.Bangladeshi]: 'Bangladeshi',
      [AsianOrAsianBritish.Chinese]: 'Chinese',
      [AsianOrAsianBritish.Indian]: 'Indian',
      [AsianOrAsianBritish.Pakistani]: 'Pakistani',
      [AsianOrAsianBritish.OtherAsianBackground]: 'Any other Asian group'
    },
    [EthnicBackground.BlackAfricanCaribbeanOrBlackBritish]: {
      [BlackAfricanCaribbeanOrBlackBritish.African]: 'African',
      [BlackAfricanCaribbeanOrBlackBritish.Caribbean]: 'Caribbean',
      [BlackAfricanCaribbeanOrBlackBritish.OtherBlackAfricanCaribbeanBackground]:
        'Any other Black, African, or Caribbean group'
    },
    [EthnicBackground.MixedOrMultipleGroups]: {
      [MixedOrMultipleGroups.WhiteAndAsian]: 'White and Asian',
      [MixedOrMultipleGroups.WhiteAndBlackAfrican]: 'White and Black African',
      [MixedOrMultipleGroups.WhiteAndBlackCaribbean]:
        'White and Black Caribbean',
      [MixedOrMultipleGroups.OtherMixedBackground]:
        'Any other Mixed or multiple ethnic groups'
    },
    [EthnicBackground.White]: {
      [WhiteEthnicBackground.EnglishWelshScottishNIBritish]:
        'English, Welsh, Scottish, Northern Irish or British',
      [WhiteEthnicBackground.Irish]: 'Irish',
      [WhiteEthnicBackground.GypsyOrIrishTraveller]: 'Gypsy or Irish Traveller',
      [WhiteEthnicBackground.OtherWhiteBackground]: 'Any other White group'
    },
    [EthnicBackground.Other]: {
      [OtherEthnicity.Arab]: 'Arab',
      [OtherEthnicity.OtherEthnicGroup]: 'Any other ethnic group'
    }
  },
  OtherDetailedEthnicGroup: {
    [EthnicBackgroundOther.PreferNotToSay]: 'Prefer not to say'
  },
  Smoking: {
    [Smoking.Never]: {
      description: 'No, I have never smoked',
      heading: 'You have never smoked'
    },
    [Smoking.Quitted]: {
      description: 'No, I quit smoking',
      heading: 'You have already quit smoking'
    },
    [Smoking.UpToNinePerDay]: {
      description: 'Yes, I smoke 1 to 9 cigarettes a day',
      heading: 'You smoke 1 to 9 cigarettes a day'
    },
    [Smoking.TenToNineteenPerDay]: {
      description: 'Yes, I smoke 10 to 19 cigarettes a day',
      heading: 'You smoke 10 to 19 cigarettes a day'
    },
    [Smoking.TwentyOrMorePerDay]: {
      description: 'Yes, I smoke 20 or more cigarettes a day',
      heading: 'You smoke 20 or more cigarettes a day'
    }
  },
  WalkingPace: {
    [WalkingPace.SlowPace]: {
      description: 'Slow pace',
      hint: 'Easy to breathe and have a conversation'
    },
    [WalkingPace.AveragePace]: {
      description: 'Steady average pace',
      hint: 'Breathing lightly but heart rate increases'
    },
    [WalkingPace.BriskPace]: {
      description: 'Brisk pace',
      hint: "Breathing deeply and it's harder to talk"
    },
    [WalkingPace.FastPace]: {
      description: 'Fast pace',
      hint: 'Short of breath and cannot converse'
    }
  },
  WorkActivity: {
    [WorkActivity.Unemployed]: {
      description: 'I am not in employment',
      hint: 'For example, retired, unemployed or a full-time carer'
    },
    [WorkActivity.Sitting]: {
      description: 'I spend most of my time at work sitting',
      hint: 'For example, a desk-based office job'
    },
    [WorkActivity.PhysicalLight]: {
      description:
        'I spend most of my time at work standing or walking, but the physical effort is light',
      hint: 'For example, shop assistant, hairdresser or security guard'
    },
    [WorkActivity.PhysicalMedium]: {
      description:
        'My work involves physical effort and handling of heavy objects or tools',
      hint: 'For example, plumber, cleaner or parcel delivery driver'
    },
    [WorkActivity.PhysicalHeavy]: {
      description:
        'My work involves vigorous physical effort and handling of very heavy objects or tools',
      hint: 'For example, scaffolder, construction worker or refuse collector'
    }
  },
  ExerciseHours: {
    [ExerciseHours.None]: 'None',
    [ExerciseHours.LessThanOne]: 'Less than 1 hour',
    [ExerciseHours.BetweenOneAndThree]: 'More than 1 hour, but less than 3',
    [ExerciseHours.ThreeHoursOrMore]: '3 hours or more'
  },
  BloodPressureLocation: {
    [BloodPressureLocation.Monitor]: 'With a monitor at home',
    [BloodPressureLocation.Pharmacy]:
      'At a clinic or pharmacy by a healthcare professional'
  },
  ActivityCategory: {
    [ActivityCategory.Active]: 'Active',
    [ActivityCategory.ModeratelyActive]: 'Moderately active',
    [ActivityCategory.ModeratelyInactive]: 'Moderately inactive',
    [ActivityCategory.Inactive]: 'Inactive'
  },
  BloodPressureCategory: {
    [BloodPressureCategory.Low]: 'Low',
    [BloodPressureCategory.Healthy]: 'Healthy',
    [BloodPressureCategory.SlightlyRaised]: 'Slightly Raised',
    [BloodPressureCategory.High]: 'High',
    [BloodPressureCategory.VeryHigh]: 'Very High' // shouldn't occur on frontend, but added for consistency
  },
  DoYouDrinkAlcohol: {
    [DoYouDrinkAlcohol.Never]: "No, I've never had a drink of alcohol",
    [DoYouDrinkAlcohol.UsedTo]:
      'No, I used to drink alcohol but I do not anymore',
    [DoYouDrinkAlcohol.Yes]: 'Yes, I drink alcohol'
  },
  AlcoholHowOften: {
    [AlcoholHowOften.Never]: 'Never',
    [AlcoholHowOften.MonthlyOrLess]: 'Monthly or less',
    [AlcoholHowOften.TwoToFourTimesAMonth]: '2 to 4 times a month',
    [AlcoholHowOften.TwoToThreeTimesAWeek]: '2 to 3 times a week',
    [AlcoholHowOften.FourTimesOrMoreAWeek]: '4 times or more a week'
  },
  AlcoholDailyUnits: {
    [AlcoholDailyUnits.ZeroToTwo]: '0 to 2',
    [AlcoholDailyUnits.ThreeToFour]: '3 to 4',
    [AlcoholDailyUnits.FiveToSix]: '5 to 6',
    [AlcoholDailyUnits.SevenToNine]: '7 to 9',
    [AlcoholDailyUnits.TenOrMore]: '10 or more'
  },
  AlcoholPersonInjuredAndConcernedRelative: {
    [AlcoholPersonInjuredAndConcernedRelative.No]: 'No',
    [AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear]:
      'Yes, but not in the past year',
    [AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear]:
      'Yes, during the past year'
  },
  AlcoholEventsFrequency: {
    [AlcoholEventsFrequency.Never]: 'Never',
    [AlcoholEventsFrequency.LessThanMonthly]: 'Less than monthly',
    [AlcoholEventsFrequency.Monthly]: 'Monthly',
    [AlcoholEventsFrequency.Weekly]: 'Weekly',
    [AlcoholEventsFrequency.DailyOrAlmost]: 'Daily or almost daily'
  },
  AuditCategory: {
    [AuditCategory.NoRisk]: 'No Risk',
    [AuditCategory.LowRisk]: 'Low Risk',
    [AuditCategory.IncreasingRisk]: 'Increasing Risk',
    [AuditCategory.HighRisk]: 'High Risk',
    [AuditCategory.PossibleDependency]: 'Possible dependency'
  }
};
