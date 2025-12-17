import {
  healthyBiometricScores,
  healthyCholesterolScores,
  healthyDiabetesScores
} from './biometricTestData';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores,
  healthyHealthCheckRiskScores
} from './questionnairesTestData';
import { Sex, Smoking } from '../lib/enum/health-check-answers';
import {
  DiabetesCategory,
  OverallCholesterolCategory,
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  type IBiometricScores,
  type IHealthCheckAnswers,
  type IQuestionnaireScores,
  type IRiskScores,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared';

const urgentFollowUpMessage =
  'Digital National Health Service Health Check requires urgent follow-up (finding)';
const urgentFollowUpCode = '2242661000000109';
const followUpMessage =
  'Digital National Health Service Health Check requires follow-up (finding)';
const followUpCode = '2242651000000106';

const leicesterScoreFollowUpMessage =
  'Leicester Diabetes Risk Score (observable entity) - Routine Follow-up';
const leicesterScoreUrgentFollowUpMessage =
  'Leicester Diabetes Risk Score (observable entity) - Urgent Follow-up';
const smokingMessage =
  'Moderate cigarette smoker (10-19 cigs/day) (finding) - Routine Follow-up';
const qRiskScoreFollowUpMessage =
  'QRISK3 cardiovascular disease 10 year risk calculator score (observable entity) - Routine Follow-up';
const qRiskScoreUrgentFollowUpMessage =
  'QRISK3 cardiovascular disease 10 year risk calculator score (observable entity) - Urgent Follow-up';
const totalCholesterolHdlRatioFollowUpMessage =
  'Serum high density lipoprotein cholesterol level (observable entity) - Routine Follow-up';
const totalCholesterolFollowUpMessage =
  'Serum cholesterol level (observable entity) - Routine Follow-up';
const totalCholesterolUrgentFollowUpMessage =
  'Serum cholesterol level (observable entity) - Urgent Follow-up';
const lipoproteinRatioFollowUpMessage =
  'High density/low density lipoprotein ratio (observable entity) - Routine Follow-up';
const hba1cUrgentFollowUpMessage =
  'Haemoglobin A1c level (observable entity) - Urgent Follow-up';

export enum FollowUpEventType {
  NoFollowUp = 'no',
  FollowUp = 'yes',
  UrgentFollowUp = 'urgent'
}

interface EmisFollowUpTestCase {
  desc: string;
  expectedMessagesInPayload: string[];
  notExpectedMessagesInPayload: string[];
  eventFollowUpType: FollowUpEventType;
}

interface EmisFollowUpPayload {
  testQuestionnaire: IHealthCheckAnswers;
  testQuestionnaireScores: IQuestionnaireScores;
  testRiskScores: IRiskScores;
  testBiometricScores: IBiometricScores[];
  expectedFollowUp: EmisFollowUpTestCase;
}

export function getEmisFollowUpTestCase(
  override?: Partial<EmisFollowUpTestCase>
): EmisFollowUpTestCase {
  return {
    desc: 'no followUp',
    expectedMessagesInPayload: [],
    notExpectedMessagesInPayload: [
      urgentFollowUpMessage,
      urgentFollowUpCode,
      followUpMessage,
      followUpCode
    ],
    eventFollowUpType: FollowUpEventType.NoFollowUp,
    ...override
  };
}

export function getEmisPayloadNoFollowUpNoUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire(),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
    testRiskScores: healthyHealthCheckRiskScores(),
    testBiometricScores: healthyBiometricScores(),
    expectedFollowUp: getEmisFollowUpTestCase()
  };
}

export function getEmisPayloadFollowUpNoUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire({
      smoking: Smoking.TenToNineteenPerDay
    }),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores({
      leicesterRiskScore: 16
    }),
    testRiskScores: healthyHealthCheckRiskScores({ qRiskScore: 12 }),
    testBiometricScores: healthyBiometricScores(),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'only follow-up',
      expectedMessagesInPayload: [
        followUpMessage,
        followUpCode,
        leicesterScoreFollowUpMessage,
        smokingMessage,
        qRiskScoreFollowUpMessage
      ],
      notExpectedMessagesInPayload: [urgentFollowUpMessage, urgentFollowUpCode],
      eventFollowUpType: FollowUpEventType.FollowUp
    })
  };
}

export function getEmisPayloadFollowUpUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire({
      smoking: Smoking.TenToNineteenPerDay
    }),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores({
      leicesterRiskScore: 16
    }),
    testRiskScores: healthyHealthCheckRiskScores({ qRiskScore: 22 }),
    testBiometricScores: healthyBiometricScores(),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'follow-up and urgent follow-up',
      expectedMessagesInPayload: [
        urgentFollowUpMessage,
        urgentFollowUpCode,
        qRiskScoreUrgentFollowUpMessage,
        leicesterScoreFollowUpMessage,
        smokingMessage
      ],
      notExpectedMessagesInPayload: [followUpMessage, followUpCode],
      eventFollowUpType: FollowUpEventType.UrgentFollowUp
    })
  };
}

export function getEmisPayloadNoFollowUpUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire(),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores({
      leicesterRiskScore: 25
    }),
    testRiskScores: healthyHealthCheckRiskScores({ qRiskScore: 22 }),
    testBiometricScores: healthyBiometricScores(),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'only urgent follow-up',
      expectedMessagesInPayload: [
        urgentFollowUpMessage,
        urgentFollowUpCode,
        leicesterScoreUrgentFollowUpMessage,
        qRiskScoreUrgentFollowUpMessage
      ],
      notExpectedMessagesInPayload: [followUpMessage, followUpCode],
      eventFollowUpType: FollowUpEventType.UrgentFollowUp
    })
  };
}

export function getEmisPayloadFemaleBiometricFollowUpNoUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire({ sex: Sex.Female }),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
    testRiskScores: healthyHealthCheckRiskScores(),
    testBiometricScores: healthyBiometricScores(
      healthyCholesterolScores({
        overallCategory: OverallCholesterolCategory.High,
        totalCholesterol: 6,
        totalCholesterolCategory: TotalCholesterolCategory.High,
        hdlCholesterol: 1.1,
        hdlCholesterolCategory: HdlCholesterolCategory.Low,
        totalCholesterolHdlRatio: 5,
        totalCholesterolHdlRatioCategory:
          TotalCholesterolHdlRatioCategory.Normal
      })
    ),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'only female biometric follow-up',
      expectedMessagesInPayload: [
        followUpMessage,
        followUpCode,
        totalCholesterolFollowUpMessage,
        totalCholesterolHdlRatioFollowUpMessage
      ],
      notExpectedMessagesInPayload: [urgentFollowUpMessage, urgentFollowUpCode],
      eventFollowUpType: FollowUpEventType.FollowUp
    })
  };
}

export function getEmisPayloadMaleBiometricFollowUpNoUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire(),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
    testRiskScores: healthyHealthCheckRiskScores(),
    testBiometricScores: healthyBiometricScores(
      healthyCholesterolScores({
        overallCategory: OverallCholesterolCategory.High,
        totalCholesterol: 6,
        totalCholesterolCategory: TotalCholesterolCategory.High,
        hdlCholesterol: 0.9,
        hdlCholesterolCategory: HdlCholesterolCategory.Low,
        totalCholesterolHdlRatio: 5,
        totalCholesterolHdlRatioCategory:
          TotalCholesterolHdlRatioCategory.Normal
      })
    ),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'only male biometric follow-up',
      expectedMessagesInPayload: [
        followUpMessage,
        followUpCode,
        totalCholesterolFollowUpMessage,
        totalCholesterolHdlRatioFollowUpMessage
      ],
      notExpectedMessagesInPayload: [urgentFollowUpMessage, urgentFollowUpCode],
      eventFollowUpType: FollowUpEventType.FollowUp
    })
  };
}

export function getEmisPayloadBiometricFollowUpUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire(),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
    testRiskScores: healthyHealthCheckRiskScores(),
    testBiometricScores: healthyBiometricScores(
      healthyCholesterolScores({
        overallCategory: OverallCholesterolCategory.VeryHigh,
        totalCholesterol: 9,
        totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
        hdlCholesterol: 1.5,
        hdlCholesterolCategory: HdlCholesterolCategory.Normal,
        totalCholesterolHdlRatio: 7,
        totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
      })
    ),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'biometric follow-up and urgent follow-up',
      expectedMessagesInPayload: [
        urgentFollowUpMessage,
        urgentFollowUpCode,
        totalCholesterolUrgentFollowUpMessage,
        lipoproteinRatioFollowUpMessage
      ],
      notExpectedMessagesInPayload: [followUpMessage, followUpCode],
      eventFollowUpType: FollowUpEventType.UrgentFollowUp
    })
  };
}

export function getEmisPayloadBiometricNoFollowUpUrgentFollowUp(): EmisFollowUpPayload {
  return {
    testQuestionnaire: healthyHealthCheckQuestionnaire(),
    testQuestionnaireScores: healthyHealthCheckQuestionnaireScores(),
    testRiskScores: healthyHealthCheckRiskScores(),
    testBiometricScores: healthyBiometricScores(
      healthyCholesterolScores({
        overallCategory: OverallCholesterolCategory.VeryHigh,
        totalCholesterol: 9,
        totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
        hdlCholesterol: 1.5,
        hdlCholesterolCategory: HdlCholesterolCategory.Normal,
        totalCholesterolHdlRatio: 7,
        totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
      }),
      healthyDiabetesScores({
        hba1c: 49,
        category: DiabetesCategory.Low
      })
    ),
    expectedFollowUp: getEmisFollowUpTestCase({
      desc: 'only biometric urgent follow-up',
      expectedMessagesInPayload: [
        urgentFollowUpMessage,
        urgentFollowUpCode,
        hba1cUrgentFollowUpMessage,
        totalCholesterolUrgentFollowUpMessage
      ],
      notExpectedMessagesInPayload: [followUpMessage, followUpCode],
      eventFollowUpType: FollowUpEventType.UrgentFollowUp
    })
  };
}
