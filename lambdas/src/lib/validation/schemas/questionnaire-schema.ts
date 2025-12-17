import {
  DoYouDrinkAlcohol,
  Sex,
  Smoking,
  AsianOrAsianBritish,
  BlackAfricanCaribbeanOrBlackBritish,
  EthnicBackground,
  MixedOrMultipleGroups,
  OtherEthnicity,
  WhiteEthnicBackground,
  BloodPressureLocation,
  type IHealthCheckAnswers,
  AlcoholHowOften,
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  ExerciseHours,
  WalkingPace,
  WorkActivity,
  ParentSiblingHeartAttack,
  ParentSiblingChildDiabetes,
  AlcoholPersonInjuredAndConcernedRelative,
  HeightDisplayPreference,
  WeightDisplayPreference,
  WaistMeasurementDisplayPreference,
  EthnicBackgroundOther
} from '@dnhc-health-checks/shared';
import { type JSONSchemaType } from 'ajv';

export const questionnaireSchema: JSONSchemaType<IHealthCheckAnswers> = {
  type: 'object',
  properties: {
    hasReceivedAnInvitation: { type: 'boolean', nullable: true },
    hasCompletedHealthCheckInLast5Years: { type: 'boolean', nullable: true },
    hasPreExistingCondition: { type: 'boolean', nullable: true },
    canCompleteHealthCheckOnline: { type: 'boolean', nullable: true },
    hasFamilyHeartAttackHistory: {
      type: 'string',
      enum: [
        ...Object.values(ParentSiblingHeartAttack),
        null
      ] as unknown as ReadonlyArray<ParentSiblingHeartAttack | null>,
      nullable: true
    },
    hasFamilyDiabetesHistory: {
      type: 'string',
      enum: [
        ...Object.values(ParentSiblingChildDiabetes),
        null
      ] as unknown as ReadonlyArray<ParentSiblingChildDiabetes | null>,
      nullable: true
    },
    sex: {
      type: 'string',
      enum: [
        ...Object.values(Sex),
        null
      ] as unknown as ReadonlyArray<Sex | null>,
      nullable: true
    },
    ethnicBackground: {
      type: 'string',
      enum: [
        ...Object.values(EthnicBackground),
        null
      ] as unknown as ReadonlyArray<EthnicBackground | null>,
      nullable: true
    },
    detailedEthnicGroup: { type: 'string', nullable: true },
    drinkAlcohol: {
      type: 'string',
      enum: [
        ...Object.values(DoYouDrinkAlcohol),
        null
      ] as unknown as ReadonlyArray<DoYouDrinkAlcohol | null>,
      nullable: true
    },
    lupus: { type: 'boolean', nullable: true },
    severeMentalIllness: { type: 'boolean', nullable: true },
    atypicalAntipsychoticMedication: { type: 'boolean', nullable: true },
    migraines: { type: 'boolean', nullable: true },
    impotence: { type: 'boolean', nullable: true },
    steroidTablets: { type: 'boolean', nullable: true },
    rheumatoidArthritis: { type: 'boolean', nullable: true },
    alcoholHowOften: {
      type: 'string',
      nullable: true,
      enum: [
        ...Object.values(AlcoholHowOften),
        null
      ] as unknown as ReadonlyArray<AlcoholHowOften | null>
    },
    alcoholDailyUnits: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholDailyUnits),
        null
      ] as unknown as ReadonlyArray<AlcoholDailyUnits | null>,
      nullable: true
    },
    alcoholConcernedRelative: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholPersonInjuredAndConcernedRelative),
        null
      ] as unknown as ReadonlyArray<AlcoholPersonInjuredAndConcernedRelative | null>,
      nullable: true
    },
    alcoholFailedObligations: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholEventsFrequency),
        null
      ] as unknown as ReadonlyArray<AlcoholEventsFrequency | null>,
      nullable: true
    },
    alcoholMemoryLoss: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholEventsFrequency),
        null
      ] as unknown as ReadonlyArray<AlcoholEventsFrequency | null>,
      nullable: true
    },
    alcoholGuilt: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholEventsFrequency),
        null
      ] as unknown as ReadonlyArray<AlcoholEventsFrequency | null>,
      nullable: true
    },
    alcoholMorningDrink: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholEventsFrequency),
        null
      ] as unknown as ReadonlyArray<AlcoholEventsFrequency | null>,
      nullable: true
    },
    alcoholMultipleDrinksOneOccasion: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholEventsFrequency),
        null
      ] as unknown as ReadonlyArray<AlcoholEventsFrequency | null>,
      nullable: true
    },
    alcoholPersonInjured: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholPersonInjuredAndConcernedRelative),
        null
      ] as unknown as ReadonlyArray<AlcoholPersonInjuredAndConcernedRelative | null>,
      nullable: true
    },
    alcoholCannotStop: {
      type: 'string',
      enum: [
        ...Object.values(AlcoholEventsFrequency),
        null
      ] as unknown as ReadonlyArray<AlcoholEventsFrequency | null>,
      nullable: true
    },
    cycleHours: {
      type: 'string',
      enum: [
        ...Object.values(ExerciseHours),
        null
      ] as unknown as ReadonlyArray<ExerciseHours | null>,
      nullable: true
    },
    exerciseHours: {
      type: 'string',
      enum: [
        ...Object.values(ExerciseHours),
        null
      ] as unknown as ReadonlyArray<ExerciseHours | null>,
      nullable: true
    },
    gardeningHours: {
      type: 'string',
      enum: [
        ...Object.values(ExerciseHours),
        null
      ] as unknown as ReadonlyArray<ExerciseHours | null>,
      nullable: true
    },
    houseworkHours: {
      type: 'string',
      enum: [
        ...Object.values(ExerciseHours),
        null
      ] as unknown as ReadonlyArray<ExerciseHours | null>,
      nullable: true
    },
    walkHours: {
      type: 'string',
      enum: [
        ...Object.values(ExerciseHours),
        null
      ] as unknown as ReadonlyArray<ExerciseHours | null>,
      nullable: true
    },
    walkPace: {
      type: 'string',
      enum: [
        ...Object.values(WalkingPace),
        null
      ] as unknown as ReadonlyArray<WalkingPace | null>,
      nullable: true
    },
    workActivity: {
      type: 'string',
      enum: [
        ...Object.values(WorkActivity),
        null
      ] as unknown as ReadonlyArray<WorkActivity | null>,
      nullable: true
    },
    smoking: {
      type: 'string',
      enum: [
        ...Object.values(Smoking),
        null
      ] as unknown as ReadonlyArray<Smoking | null>,
      nullable: true
    },
    height: {
      type: 'number',
      nullable: true,
      minimum: 139.7, // 139.7 cm = 55 in
      maximum: 243.8 // 243.8 cm = 96 in
    },
    weight: {
      type: 'number',
      nullable: true,
      minimum: 25.4, // 25.4 cm = 10 in
      maximum: 317.5 // 317.5 cm = 125 in
    },
    waistMeasurement: {
      type: 'number',
      nullable: true,
      minimum: 35.6, // 35.6 cm = 14 in
      maximum: 304.8 // 304.8 cm = 120 in
    },
    heightDisplayPreference: {
      type: 'string',
      enum: [
        ...Object.values(HeightDisplayPreference),
        null
      ] as unknown as ReadonlyArray<HeightDisplayPreference | null>,
      nullable: true
    },
    weightDisplayPreference: {
      type: 'string',
      enum: [
        ...Object.values(WeightDisplayPreference),
        null
      ] as unknown as ReadonlyArray<WeightDisplayPreference | null>,
      nullable: true
    },
    waistMeasurementDisplayPreference: {
      type: 'string',
      enum: [
        ...Object.values(WaistMeasurementDisplayPreference),
        null
      ] as unknown as ReadonlyArray<WaistMeasurementDisplayPreference | null>,
      nullable: true
    },
    hasHealthSymptoms: {
      type: 'boolean',
      nullable: true,
      not: {
        anyOf: [
          { type: 'boolean', const: true },
          { type: 'boolean', const: false }
        ]
      }
    },
    postcode: { type: 'string', format: 'postcode', nullable: true },
    bloodPressureDiastolic: {
      type: 'integer',
      minimum: 40,
      allOf: [
        { maximum: 200 },
        {
          exclusiveMaximum: { $data: '1/bloodPressureSystolic' }
        }
      ],
      nullable: true
    },
    bloodPressureSystolic: {
      type: 'integer',
      maximum: 300,
      minimum: 70,
      nullable: true
    },
    bloodPressureLocation: {
      type: 'string',
      enum: [
        ...Object.values(BloodPressureLocation),
        null
      ] as unknown as ReadonlyArray<BloodPressureLocation | null>,
      nullable: true
    },
    lowBloodPressureValuesConfirmed: { type: 'boolean', nullable: true },
    highBloodPressureValuesConfirmed: { type: 'boolean', nullable: true },
    hasStrongLowBloodPressureSymptoms: { type: 'boolean', nullable: true },
    isAboutYouSectionSubmitted: { type: 'boolean', nullable: true },
    isAlcoholSectionSubmitted: { type: 'boolean', nullable: true },
    isBloodPressureSectionSubmitted: { type: 'boolean', nullable: true },
    isBodyMeasurementsSectionSubmitted: { type: 'boolean', nullable: true },
    isPhysicalActivitySectionSubmitted: { type: 'boolean', nullable: true }
  },
  if: {
    properties: {
      ethnicBackground: {
        const: EthnicBackground.AsianOrAsianBritish
      }
    }
  },
  then: {
    properties: {
      detailedEthnicGroup: {
        enum: [
          ...Object.values(AsianOrAsianBritish),
          ...Object.values(EthnicBackgroundOther),
          null
        ] as unknown as ReadonlyArray<AsianOrAsianBritish | null>
      }
    }
  },
  else: {
    if: {
      properties: {
        ethnicBackground: {
          const: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish
        }
      }
    },
    then: {
      properties: {
        detailedEthnicGroup: {
          enum: [
            ...Object.values(BlackAfricanCaribbeanOrBlackBritish),
            ...Object.values(EthnicBackgroundOther),
            null
          ] as unknown as ReadonlyArray<BlackAfricanCaribbeanOrBlackBritish | null>
        }
      }
    },
    else: {
      if: {
        properties: {
          ethnicBackground: {
            const: EthnicBackground.MixedOrMultipleGroups
          }
        }
      },
      then: {
        properties: {
          detailedEthnicGroup: {
            enum: [
              ...Object.values(MixedOrMultipleGroups),
              ...Object.values(EthnicBackgroundOther),
              null
            ] as unknown as ReadonlyArray<MixedOrMultipleGroups | null>
          }
        }
      },
      else: {
        if: {
          properties: {
            ethnicBackground: {
              const: EthnicBackground.White
            }
          }
        },
        then: {
          properties: {
            detailedEthnicGroup: {
              enum: [
                ...Object.values(WhiteEthnicBackground),
                ...Object.values(EthnicBackgroundOther),
                null
              ] as unknown as ReadonlyArray<WhiteEthnicBackground | null>
            }
          }
        },
        else: {
          if: {
            properties: {
              ethnicBackground: {
                const: EthnicBackground.Other
              }
            }
          },
          then: {
            properties: {
              detailedEthnicGroup: {
                enum: [
                  ...Object.values(OtherEthnicity),
                  ...Object.values(EthnicBackgroundOther),
                  null
                ] as unknown as ReadonlyArray<OtherEthnicity | null>
              }
            }
          }
        }
      }
    }
  },
  required: [],
  additionalProperties: false
};
