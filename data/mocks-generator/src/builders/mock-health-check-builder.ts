import {
  type IBiometricScores,
  type IHealthCheckAnswers,
  type IHealthCheckBloodTestOrder,
  type ILabResult,
  type IQuestionnaireScores,
  type IRiskScores,
  type LabTestType,
  ActivityCategory,
  AuditCategory,
  BloodPressureCategory,
  BloodPressureLocation,
  BloodTestExpiryWritebackStatus,
  BmiClassification,
  DoYouDrinkAlcohol,
  EthnicBackground,
  ExerciseHours,
  HealthCheckSteps,
  HeightDisplayPreference,
  LeicesterRiskCategory,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  QRiskCategory,
  Sex,
  Smoking,
  SmokingCategory,
  WaistMeasurementDisplayPreference,
  WalkingPace,
  WeightDisplayPreference,
  WhiteEthnicBackground,
  WorkActivity
} from '@dnhc-health-checks/shared';
import { MockBiometricScoresBuilder } from './mock-biometric-scores-builder';
import type { ILabOrder } from '@dnhc-health-checks/shared/model/lab-order';
import type { IMockHealthCheck } from '../model/mock-health-check';
import { MockLabResultsBuilder } from './mock-lab-results-builder';
import { MockLabOrderBuilder } from './mock-lab-order-builder';

export enum DataModelVersion {
  V1_0_0 = '1.0.0',
  V2_1_0 = '2.1.0',
  V3_0_0 = '3.0.0'
}

export class MockHealthCheckBuilder {
  private readonly healthCheck: Partial<IMockHealthCheck> = {};

  constructor() {
    this.healthCheck.labOrders = [];
  }

  setCreatedAt(createdAt: string): this {
    this.healthCheck.createdAt = createdAt;
    return this;
  }

  setDataModelVersion(version: string): this {
    this.healthCheck.dataModelVersion = version;
    return this;
  }

  setQuestionnaire(questionnaire: IHealthCheckAnswers): this {
    this.healthCheck.questionnaire = questionnaire;
    return this;
  }

  updateQuestionnaire(questionnaire: Partial<IHealthCheckAnswers>): this {
    this.healthCheck.questionnaire = {
      ...this.healthCheck.questionnaire,
      ...questionnaire
    };
    return this;
  }

  setQuestionnaireScores(scores: IQuestionnaireScores): this {
    this.healthCheck.questionnaireScores = scores;
    return this;
  }

  updateQuestionnaireScores(scores: Partial<IQuestionnaireScores>): this {
    this.healthCheck.questionnaireScores = {
      ...this.healthCheck.questionnaireScores,
      ...scores
    };
    return this;
  }

  setResultTypes(resultTypes: LabTestType[]): this {
    this.healthCheck.resultTypes = resultTypes;
    return this;
  }

  setStep(step: HealthCheckSteps): this {
    this.healthCheck.step = step;
    return this;
  }

  setRiskScores(riskScores: IRiskScores): this {
    this.healthCheck.riskScores = riskScores;
    return this;
  }

  setQuestionnaireCompletionDate(date: string): this {
    this.healthCheck.questionnaireCompletionDate = date;
    return this;
  }

  setBloodTestOrder(bloodTestOrder: IHealthCheckBloodTestOrder): this {
    this.healthCheck.bloodTestOrder = bloodTestOrder;
    return this;
  }

  setBiometricScores(biometricScores: IBiometricScores[]): this {
    this.healthCheck.biometricScores = biometricScores;
    return this;
  }

  setBloodTestExpiryWritebackStatus(
    status: BloodTestExpiryWritebackStatus
  ): this {
    this.healthCheck.bloodTestExpiryWritebackStatus = status;
    return this;
  }

  setWasInvited(wasInvited: boolean): this {
    this.healthCheck.wasInvited = wasInvited;
    return this;
  }

  setLabOrder(labOrder: ILabOrder): this {
    this.healthCheck.labOrders = [labOrder];
    return this;
  }

  setLabResults(labResults: ILabResult[]): this {
    // ensure result dates are set in increasing order to mimic them being sent over time
    const now = new Date();
    labResults.forEach((result, idx) => {
      const resultDate = new Date(now.getDate() + (idx + 1) * 100);
      result.resultDate = result.receivedAt = resultDate.toISOString();
    });

    this.healthCheck.labResults = labResults;
    return this;
  }

  build(): IMockHealthCheck {
    return this.healthCheck as IMockHealthCheck;
  }

  clone(): MockHealthCheckBuilder {
    const clone = new MockHealthCheckBuilder();
    Object.assign(clone.healthCheck, structuredClone(this.healthCheck));
    return clone;
  }

  static basicHealthCheck(): MockHealthCheckBuilder {
    return new MockHealthCheckBuilder()
      .setCreatedAt(new Date().toISOString())
      .setDataModelVersion(DataModelVersion.V3_0_0)
      .setBloodTestExpiryWritebackStatus(BloodTestExpiryWritebackStatus.NA)
      .setStep(HealthCheckSteps.INIT)
      .setQuestionnaire({})
      .setWasInvited(false);
  }

  static healthCheckPassedCheckEligibilitySection(): MockHealthCheckBuilder {
    return this.basicHealthCheck()
      .setQuestionnaire({
        hasReceivedAnInvitation: false,
        canCompleteHealthCheckOnline: true,
        hasCompletedHealthCheckInLast5Years: false,
        hasPreExistingCondition: false
      })
      .setQuestionnaireScores({
        activityCategory: null,
        auditCategory: null,
        auditScore: null,
        bloodPressureCategory: null,
        bmiClassification: null,
        bmiScore: null,
        gppaqScore: null,
        imd: null,
        inProgressAuditScore: null,
        leicesterRiskCategory: null,
        leicesterRiskScore: null,
        smokingCategory: null,
        townsendScore: null
      })
      .setStep(HealthCheckSteps.INIT);
  }

