import { type IHealthCheckAnswers } from './health-check-answers';
import { type IHealthCheckBloodTestOrder } from './health-check-blood-test';
import { type IRiskScores } from './risk-scores';
import { type IBiometricScores } from './biometric-scores';
import type { HealthCheckSteps } from './enum/health-check-steps';
import type {
  AutoExpiryStatus,
  BloodTestExpiryWritebackStatus
} from './enum/expiry-statuses';
import type {
  AuditCategory,
  ActivityCategory,
  BmiClassification,
  BloodPressureCategory,
  LeicesterRiskCategory,
  SmokingCategory
} from './enum/score-categories';
import type { LabTestType } from './enum/lab-result';
import type { NotificationTemplate } from './enum/notify-routing-plan';

export interface IHealthCheck {
  id: string;
  dataModelVersion: string;
  nhsNumber: string;
  dataModelVersionHistory?: DataModelVersion[];
  patientId: string;
  createdAt: string;
  expiredAt?: string;
  ageAtStart: number;
  ageAtCompletion?: number;
  questionnaire: IHealthCheckAnswers;
  questionnaireScores?: IQuestionnaireScores;
  questionnaireCompletionDate?: string;
  riskScores?: IRiskScores;
  biometricScores?: IBiometricScores[];
  resultTypes?: LabTestType[];
  step: HealthCheckSteps;
  expiryStatus?: AutoExpiryStatus;
  bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus;
  bloodTestOrder?: IHealthCheckBloodTestOrder;
  nudges?: INudge[];
  wasInvited?: boolean;
}

export interface IQuestionnaireScores extends ISimpleScores {
  townsendScore?: string | null;
  imd?: IImdScore | null;
}

export interface IImdScore {
  decile: number;
  rank: number;
  score: number;
}

export interface DataModelVersion {
  dataModelVersion: string;
  migrationDate: string;
}

export interface ISimpleScores {
  auditScore?: number | null;
  inProgressAuditScore?: number | null;
  auditCategory?: AuditCategory | null;
  activityCategory?: ActivityCategory | null;
  gppaqScore?: number | null;
  bmiScore?: number | null;
  bmiClassification?: BmiClassification | null;
  bloodPressureCategory?: BloodPressureCategory | null;
  leicesterRiskScore?: number | null;
  leicesterRiskCategory?: LeicesterRiskCategory | null;
  smokingCategory?: SmokingCategory | null;
}

export interface INudge {
  type: NotificationTemplate;
  sent: string;
}
