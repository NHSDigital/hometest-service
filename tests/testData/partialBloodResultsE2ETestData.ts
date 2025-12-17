import {
  HealthCheckSteps,
  BloodTestExpiryWritebackStatus,
  type ILabResultData,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  LabResultsData,
  getLabResults,
  getLabResultsTestDataQuestionnaireScoresObese,
  getLabResultsTestDataQuestionnaireScoresHealthy
} from './labResultsTestData';
import { questionnairesData } from './questionnairesTestData';

export enum PartialBloodTestScenarioType {
  CholesterolAndDiabetesBothParitalFailure,
  CholesterolOnlyPartialFailure,
  CholesterolAndDiabetesCompleteFailureToSuccess,
  CholesterolAndDiabetesCompleteFailureToCompleteFailure,
  CholesterolAndDiabetesCompleteFailureToPartialFailure
}

export enum dataModelVersion {
  V1_0_0 = '1.0.0',
  V2_1_0 = '2.1.0',
  V2_2_0 = '2.2.0',
  latest = '3.0.0', //Always keep up to date with latest
  V3_0_0 = '3.0.0'
}

export interface PartialBloodTestScenario {
  scenarioName: string;
  scenarioType: PartialBloodTestScenarioType;
  healthCheck: Partial<IHealthCheck>;
  isDiabetes: boolean;
  expectedHealthCheckStepAfterResults: HealthCheckSteps;
  labResults: ILabResultData[];
  pendingOrder: boolean;
  verifyEmail: boolean;
}

const healthCheckWithDiabetesTest: Partial<IHealthCheck> = {
  questionnaire: questionnairesData(),
  dataModelVersion: dataModelVersion.latest,
  questionnaireScores: getLabResultsTestDataQuestionnaireScoresObese(),
  createdAt: new Date().toISOString(),
  step: HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
  bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus.NA
};

export const partialBloodTestsE2EScenarios: PartialBloodTestScenario[] = [
  {
    scenarioName:
      'Cholesterol and diabeties - Cholesterol and diabetes partial failure',
    scenarioType:
      PartialBloodTestScenarioType.CholesterolAndDiabetesBothParitalFailure,
    healthCheck: healthCheckWithDiabetesTest,
    isDiabetes: true,
    expectedHealthCheckStepAfterResults: HealthCheckSteps.GP_UPDATE_SUCCESS,
    labResults: getLabResults(
      LabResultsData.PartialResultsHbA1CFailedAndCHOfailed
    ),
    pendingOrder: false,
    verifyEmail: true
  },
  {
    scenarioName: 'Cholesterols only - partial failure',
    scenarioType: PartialBloodTestScenarioType.CholesterolOnlyPartialFailure,
    healthCheck: {
      questionnaire: questionnairesData(),
      dataModelVersion: dataModelVersion.V2_1_0,
      questionnaireScores: getLabResultsTestDataQuestionnaireScoresHealthy(),
      createdAt: new Date().toISOString(),
      step: HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus.NA
    },
    isDiabetes: false,
    expectedHealthCheckStepAfterResults: HealthCheckSteps.GP_UPDATE_SUCCESS,
    labResults: getLabResults(
      LabResultsData.PartialFailureCholesterolOnlyHDLfailed
    ),
    pendingOrder: false,
    verifyEmail: false
  },
  {
    scenarioName: 'Diabetes and Cholesterol - complete failure to success',
    scenarioType:
      PartialBloodTestScenarioType.CholesterolAndDiabetesCompleteFailureToSuccess,
    healthCheck: healthCheckWithDiabetesTest,
    isDiabetes: true,
    expectedHealthCheckStepAfterResults: HealthCheckSteps.LAB_ORDERS_PLACED,
    labResults: getLabResults(LabResultsData.CompleteFailureCholesterolHbA1c),
    pendingOrder: true,
    verifyEmail: false
  },
  {
    scenarioName:
      'Diabetes and Cholesterol - complete failure to partial failure',
    scenarioType:
      PartialBloodTestScenarioType.CholesterolAndDiabetesCompleteFailureToPartialFailure,
    healthCheck: healthCheckWithDiabetesTest,
    isDiabetes: true,
    expectedHealthCheckStepAfterResults: HealthCheckSteps.LAB_ORDERS_PLACED,
    labResults: getLabResults(LabResultsData.CompleteFailureCholesterolHbA1c),
    pendingOrder: true,
    verifyEmail: false
  },
  {
    scenarioName:
      'Diabetes and Cholesterol - complete failure to complete failure',
    scenarioType:
      PartialBloodTestScenarioType.CholesterolAndDiabetesCompleteFailureToCompleteFailure,
    healthCheck: healthCheckWithDiabetesTest,
    isDiabetes: true,
    expectedHealthCheckStepAfterResults: HealthCheckSteps.LAB_ORDERS_PLACED,
    labResults: getLabResults(LabResultsData.CompleteFailureCholesterolHbA1c),
    pendingOrder: true,
    verifyEmail: true
  }
];
