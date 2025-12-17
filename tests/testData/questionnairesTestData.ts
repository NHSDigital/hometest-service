import {
  ActivityCategory,
  BloodPressureCategory,
  BmiClassification,
  ExerciseHours,
  HeightDisplayPreference,
  LeicesterRiskCategory,
  QRiskCategory,
  WaistMeasurementDisplayPreference,
  WalkingPace,
  WeightDisplayPreference,
  WorkActivity,
  type ICholesterolScore,
  type IDiabetesScore,
  type IHealthCheckAnswers,
  type ILabResultData,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';
import {
  AuditCategory,
  DoYouDrinkAlcohol,
  BloodPressureLocation,
  EthnicBackground,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  Sex,
  Smoking,
  WhiteEthnicBackground
} from '../lib/enum/health-check-answers';
import {
  getLabResultsTestDataQuestionnaireScoresObese,
  getLabResultsTestDataQuestionnaireScoresHealthy,
  getLabResultsTestDataQuestionnaireScoresUnderweight,
  getLabResultsTestDataQuestionnaireScoresOverweight,
  getDiabetesTestFailureData,
  getLabResults,
  LabResultsData,
  cholesterolTestData,
  diabetesTestData,
  diabetesTestDataNull,
  getCompleteFailureResultsCholesterolTestData,
  getPartialResultsCholesterolTestDataCHOfailed,
  getPartialResultsCholesterolTestDataHDLfailed
} from '../testData/labResultsTestData';

interface labResultsAndScoresTestDataPayload {
  testCase: LabResultsAndScoresTestCases;
  questionnaireScoresData: IQuestionnaireScores;
  labResultsTestData: ILabResultData[];
}

export enum IncompleteBloodTestCases {
  HappyPath = 'All blood tests ordered are successful in first order (this is currently as is in the service)',
  HappyPathCholesterolOnly = 'All cholesterol tests ordered are successful in first order',
  PartialResultsCholesterolOnlyCHOfailed = 'Only Cholesterol tests ordered but CHO biomarker failed',
  PartialResultsCholesterolOnlyHDLfailed = 'Only Cholesterol tests ordered but HDL biomarker failed',
  PartialResultsHbA1CAndCHOfailed = 'HbA1C test successful but CHO biomarker tests failed',
  PartialResultsCHDDOk = 'All cholesterol tests are successful but HbA1C failed',
  PartialResultsHbA1CFailedAndCHOfailed = 'HbA1C test failed and CHO biomarker tests failed',
  OldModel = 'All blood tests ordered are successful in first order but using old model of data strucutre'
}

export enum IncompleteBloodReorderTestCases {
  HappyPath = 'Complete failure at first but successful on reorder',
  HappyPathCholesterolOnly = 'Complete failure at first but successful on reorder - cholesterol only case ',
  PartialResultsCholesterolOnlyCHOfailed = 'Complete failure at first but partial failure on reorder (CHO failed) - cholesterol only case',
  PartialResultsCholesterolOnlyHDLfailed = 'Complete failure at first but partial failure on reorder (HDL failed)- cholesterol only case',
  DoubleFailureCholesterolOnlyCase = 'Complete failure at first and after reorder - cholesterol only case',
  DoubleFailureCaseFullBloodTestOrderCase = 'Complete failure at first and after reorder - both testTypes case',
  PartialFailureHbA1cFullBloodTestOrderCase = 'Complete failure at first but partial failure (HbA1c failed) on reorder - both testTypes case',
  PartialFailureCholesterolFullBloodTestOrderCase = 'Complete failure at first but partial failure (cholesterol failed) on reorder - both testTypes case'
}

interface incompleteBloodTestCasesDataPayload {
  testCase: IncompleteBloodTestCases;
  questionnaireScoresData: IQuestionnaireScores;
  labResultsTestData: ILabResultData[];
  expectedLabResultsTestDataHba1c?: ILabResultData[] | null;
  expectedLabResultsTestDataCholesterol?: ILabResultData[];
  expectedBiometricScoresCholesterol?: ICholesterolScore;
  expectedBiometricScoresHba1c?: IDiabetesScore | null;
  pendingReorderStatus?: boolean;
  verifyEmail?: boolean;
}

interface incompleteBloodTestCasesDataPayloadWithReorderStatus {
  testCase: IncompleteBloodReorderTestCases;
  questionnaireScoresData: IQuestionnaireScores;
  labResultsTestData: ILabResultData[];
  expectedLabResultsTestDataHba1c: ILabResultData[] | null;
  expectedLabResultsTestDataCholesterol: ILabResultData[];
  expectedBiometricScoresCholesterol?: ICholesterolScore;
  expectedBiometricScoresHba1c?: IDiabetesScore | null;
  labResultsTestDataOnReorder: ILabResultData[];
  expectedLabResultsTestDataHba1cOnReorder?: ILabResultData[] | null;
  expectedLabResultsTestDataCholesterolOnReorder?: ILabResultData[];
  expectedBiometricScoresCholesterolOnReorder?: ICholesterolScore;
  expectedBiometricScoresHba1cOnReorder?: IDiabetesScore | null;
}

export enum LabResultsAndScoresTestCases {
  Underweight = 'Underweight',
  Healthy = 'Healthy',
  Overweight = 'Overweight',
  Obese = 'Obese'
}

export const eligibleAndDeclarationSectionsOnlyQuestionnaireData: () => IHealthCheckAnswers =
  () => ({
    canCompleteHealthCheckOnline: true,
    hasCompletedHealthCheckInLast5Years: false,
    hasHealthSymptoms: null,
    hasPreExistingCondition: false,
    hasReceivedAnInvitation: false,
    healthCheckAccepted: true
  });

export const questionnairesData: () => IHealthCheckAnswers = () => ({
  bloodPressureDiastolic: 80,
  bloodPressureLocation: BloodPressureLocation.Monitor,
  bloodPressureSystolic: 120,
  cycleHours: ExerciseHours.BetweenOneAndThree,
  detailedEthnicGroup: WhiteEthnicBackground.Irish,
  drinkAlcohol: DoYouDrinkAlcohol.Never,
  ethnicBackground: EthnicBackground.White,
  exerciseHours: ExerciseHours.LessThanOne,
  gardeningHours: ExerciseHours.BetweenOneAndThree,
  hasReceivedAnInvitation: false,
  hasCompletedHealthCheckInLast5Years: false,
  hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
  hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
  hasPreExistingCondition: false,
  canCompleteHealthCheckOnline: true,
  height: 157.5,
  heightDisplayPreference: HeightDisplayPreference.FeetAndInches,
  houseworkHours: ExerciseHours.LessThanOne,
  sex: Sex.Male,
  smoking: Smoking.Never,
  lupus: false,
  severeMentalIllness: false,
  atypicalAntipsychoticMedication: false,
  migraines: false,
  impotence: false,
  steroidTablets: false,
  rheumatoidArthritis: false,
  walkHours: ExerciseHours.BetweenOneAndThree,
  walkPace: WalkingPace.FastPace,
  weight: 50,
  weightDisplayPreference: WeightDisplayPreference.Kilograms,
  workActivity: WorkActivity.PhysicalMedium,
  isAboutYouSectionSubmitted: true,
  isPhysicalActivitySectionSubmitted: true,
  isAlcoholSectionSubmitted: true,
  isBodyMeasurementsSectionSubmitted: true,
  isBloodPressureSectionSubmitted: true,
  waistMeasurement: 70,
  waistMeasurementDisplayPreference:
    WaistMeasurementDisplayPreference.Centimetres
});

export const questionnairesScoresData: () => IQuestionnaireScores = () => ({
  activityCategory: null,
  auditCategory: null,
  auditScore: null,
  bmiClassification: null,
  bmiScore: 25,
  gppaqScore: null,
  bloodPressureCategory: null,
  townsendScore: null,
  leicesterRiskScore: 0,
  leicesterRiskCategory: LeicesterRiskCategory.Low
});

export function questionnaireWithRemovedSectionItems(
  sectionItemsToDelete: Array<keyof IHealthCheckAnswers>
): IHealthCheckAnswers {
  const questionnaire = questionnairesData();
  sectionItemsToDelete.forEach((element) => {
    delete questionnaire[element];
  });

  return questionnaire;
}

export function healthyHealthCheckQuestionnaire(
  override?: Partial<IHealthCheckAnswers>
): IHealthCheckAnswers {
  return {
    bloodPressureDiastolic: 70,
    bloodPressureLocation: BloodPressureLocation.Monitor,
    bloodPressureSystolic: 115,
    cycleHours: ExerciseHours.None,
    canCompleteHealthCheckOnline: true,
    detailedEthnicGroup: WhiteEthnicBackground.Other,
    drinkAlcohol: DoYouDrinkAlcohol.Never,
    ethnicBackground: EthnicBackground.White,
    exerciseHours: ExerciseHours.ThreeHoursOrMore,
    gardeningHours: ExerciseHours.BetweenOneAndThree,
    hasReceivedAnInvitation: false,
    hasCompletedHealthCheckInLast5Years: false,
    hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
    hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
    hasPreExistingCondition: false,
    height: 170,
    heightDisplayPreference: HeightDisplayPreference.Centimetres,
    houseworkHours: ExerciseHours.ThreeHoursOrMore,
    isAboutYouSectionSubmitted: true,
    isAlcoholSectionSubmitted: true,
    isBloodPressureSectionSubmitted: true,
    isBodyMeasurementsSectionSubmitted: true,
    isPhysicalActivitySectionSubmitted: true,
    sex: Sex.Male,
    impotence: false,
    lupus: false,
    migraines: false,
    rheumatoidArthritis: false,
    severeMentalIllness: false,
    steroidTablets: false,
    atypicalAntipsychoticMedication: false,
    smoking: Smoking.Never,
    waistMeasurement: 80,
    waistMeasurementDisplayPreference:
      WaistMeasurementDisplayPreference.Centimetres,
    walkHours: ExerciseHours.ThreeHoursOrMore,
    walkPace: WalkingPace.SlowPace,
    weight: 65,
    weightDisplayPreference: WeightDisplayPreference.Kilograms,
    workActivity: WorkActivity.Sitting,
    ...override
  };
}

export function healthyHealthCheckQuestionnaireScores(
  override?: Partial<IQuestionnaireScores>
): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.ModeratelyActive,
    auditCategory: AuditCategory.NoRisk,
    auditScore: 0,
    bloodPressureCategory: BloodPressureCategory.Healthy,
    bmiClassification: BmiClassification.Healthy,
    bmiScore: 22.5,
    gppaqScore: 4,
    leicesterRiskCategory: LeicesterRiskCategory.Low,
    leicesterRiskScore: 1,
    townsendScore: null,
    ...override
  };
}

