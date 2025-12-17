import {
  BloodTestExpiryWritebackStatus,
  HealthCheckSteps
} from '@dnhc-health-checks/shared';

interface BloodTestExpiryPayload {
  healthCheckStep: HealthCheckSteps;
  healthCheckCreationDate: string;
  healthCheckCompletedDate: string;
  bloodTestExpiryStatus: BloodTestExpiryWritebackStatus;
  expectedStatusChanges: boolean;
  description: string;
}

export function generateStringDateWithChangedDays(days: number): string {
  const date = new Date();
  return new Date(date.setDate(date.getDate() + days)).toISOString();
}

export function bloodTestExpiryWriteBackTestCases(): BloodTestExpiryPayload[] {
  return [
    {
      healthCheckStep: HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: true,
      description: `HealthCheck status ${HealthCheckSteps.QUESTIONNAIRE_COMPLETED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate > 28 days - expected to update BloodTestExpiry status`
    },
    {
      healthCheckStep: HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-28),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-28),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.QUESTIONNAIRE_COMPLETED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate = 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.Scheduled,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.QUESTIONNAIRE_COMPLETED}, bloodTestExpiryStatus 'Scheduled', healthCheckCompletedDate > 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.LAB_ORDERS_PLACED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: true,
      description: `HealthCheck status ${HealthCheckSteps.LAB_ORDERS_PLACED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate > 28 days - expected to update BloodTestExpiry status`
    },
    {
      healthCheckStep: HealthCheckSteps.LAB_ORDERS_PLACED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-28),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-28),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.LAB_ORDERS_PLACED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate = 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.LAB_ORDERS_PLACED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.Scheduled,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.LAB_ORDERS_PLACED}, bloodTestExpiryStatus 'Scheduled', healthCheckCompletedDate > 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.LAB_ORDERS_SCHEDULED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: true,
      description: `HealthCheck status ${HealthCheckSteps.LAB_ORDERS_SCHEDULED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate > 28 days - expected to update BloodTestExpiry status`
    },
    {
      healthCheckStep: HealthCheckSteps.LAB_ORDERS_SCHEDULED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-28),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-28),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.LAB_ORDERS_SCHEDULED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate = 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.LAB_ORDERS_SCHEDULED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.Scheduled,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.LAB_ORDERS_SCHEDULED}, bloodTestExpiryStatus 'Scheduled', healthCheckCompletedDate > 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.AUTO_EXPIRED,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.AUTO_EXPIRED}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate > 28 days - no expected changes`
    },
    {
      healthCheckStep: HealthCheckSteps.GP_UPDATE_SUCCESS,
      healthCheckCreationDate: generateStringDateWithChangedDays(-30),
      healthCheckCompletedDate: generateStringDateWithChangedDays(-29),
      bloodTestExpiryStatus: BloodTestExpiryWritebackStatus.NA,
      expectedStatusChanges: false,
      description: `HealthCheck status ${HealthCheckSteps.GP_UPDATE_SUCCESS}, bloodTestExpiryStatus 'NA', healthCheckCompletedDate > 28 days - no expected changes`
    }
  ];
}
