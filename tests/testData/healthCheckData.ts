import { randomUUID } from 'crypto';
import type { BaseTestUser } from '../lib/users/BaseUser';
import { questionnairesData } from './questionnairesTestData';
import {
  BloodTestExpiryWritebackStatus,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

export const HealthCheckDataModelVersionLatest = '3.0.0';

export function getInitialHealthCheck(user: BaseTestUser): IHealthCheck {
  return {
    id: randomUUID(),
    ageAtStart: user.age ?? 0,
    bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus.NA,
    createdAt: new Date().toISOString(),
    dataModelVersion: HealthCheckDataModelVersionLatest,
    nhsNumber: user.nhsNumber,
    patientId: user.patientId ?? '',
    questionnaire: {},
    step: HealthCheckSteps.INIT
  };
}

export function getHealthCheckWithQuestionnaire(
  user: BaseTestUser
): IHealthCheck {
  return {
    ...getInitialHealthCheck(user),
    questionnaire: questionnairesData()
  };
}