export function healthyHealthCheckRiskScores(
  override?: Partial<IRiskScores>
): IRiskScores {
  return {
    heartAge: 33,
    qRiskScore: 8,
    qRiskScoreCategory: QRiskCategory.Low,
    scoreCalculationDate: '2024-10-23T12:03:49.392Z',
    ...override
  };
}

export function labResultsAndScoresTestData(): labResultsAndScoresTestDataPayload[] {
  return [
    {
      testCase: LabResultsAndScoresTestCases.Underweight,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresUnderweight(),
      labResultsTestData: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      )
    },
    {
      testCase: LabResultsAndScoresTestCases.Healthy,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      )
    },
    {
      testCase: LabResultsAndScoresTestCases.Overweight,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresOverweight(),
      labResultsTestData: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      )
    },
    {
      testCase: LabResultsAndScoresTestCases.Obese,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      )
    }
  ];
}

export function incompleteBloodTestCases(): incompleteBloodTestCasesDataPayload[] {
  return [
    {
      testCase: IncompleteBloodTestCases.HappyPath,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.NewModelSucessHbA1cOnly
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterol: cholesterolTestData,
      expectedBiometricScoresHba1c: diabetesTestData,
      pendingReorderStatus: false,
      verifyEmail: true
    },
    {
      testCase: IncompleteBloodTestCases.HappyPathCholesterolOnly,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: null,
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterol: cholesterolTestData,
      expectedBiometricScoresHba1c: diabetesTestDataNull,
      pendingReorderStatus: false
    },
    {
      testCase: IncompleteBloodTestCases.PartialResultsCholesterolOnlyHDLfailed,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyHDLfailed
      ),
      expectedLabResultsTestDataHba1c: null,
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyHDLfailed
      ),
      expectedBiometricScoresCholesterol:
        getPartialResultsCholesterolTestDataHDLfailed(),
      expectedBiometricScoresHba1c: diabetesTestDataNull,
      pendingReorderStatus: false
    },
    {
      testCase: IncompleteBloodTestCases.PartialResultsCholesterolOnlyCHOfailed,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedLabResultsTestDataHba1c: null,
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedBiometricScoresCholesterol:
        getPartialResultsCholesterolTestDataCHOfailed(),
      expectedBiometricScoresHba1c: diabetesTestDataNull,
      pendingReorderStatus: false
    },
    {
      testCase: IncompleteBloodTestCases.PartialResultsHbA1CAndCHOfailed,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.PartialFailureCholesterolHbA1c
      ),
      pendingReorderStatus: false,
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.NewModelSucessHbA1cOnly
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedBiometricScoresCholesterol:
        getPartialResultsCholesterolTestDataCHOfailed(),
      expectedBiometricScoresHba1c: diabetesTestData
    },
    {
      testCase: IncompleteBloodTestCases.PartialResultsCHDDOk,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(LabResultsData.PartialFailureHbA1c),
      pendingReorderStatus: false,
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterol: cholesterolTestData,
      expectedBiometricScoresHba1c: getDiabetesTestFailureData()
    },
    {
      testCase: IncompleteBloodTestCases.PartialResultsHbA1CFailedAndCHOfailed,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.PartialResultsHbA1CFailedAndCHOfailed
      ),
      pendingReorderStatus: false,
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedBiometricScoresCholesterol:
        getPartialResultsCholesterolTestDataCHOfailed(),
      expectedBiometricScoresHba1c: getDiabetesTestFailureData()
    },
    {
      testCase: IncompleteBloodTestCases.OldModel,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.OldModelSuccessCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.NewModelSucessHbA1cOnly
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterol: cholesterolTestData,
      expectedBiometricScoresHba1c: diabetesTestData
    }
  ];
}

