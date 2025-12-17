import { type Config, ConfigFactory } from '../env/config';
import { DynamoDBServiceUtils } from './aws/dynamoDB/DynamoDBServiceUtils';
import type { BaseTestUser } from './users/BaseUser';
import {
  HealthCheckSteps,
  type IBiometricScores,
  type IHealthCheckAnswers,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';

const config: Config = ConfigFactory.getConfig();
const dynamoDBServiceUtils = new DynamoDBServiceUtils(config);

export async function setupHealthCheckWithResults(
  testedUser: BaseTestUser,
  questionnaire: IHealthCheckAnswers,
  questionnaireScores: IQuestionnaireScores,
  riskScores: IRiskScores,
  biometricScores: IBiometricScores[]
): Promise<string> {
  return await dynamoDBServiceUtils.setupHealthCheckItem(
    testedUser.nhsNumber,
    HealthCheckSteps.GP_UPDATE_SUCCESS,
    questionnaire,
    questionnaireScores,
    riskScores,
    biometricScores
  );
}
