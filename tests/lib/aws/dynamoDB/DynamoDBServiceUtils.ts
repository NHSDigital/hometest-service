import DbHealthCheckService from './DbHealthCheckService';
import { type Config } from '../../../env/config';
import type { BaseTestUser } from '../../users/BaseUser';
import DbPatientService from './DbPatientService';
import {
  type IHealthCheck,
  type IHealthCheckAnswers,
  type IQuestionnaireScores
} from '@dnhc-health-checks/shared';

export class DynamoDBServiceUtils {
  dbHealthCheckService: DbHealthCheckService;
  dbPatientService: DbPatientService;

  constructor(automatedTestConfig: Config) {
    this.dbPatientService = new DbPatientService(automatedTestConfig.name);
    this.dbHealthCheckService = new DbHealthCheckService(
      automatedTestConfig.name
    );
  }

  async pause(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async checkHealthCheckAnswerInDatabase(
    nhsNumber: string,
    healthCheckAnswerCheckFunction: (
      questionnaire: IHealthCheckAnswers | undefined
    ) => boolean,
    maxAttempts: number = 5,
    delayMs: number = 1000
  ): Promise<boolean> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const healthChecks: IHealthCheck[] =
        await this.dbHealthCheckService.getHealthCheckItemsByNhsNumber(
          nhsNumber
        );
      if (healthChecks.length > 0) {
        const questionnaire = healthChecks[0].questionnaire;
        const result = healthCheckAnswerCheckFunction(questionnaire);
        if (result) {
          return true;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }

    console.log('Max attempts reached: Unable to retrieve health check data');
    return false;
  }

  async checkQuestionnaireAnswerWasStoredInDatabase(
    questionnaireItem: keyof IHealthCheckAnswers,
    expectedValue: string | number,
    testedUser: BaseTestUser
  ): Promise<boolean> {
    return await this.checkHealthCheckAnswerInDatabase(
      testedUser.nhsNumber,
      (questionnaire) =>
        questionnaire
          ? questionnaire[questionnaireItem] === expectedValue
          : false
    );
  }

  async checkHealthCheckQuestionnaireScoresInDatabase(
    nhsNumber: string,
    healthCheckAnswerCheckFunction: (
      questionnaireScores: IQuestionnaireScores | undefined
    ) => boolean,
    maxAttempts: number = 5,
    delayMs: number = 2000
  ): Promise<boolean> {
    let attempts = 0;
    const healthCheckId =
      await this.dbHealthCheckService.getIdByNhsNumber(nhsNumber);

    while (attempts < maxAttempts) {
      const healthCheck: IHealthCheck =
        await this.dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      const questionnaireScores = healthCheck.questionnaireScores;
      const result = healthCheckAnswerCheckFunction(questionnaireScores);
      if (result) {
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }

    console.log('Max attempts reached: Unable to retrieve health check data');
    return false;
  }

  async checkQuestionnaireScoreWasUpdatedInDatabase(
    questionnaireScoreItem: keyof IQuestionnaireScores,
    expectedValue: string | number | null,
    testedUser: BaseTestUser
  ): Promise<boolean> {
    return await this.checkHealthCheckQuestionnaireScoresInDatabase(
      testedUser.nhsNumber,
      (questionnaireScore) =>
        questionnaireScore
          ? questionnaireScore[questionnaireScoreItem] === expectedValue
          : false
    );
  }

  async cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser: BaseTestUser,
    healthCheck: IHealthCheck
  ): Promise<string> {
    await this.dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
    await this.dbHealthCheckService.createHealthCheck(healthCheck);
    return healthCheck.id;
  }

  async updateHealthCheckQuestionnaire(
    healthCheckId: string,
    fieldsToUpdate: Partial<IHealthCheckAnswers>
  ): Promise<void> {
    const healthCheck =
      await this.dbHealthCheckService.getHealthCheckItemById(healthCheckId);
    await this.dbHealthCheckService.updateHealthCheckQuestionnaire(
      healthCheckId,
      {
        ...healthCheck.questionnaire,
        ...fieldsToUpdate
      }
    );
  }
}
