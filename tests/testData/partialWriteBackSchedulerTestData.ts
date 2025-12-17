import type {
  IHealthCheckAnswers,
  IQuestionnaireScores
} from '@dnhc-health-checks/shared';
import { ScheduledReason } from '../lib/apiClients/HealthCheckModel';
import { BloodPressureLocation } from '../lib/enum/health-check-answers';
import { FollowUpEventType } from './emisFollowUpTestData';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores
} from './questionnairesTestData';

interface PartialWriteBackSchedulerPayload {
  testQuestionnaire: IHealthCheckAnswers;
  testQuestionnaireScores: IQuestionnaireScores;
  testSchedulerReason: ScheduledReason;
  expectedSchedulerChanges: boolean;
  expectedSchedulerDelete: boolean;
  followUpValue?: FollowUpEventType;
  description: string;
}

export function partialWriteBackTestCases(): PartialWriteBackSchedulerPayload[] {
  return [
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.HighBP,
      expectedSchedulerChanges: false,
      expectedSchedulerDelete: true,
      description: `HighBP in scheduler, normal BP in HealthCheck (BP location At Home) - expected to remove scheduler from DB and add event`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire({
        bloodPressureSystolic: 135
      }),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.HighBP,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.FollowUp,
      description: `HighBP in scheduler, highBP systolic in HealthCheck (BP location At Home) - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire({
        bloodPressureDiastolic: 99
      }),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.HighBP,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.FollowUp,
      description: `HighBP in scheduler, highBP diastolic in HealthCheck (BP location At Home) - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire({
        bloodPressureLocation: BloodPressureLocation.Pharmacy
      }),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.HighBP,
      expectedSchedulerChanges: false,
      expectedSchedulerDelete: true,
      description: `HighBP in scheduler, normal BP in HealthCheck (BP location At a clinic) - expected to remove scheduler from DB and add event`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire({
        bloodPressureLocation: BloodPressureLocation.Pharmacy,
        bloodPressureSystolic: 179
      }),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.HighBP,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.FollowUp,
      description: `HighBP in scheduler, highBP systolic in HealthCheck (BP location At a clinic) - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire({
        bloodPressureLocation: BloodPressureLocation.Pharmacy,
        bloodPressureDiastolic: 90
      }),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.HighBP,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.FollowUp,
      description: `HighBP in scheduler, highBP diastolic in HealthCheck (BP location At a clinic) - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores({
        auditScore: 15
      }),
      testSchedulerReason: ScheduledReason.AuditScore,
      expectedSchedulerChanges: false,
      expectedSchedulerDelete: true,
      description: `AuditScore in scheduler, normal AuditScore in HealthCheck - expected to remove scheduler from DB and add event`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores({
        auditScore: 20
      }),
      testSchedulerReason: ScheduledReason.AuditScore,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.UrgentFollowUp,
      description: `AuditScore in scheduler, high AuditScore in HealthCheck - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.UrgentHighBP,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.NoFollowUp,
      description: `UrgentHighBP in scheduler - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.UrgentLowBP,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.NoFollowUp,
      description: `UrgentLowBP in scheduler - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.BloodResultOutstanding,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.NoFollowUp,
      description: `BloodResultOutstanding in scheduler - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
      testSchedulerReason: ScheduledReason.ExpiryQuestionnaire,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.NoFollowUp,
      description: `ExpiryQuestionnaire in scheduler - expected to update scheduler in DB`
    },
    {
      testQuestionnaire: healthyHealthCheckQuestionnaire(),
      testQuestionnaireScores: healthyHealthCheckQuestionnaireScores({
        leicesterRiskScore: 16
      }),
      testSchedulerReason: ScheduledReason.ExpiryQuestionnaire,
      expectedSchedulerChanges: true,
      expectedSchedulerDelete: false,
      followUpValue: FollowUpEventType.FollowUp,
      description: `ExpiryQuestionnaire in scheduler with follow up in health check - expected to update scheduler in DB`
    }
  ];
}

export function highBpPartialWriteBackTestCases(): Array<{
  bloodPressureOption: BloodPressureLocation;
  systolic: number;
  diastolic: number;
  desc: string;
}> {
  return [
    {
      bloodPressureOption: BloodPressureLocation.Monitor,
      systolic: 136,
      diastolic: 80,
      desc: 'High Systolic BP, taken at home'
    },
    {
      bloodPressureOption: BloodPressureLocation.Pharmacy,
      systolic: 120,
      diastolic: 120,
      desc: 'High Diastolic BP, taken at clinic'
    }
  ];
}