  static healthCheckPassedAboutYouSection(): MockHealthCheckBuilder {
    return this.healthCheckPassedCheckEligibilitySection()
      .updateQuestionnaire({
        atypicalAntipsychoticMedication: false,
        detailedEthnicGroup:
          WhiteEthnicBackground.EnglishWelshScottishNIBritish,
        ethnicBackground: EthnicBackground.White,
        hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
        hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
        isAboutYouSectionSubmitted: true,
        lupus: false,
        migraines: false,
        postcode: null,
        rheumatoidArthritis: false,
        severeMentalIllness: false,
        sex: Sex.Female,
        smoking: Smoking.Never,
        steroidTablets: false
      })
      .updateQuestionnaireScores({
        smokingCategory: SmokingCategory.NeverSmoked
      });
  }

  static healthCheckPassedPhysicalActivitySection(): MockHealthCheckBuilder {
    const healthCheck = this.healthCheckPassedAboutYouSection();

    return healthCheck
      .updateQuestionnaire({
        ...healthCheck.build().questionnaire,
        atypicalAntipsychoticMedication: false,
        cycleHours: ExerciseHours.ThreeHoursOrMore,
        exerciseHours: ExerciseHours.ThreeHoursOrMore,
        gardeningHours: ExerciseHours.LessThanOne,
        houseworkHours: ExerciseHours.BetweenOneAndThree,
        isPhysicalActivitySectionSubmitted: true,
        walkHours: ExerciseHours.ThreeHoursOrMore,
        walkPace: WalkingPace.FastPace,
        workActivity: WorkActivity.PhysicalMedium
      })
      .setQuestionnaireScores({
        ...healthCheck.build().questionnaireScores,
        activityCategory: ActivityCategory.Active,
        gppaqScore: 9
      });
  }

  static healthCheckPassedAlcoholConsumptionSection(): MockHealthCheckBuilder {
    const healthCheck = this.healthCheckPassedPhysicalActivitySection();

    healthCheck
      .updateQuestionnaire({
        ...healthCheck.build().questionnaire,
        isAlcoholSectionSubmitted: true,
        drinkAlcohol: DoYouDrinkAlcohol.Never,
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
      })
      .setQuestionnaireScores({
        ...healthCheck.build().questionnaireScores,
        auditCategory: AuditCategory.NoRisk,
        auditScore: 0,
        inProgressAuditScore: null
      });

    return healthCheck;
  }

  static healthCheckPassedEnterBodyMeasurementsSection(): MockHealthCheckBuilder {
    const healthCheck = this.healthCheckPassedAlcoholConsumptionSection();
    healthCheck
      .updateQuestionnaire({
        ...healthCheck.build().questionnaire,
        height: 180,
        heightDisplayPreference: HeightDisplayPreference.Centimetres,
        isBodyMeasurementsSectionSubmitted: true,
        waistMeasurement: 100,
        waistMeasurementDisplayPreference:
          WaistMeasurementDisplayPreference.Centimetres,
        weight: 80,
        weightDisplayPreference: WeightDisplayPreference.Kilograms
      })
      .setQuestionnaireScores({
        ...healthCheck.build().questionnaireScores,
        bmiClassification: BmiClassification.Healthy,
        bmiScore: 24.7,
        leicesterRiskCategory: LeicesterRiskCategory.Medium,
        leicesterRiskScore: 11
      });

    return healthCheck;
  }

  static healthCheckPassedBloodPressureSection(): MockHealthCheckBuilder {
    const healthCheck = this.healthCheckPassedEnterBodyMeasurementsSection();
    healthCheck
      .updateQuestionnaire({
        ...healthCheck.build().questionnaire,
        isBloodPressureSectionSubmitted: true,
        bloodPressureDiastolic: 80,
        bloodPressureLocation: BloodPressureLocation.Monitor,
        bloodPressureSystolic: 120
      })
      .setQuestionnaireScores({
        ...healthCheck.build().questionnaireScores,
        bloodPressureCategory: BloodPressureCategory.Healthy
      });

    return healthCheck;
  }

  static healthCheckQuestionnaireCompleted(): MockHealthCheckBuilder {
    return this.healthCheckPassedBloodPressureSection()
      .setStep(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
      .setQuestionnaireCompletionDate(new Date().toISOString());
  }

  static basicHealthCheckWithResults(
    biometricScores: IBiometricScores = MockBiometricScoresBuilder.basicScores().build()
  ): MockHealthCheckBuilder {
    const healthCheck = this.healthCheckQuestionnaireCompleted();

    return healthCheck
      .setBloodTestOrder({
        address: {
          addressLine1: 'Flat 208',
          addressLine2: '85 Royal Mint Street',
          addressLine3: '',
          postcode: 'E1 8RD',
          townCity: 'London'
        },
        isBloodTestSectionSubmitted: true,
        searchParams: {
          buildingNumber: '2',
          postcode: 'EC1A 1AE'
        }
      })
      .setRiskScores({
        heartAge: 84,
        qRiskScore: 38.96,
        qRiskScoreCategory: QRiskCategory.High,
        scoreCalculationDate: new Date().toISOString()
      })
      .setStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
      .setBiometricScores([biometricScores])
      .setLabOrder(MockLabOrderBuilder.labOrderForBothTests().clone().build())
      .setLabResults(MockLabResultsBuilder.basicLabResults());
  }
}
