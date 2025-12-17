import {
  type IQuestionnaireScores,
  ActivityCategory,
  AuditCategory,
  BloodPressureCategory,
  BmiClassification,
  HealthCheckSteps,
  LeicesterRiskCategory,
  type IHealthCheck,
  BloodTestExpiryWritebackStatus,
  BloodPressureLocation,
  ExerciseHours,
  DoYouDrinkAlcohol,
  EthnicBackground,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  HeightDisplayPreference,
  Sex,
  Smoking,
  WaistMeasurementDisplayPreference,
  WalkingPace,
  WeightDisplayPreference,
  WorkActivity,
  type IHealthCheckAnswers,
  type IHealthCheckBloodTestOrder,
  QRiskCategory,
  type IRiskScores,
  type LabTestType
} from '@dnhc-health-checks/shared';

export class HealthCheckBuilder {
  private id: string = '0000001';
  private dataModelVersion: string = '1.0.0';
  private nhsNumber: string = '1234567890';
  private patientId: string = '11223344';
  private ageAtCompletion: number = 44;
  private questionnaire: IHealthCheckAnswers = {
    alcoholCannotStop: null,
    alcoholConcernedRelative: null,
    alcoholDailyUnits: null,
    alcoholFailedObligations: null,
    alcoholGuilt: null,
    alcoholHowOften: null,
    alcoholMemoryLoss: null,
    alcoholMorningDrink: null,
    alcoholMultipleDrinksOneOccasion: null,
    alcoholPersonInjured: null,
    bloodPressureDiastolic: 90,
    bloodPressureLocation: BloodPressureLocation.Pharmacy,
    bloodPressureSystolic: 120,
    cycleHours: ExerciseHours.ThreeHoursOrMore,
    detailedEthnicGroup: 'Caribbean',
    drinkAlcohol: DoYouDrinkAlcohol.Never,
    ethnicBackground: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
    lupus: false,
    severeMentalIllness: false,
    atypicalAntipsychoticMedication: false,
    migraines: false,
    impotence: false,
    steroidTablets: false,
    rheumatoidArthritis: false,
    exerciseHours: ExerciseHours.LessThanOne,
    gardeningHours: ExerciseHours.None,
    hasCompletedHealthCheckInLast5Years: false,
    hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
    hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
    hasPreExistingCondition: false,
    height: 180,
    heightDisplayPreference: HeightDisplayPreference.Centimetres,
    houseworkHours: ExerciseHours.ThreeHoursOrMore,
    isAboutYouSectionSubmitted: true,
    isAlcoholSectionSubmitted: true,
    isBloodPressureSectionSubmitted: true,
    isBodyMeasurementsSectionSubmitted: true,
    isPhysicalActivitySectionSubmitted: true,
    postcode: 'EC1A 1AE',
    sex: Sex.Female,
    smoking: Smoking.UpToNinePerDay,
    waistMeasurement: 200,
    waistMeasurementDisplayPreference:
      WaistMeasurementDisplayPreference.Centimetres,
    walkHours: ExerciseHours.ThreeHoursOrMore,
    walkPace: WalkingPace.FastPace,
    weight: 90,
    weightDisplayPreference: WeightDisplayPreference.Kilograms,
    workActivity: WorkActivity.PhysicalHeavy
  };

  private questionnaireScores: IQuestionnaireScores = {
    activityCategory: ActivityCategory.Active,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.High,
    bmiClassification: BmiClassification.Obese1,
    bmiScore: 27.8,
    gppaqScore: 6,
    leicesterRiskCategory: LeicesterRiskCategory.High,
    leicesterRiskScore: 21,
    townsendScore: null
  };

  private questionnaireCompletionDate: string;
  private riskScores: IRiskScores = {
    heartAge: 84,
    qRiskScore: 38.961766,
    qRiskScoreCategory: QRiskCategory.High,
    scoreCalculationDate: '2024-08-13T09:04:53.804Z'
  };

  private step: HealthCheckSteps = HealthCheckSteps.INIT;
  private ageAtStart: number = 44;
  private bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus =
    BloodTestExpiryWritebackStatus.NA;

