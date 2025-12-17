import {
  type IHealthCheck,
  type IQuestionnaireScores,
  type INudge,
  type DataModelVersion
} from '@dnhc-health-checks/shared/model/health-check';
import { HealthCheckSteps } from '@dnhc-health-checks/shared/model/enum/health-check-steps';
import {
  BloodTestExpiryWritebackStatus,
  type AutoExpiryStatus
} from '@dnhc-health-checks/shared/model/enum/expiry-statuses';
import type { NotificationTemplate } from '@dnhc-health-checks/shared/model/enum/notify-routing-plan';
import type { LabTestType } from '@dnhc-health-checks/shared/model/enum/lab-result';
import type {
  IBiometricScores,
  IHealthCheckAnswers,
  IHealthCheckBloodTestOrder,
  IRiskScores
} from '@dnhc-health-checks/shared';
import type { BaseTestUser } from '../../lib/users/BaseUser';
import { randomUUID } from 'crypto';
import { dataModelVersion } from '../partialBloodResultsE2ETestData';

export class HealthCheckBuilder {
  private healthCheck: IHealthCheck;

  constructor(user: BaseTestUser) {
    this.healthCheck = {
      id: randomUUID(),
      ageAtStart: user.age ?? 50,
      bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus.NA,
      createdAt: new Date().toISOString(),
      dataModelVersion: dataModelVersion.latest,
      nhsNumber: user.nhsNumber,
      patientId: user.patientId ?? '',
      questionnaire: {},
      step: HealthCheckSteps.INIT,
      wasInvited: false
    };
  }

  public withId(id: string): HealthCheckBuilder {
    this.healthCheck.id = id;
    return this;
  }

  public withDataModelVersion(version: string): HealthCheckBuilder {
    this.healthCheck.dataModelVersion = version;
    return this;
  }

  public withNhsNumber(nhsNumber: string): HealthCheckBuilder {
    this.healthCheck.nhsNumber = nhsNumber;
    return this;
  }

  public withDataModelVersionHistory(
    history: DataModelVersion[]
  ): HealthCheckBuilder {
    this.healthCheck.dataModelVersionHistory = history;
    return this;
  }

  public withPatientId(patientId: string): HealthCheckBuilder {
    this.healthCheck.patientId = patientId;
    return this;
  }

  public withCreatedAt(createdAt: string): HealthCheckBuilder {
    this.healthCheck.createdAt = createdAt;
    return this;
  }

  public withExpiredAt(expiredAt: string): HealthCheckBuilder {
    this.healthCheck.expiredAt = expiredAt;
    return this;
  }

  public withAgeAtStart(age: number): HealthCheckBuilder {
    this.healthCheck.ageAtStart = age;
    return this;
  }

  public withAgeAtCompletion(age: number): HealthCheckBuilder {
    this.healthCheck.ageAtCompletion = age;
    return this;
  }

  public withQuestionnaire(
    questionnaire: IHealthCheckAnswers
  ): HealthCheckBuilder {
    this.healthCheck.questionnaire = questionnaire;
    return this;
  }

  public withQuestionnaireScores(
    scores: IQuestionnaireScores
  ): HealthCheckBuilder {
    this.healthCheck.questionnaireScores = scores;
    return this;
  }

  public withQuestionnaireCompletionDate(date: string): HealthCheckBuilder {
    this.healthCheck.questionnaireCompletionDate = date;
    return this;
  }

  public withRiskScores(riskScores: IRiskScores): HealthCheckBuilder {
    this.healthCheck.riskScores = riskScores;
    return this;
  }

  public withBiometricScores(
    biometricScores: IBiometricScores[]
  ): HealthCheckBuilder {
    this.healthCheck.biometricScores = biometricScores;
    return this;
  }

  public withResultTypes(resultTypes: LabTestType[]): HealthCheckBuilder {
    this.healthCheck.resultTypes = resultTypes;
    return this;
  }

  public withStep(step: HealthCheckSteps): HealthCheckBuilder {
    this.healthCheck.step = step;
    return this;
  }

  public withExpiryStatus(status: AutoExpiryStatus): HealthCheckBuilder {
    this.healthCheck.expiryStatus = status;
    return this;
  }

  public withBloodTestExpiryWritebackStatus(
    status: BloodTestExpiryWritebackStatus
  ): HealthCheckBuilder {
    this.healthCheck.bloodTestExpiryWritebackStatus = status;
    return this;
  }

  public withBloodTestOrder(
    order: IHealthCheckBloodTestOrder
  ): HealthCheckBuilder {
    this.healthCheck.bloodTestOrder = order;
    return this;
  }

  public withNudges(nudges: INudge[]): HealthCheckBuilder {
    this.healthCheck.nudges = nudges;
    return this;
  }

  public withWasInvited(invitation: boolean): HealthCheckBuilder {
    this.healthCheck.wasInvited = invitation;
    return this;
  }

  public addNudge(
    type: NotificationTemplate,
    sent: string
  ): HealthCheckBuilder {
    this.healthCheck.nudges ??= [];
    this.healthCheck.nudges.push({ type, sent });
    return this;
  }

  public build(): IHealthCheck {
    return { ...this.healthCheck };
  }
}
