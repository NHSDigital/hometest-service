import {
  ActivityCategory,
  LeicesterRiskCategory,
  QRiskCategory,
  type IHealthCheckAnswers,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';
import {
  BloodPressureLocation,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  Sex,
  Smoking
} from '../lib/enum/health-check-answers';

interface EmisPayload {
  healthCheckId: string;
  patientGpOdsCode: string;
  patientNhsNumber: string;
  correlationId: string;
}

interface NhcUpdatePatientRecordLambdaSqsPayload {
  Records: unknown[];
}

export function getNhcUpdatePatientRecordLambdaPayload(
  healthCheckId: string,
  nhsNumber: string,
  odsCode: string = 'mock_enabled_code'
): NhcUpdatePatientRecordLambdaSqsPayload {
  const emisPayload: EmisPayload = {
    healthCheckId,
    patientGpOdsCode: odsCode,
    patientNhsNumber: nhsNumber,
    correlationId: '6b681992-acbb-4b93-a781-378911fc160e'
  };

  const attributesPayload = { ApproximateReceiveCount: 1 };

  return {
    Records: [
      {
        body: JSON.stringify(emisPayload),
        attributes: JSON.stringify(attributesPayload)
      }
    ]
  };
}

export function getHealthCheckQuestionnaireForEmisLambda(
  override?: Partial<IHealthCheckAnswers>
): IHealthCheckAnswers {
  return {
    bloodPressureDiastolic: 90,
    bloodPressureSystolic: 160,
    bloodPressureLocation: BloodPressureLocation.Pharmacy,
    height: 190,
    weight: 100,
    waistMeasurement: 70,
    smoking: Smoking.Never,
    hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
    hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes,
    sex: Sex.Male,
    impotence: false,
    lupus: false,
    migraines: true,
    rheumatoidArthritis: true,
    severeMentalIllness: false,
    steroidTablets: false,
    atypicalAntipsychoticMedication: false,
    ...override
  };
}

export function getHealthCheckQuestionnaireScoresForEmisLambda(
  override?: Partial<IQuestionnaireScores>
): IQuestionnaireScores {
  return {
    activityCategory: ActivityCategory.Active,
    auditScore: 37,
    bmiScore: 21,
    gppaqScore: 1,
    leicesterRiskCategory: LeicesterRiskCategory.Medium,
    leicesterRiskScore: 13,
    townsendScore: null,
    ...override
  };
}

export function getHealthCheckRiskScoresForEmisLambda(
  override?: Partial<IRiskScores>
): IRiskScores {
  return {
    heartAge: 84,
    qRiskScore: 38.96,
    qRiskScoreCategory: QRiskCategory.High,
    scoreCalculationDate: '2024-07-09T12:41:52.690Z',
    ...override
  };
}