export function incompleteBloodTestCasesDataWithReorderStatus(): incompleteBloodTestCasesDataPayloadWithReorderStatus[] {
  return [
    {
      testCase: IncompleteBloodReorderTestCases.HappyPath,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: getDiabetesTestFailureData(),
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.NewModelSucessCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1cOnReorder: getLabResults(
        LabResultsData.NewModelSucessHbA1cOnly
      ),
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterolOnReorder: cholesterolTestData,
      expectedBiometricScoresHba1cOnReorder: diabetesTestData
    },
    {
      testCase: IncompleteBloodReorderTestCases.HappyPathCholesterolOnly,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedLabResultsTestDataHba1c: null,
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: diabetesTestDataNull,
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedLabResultsTestDataHba1cOnReorder: null,
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterolOnReorder: cholesterolTestData,
      expectedBiometricScoresHba1cOnReorder: diabetesTestDataNull
    },
    {
      testCase:
        IncompleteBloodReorderTestCases.PartialFailureCholesterolFullBloodTestOrderCase,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: getDiabetesTestFailureData(),
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.PartialFailureCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1cOnReorder: getLabResults(
        LabResultsData.NewModelSucessHbA1cOnly
      ),
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedBiometricScoresCholesterolOnReorder:
        getPartialResultsCholesterolTestDataCHOfailed(),
      expectedBiometricScoresHba1cOnReorder: diabetesTestData
    },
    {
      testCase:
        IncompleteBloodReorderTestCases.PartialFailureHbA1cFullBloodTestOrderCase,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: getDiabetesTestFailureData(),
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.PartialFailureHbA1c
      ),
      expectedLabResultsTestDataHba1cOnReorder: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      ),
      expectedBiometricScoresCholesterolOnReorder: cholesterolTestData,
      expectedBiometricScoresHba1cOnReorder: getDiabetesTestFailureData()
    },
    {
      testCase:
        IncompleteBloodReorderTestCases.DoubleFailureCaseFullBloodTestOrderCase,
      questionnaireScoresData: getLabResultsTestDataQuestionnaireScoresObese(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1c: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: getDiabetesTestFailureData(),
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.CompleteFailureCholesterolHbA1c
      ),
      expectedLabResultsTestDataHba1cOnReorder: getLabResults(
        LabResultsData.HbA1cResultsFailed
      ),
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterolOnReorder:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1cOnReorder: getDiabetesTestFailureData()
    },
    {
      testCase:
        IncompleteBloodReorderTestCases.PartialResultsCholesterolOnlyCHOfailed,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedLabResultsTestDataHba1c: null,
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: diabetesTestDataNull,
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedLabResultsTestDataHba1cOnReorder: null,
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.PartialFailureCholesterolOnlyCHOfailed
      ),
      expectedBiometricScoresCholesterolOnReorder:
        getPartialResultsCholesterolTestDataCHOfailed(),
      expectedBiometricScoresHba1cOnReorder: diabetesTestDataNull
    },
    {
      testCase:
        IncompleteBloodReorderTestCases.DoubleFailureCholesterolOnlyCase,
      questionnaireScoresData:
        getLabResultsTestDataQuestionnaireScoresHealthy(),
      labResultsTestData: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedLabResultsTestDataHba1c: null,
      expectedLabResultsTestDataCholesterol: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterol:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1c: diabetesTestDataNull,
      labResultsTestDataOnReorder: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedLabResultsTestDataHba1cOnReorder: null,
      expectedLabResultsTestDataCholesterolOnReorder: getLabResults(
        LabResultsData.CompleteFailureCholesterolOnly
      ),
      expectedBiometricScoresCholesterolOnReorder:
        getCompleteFailureResultsCholesterolTestData(),
      expectedBiometricScoresHba1cOnReorder: diabetesTestDataNull
    }
  ];
}