  private createdAt: string = '2024-09-16T08:41:24.256Z';
  private expiredAt?: string;
  private resultTypes?: LabTestType[];
  private wasInvited: boolean = false;
  private bloodTestOrder: IHealthCheckBloodTestOrder | undefined = {
    phoneNumber: '07971247865',
    address: {
      addressLine1: 'Flat 208',
      addressLine2: '85 Royal Mint St reet',
      addressLine3: '',
      postcode: 'E1 8RD',
      townCity: 'London'
    },
    isBloodTestSectionSubmitted: true,
    searchParams: {
      buildingNumber: '2',
      postcode: 'EC1A 1AE'
    }
  };

  setId(id: string): this {
    this.id = id;
    return this;
  }

  setVersion(dataModelVersion: string): this {
    this.dataModelVersion = dataModelVersion;
    return this;
  }

  setNhsNumber(nhsNumber: string): this {
    this.nhsNumber = nhsNumber;
    return this;
  }

  setPatientId(patientId: string): this {
    this.patientId = patientId;
    return this;
  }

  setAgeAtCompletion(ageAtCompletion: number): this {
    this.ageAtCompletion = ageAtCompletion;
    return this;
  }

  setAgeAtStart(ageAtStart: number): this {
    this.ageAtStart = ageAtStart;
    return this;
  }

  setQuestionnaire(questionnaire: Partial<IHealthCheckAnswers>): this {
    this.questionnaire = { ...this.questionnaire, ...questionnaire };
    return this;
  }

  setQuestionnaireScores(
    questionnaireScores: Partial<IQuestionnaireScores>
  ): this {
    this.questionnaireScores = {
      ...this.questionnaireScores,
      ...questionnaireScores
    };
    return this;
  }

  setQuestionnaireCompletionDate(questionnaireCompletionDate: string): this {
    this.questionnaireCompletionDate = questionnaireCompletionDate;
    return this;
  }

  setRiskScores(riskScores: Partial<IRiskScores>): this {
    this.riskScores = { ...this.riskScores, ...riskScores };
    return this;
  }

  setStep(step: HealthCheckSteps): this {
    this.step = step;
    return this;
  }

  setCreatedAt(createdAt: string): this {
    this.createdAt = createdAt;
    return this;
  }

  setExpiredAt(expiredAt?: string): this {
    this.expiredAt = expiredAt;
    return this;
  }

  setResultTypes(resultTypes?: LabTestType[]): this {
    this.resultTypes = resultTypes;
    return this;
  }

  setWasInvited(wasInvited: boolean): this {
    this.wasInvited = wasInvited;
    return this;
  }

  setBloodTestOrder(
    bloodTestOrder: IHealthCheckBloodTestOrder | undefined
  ): this {
    if (!bloodTestOrder) {
      this.bloodTestOrder = undefined;
    } else {
      this.bloodTestOrder = { ...this.bloodTestOrder, ...bloodTestOrder };
    }
    return this;
  }

  setBloodTestExpiryWritebackStatus(
    bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus
  ): this {
    this.bloodTestExpiryWritebackStatus = bloodTestExpiryWritebackStatus;
    return this;
  }

  build(): IHealthCheck {
    return {
      id: this.id,
      dataModelVersion: this.dataModelVersion,
      patientId: this.patientId,
      nhsNumber: this.nhsNumber,
      ageAtCompletion: this.ageAtCompletion,
      questionnaire: this.questionnaire,
      questionnaireScores: this.questionnaireScores,
      questionnaireCompletionDate: this.questionnaireCompletionDate,
      riskScores: this.riskScores,
      step: this.step,
      ageAtStart: this.ageAtStart,
      createdAt: this.createdAt,
      expiredAt: this.expiredAt,
      resultTypes: this.resultTypes,
      bloodTestOrder: this.bloodTestOrder,
      bloodTestExpiryWritebackStatus: this.bloodTestExpiryWritebackStatus,
      wasInvited: this.wasInvited
    };
  }
}
