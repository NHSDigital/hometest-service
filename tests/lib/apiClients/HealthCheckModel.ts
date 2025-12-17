export interface LoginOutput {
  patientEligible: boolean;
  sessionId?: string;
  refreshToken?: string;
  reason?: string;
  cognitoResponse?: CognitoIdentityResponse;
}

export interface CognitoIdentityResponse {
  token: string;
  identityId: string;
}

export interface AuditEventBody {
  healthCheckId: string;
  eventType?: string;
  details?: Record<string, boolean | number | string | null | undefined>;
}

export interface LsoaImdQuestionnaireScoresItem {
  decile: number;
  rank?: number;
  score?: number;
}

export interface DeliverAddress {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  townCity: string;
  postcode: string;
}

export interface LeicesterDiabetesRiskScoreData {
  ethnicBackground: string;
  detailedEthnicGroup: string;
  weight: number;
  height: number;
  waistMeasurement: number;
  sex: string;
  hasFamilyDiabetesHistory: string;
}

export interface AlcoholAuditScoreTestData {
  alcoholGuilt?: string | null;
  alcoholMultipleDrinksOneOccasion?: string | null;
  drinkAlcohol?: string | null;
  alcoholCannotStop?: string | null;
  alcoholHowOften?: string | null;
  alcoholMorningDrink?: string | null;
  alcoholPersonInjured?: string | null;
  alcoholConcernedRelative?: string | null;
  alcoholDailyUnits?: string | null;
  alcoholFailedObligations?: string | null;
  alcoholMemoryLoss?: string | null;
  isAlcoholSectionSubmitted?: boolean;
}

export interface SearchParams {
  postcode: string;
  buildingNumber: string;
}

export interface BloodTestOrder {
  isBloodTestSectionSubmitted?: boolean;
  phoneNumber?: string;
  address?: DeliverAddress;
  searchParams?: SearchParams;
}

export enum ScheduledReason {
  HighBP = 'highBP',
  UrgentHighBP = 'urgentHighBP',
  UrgentLowBP = 'urgentLowBP',
  ExpiryQuestionnaire = 'expiryQuestionnaire',
  BloodResultOutstanding = 'bloodResultOutstanding',
  AuditScore = 'auditScore'
}
