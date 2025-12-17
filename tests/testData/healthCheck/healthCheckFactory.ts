import {
  HealthCheckSteps,
  LabTestType,
  QRiskCategory,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  questionnairesData,
  questionnairesScoresData
} from '../questionnairesTestData';
import { HealthCheckBuilder } from './healthCheckBuilder';
import { getLabResultsTestDataQuestionnaireScores } from '../labResultsTestData';
import type { BaseTestUser } from '../../lib/users/BaseUser';
import { healthyBiometricScores } from '../biometricTestData';

export enum HealthCheckType {
  INITIAL,
  QUESTIONNAIRE_COMPLETED,
  QUESTIONNAIRE_FILLED,
  WITH_RESULTS_TYPE_CHOLESTEROL,
  GP_UPDATE_SUCCESS
}

const defaultRiskScores = {
  heartAge: 84,
  qRiskScore: 38.96,
  qRiskScoreCategory: QRiskCategory.High,
  scoreCalculationDate: '2024-08-13T09:04:53.804Z'
};

export class HealthCheckFactory {
  static createHealthCheck(
    user: BaseTestUser,
    type: HealthCheckType
  ): IHealthCheck {
    switch (type) {
      case HealthCheckType.INITIAL:
        return new HealthCheckBuilder(user).build();
      case HealthCheckType.QUESTIONNAIRE_FILLED:
        return new HealthCheckBuilder(user)
          .withQuestionnaire(questionnairesData())
          .withQuestionnaireScores(questionnairesScoresData())
          .withStep(HealthCheckSteps.INIT)
          .build();
      case HealthCheckType.QUESTIONNAIRE_COMPLETED:
        return new HealthCheckBuilder(user)
          .withQuestionnaire(questionnairesData())
          .withQuestionnaireScores(questionnairesScoresData())
          .withStep(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
          .build();
      case HealthCheckType.WITH_RESULTS_TYPE_CHOLESTEROL:
        return new HealthCheckBuilder(user)
          .withResultTypes([LabTestType.Cholesterol])
          .withStep(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
          .withQuestionnaire(questionnairesData())
          .withQuestionnaireScores(getLabResultsTestDataQuestionnaireScores())
          .build();
      case HealthCheckType.GP_UPDATE_SUCCESS:
        return new HealthCheckBuilder(user)
          .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
          .withQuestionnaire(questionnairesData())
          .withQuestionnaireScores(questionnairesScoresData())
          .withRiskScores(defaultRiskScores)
          .withBiometricScores(healthyBiometricScores())
          .build();
      default:
        throw new Error('Invalid health check type');
    }
  }
}
