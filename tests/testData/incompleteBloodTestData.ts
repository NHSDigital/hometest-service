import { forEach } from 'lodash';
import {
  healthyCholesterolScores,
  healthyDiabetesScores
} from './biometricTestData';
import { OverallCholesterolCategory, OverallDiabetesCategory, type IBiometricScores, type ICholesterolScore, type IDiabetesScore } from '@dnhc-health-checks/shared';

const currentDate = new Date();
export interface IncompleteBloodTestPayload {
  biometricScoreData: IBiometricScores[];
  expectedMessages: string[];
  isHealthCheckCompleted?: boolean;
  description: string;
}

export function failedCholesterolScores(
  override?: Partial<ICholesterolScore>
): ICholesterolScore {
  return {
    overallCategory: OverallCholesterolCategory.CompleteFailure,
    totalCholesterolFailureReason: 'Total cholesterol failure reason',
    totalCholesterolHdlRatioFailureReason:
      'Cholesterol hdl ratio failure reason',
    hdlCholesterolFailureReason: 'Hdl cholesterol failure reason',
    ...override
  };
}

export function failedDiabetesScores(
  override?: Partial<IDiabetesScore>
): IDiabetesScore {
  return {
    overallCategory: OverallDiabetesCategory.CompleteFailure,
    failureReason: 'Hba1c failure reason',
    ...override
  };
}

function getDateAndTime(input: string): string {
  const result = new Date(input);

  const day = result.toLocaleString('en-GB', { day: '2-digit' });
  const month = result.toLocaleString('en-GB', { month: 'short' }).slice(0, 3);
  const year = result.toLocaleString('en-GB', { year: 'numeric' });

  return `${day}-${month}-${year}`;
}

export function getExpectedMessagesInEmisPayload(
  biometricScoreData: IBiometricScores[]
): string[] {
  const messageList: string[] = [];

  forEach(biometricScoreData, (biometricScore) => {
    if (biometricScore.scores?.cholesterol != null) {
      if (
        'totalCholesterolFailureReason' in biometricScore.scores?.cholesterol
      ) {
        messageList.push(
          `Serum cholesterol level (observable entity) Failed due to ${biometricScore.scores.cholesterol.totalCholesterolFailureReason} (${getDateAndTime(biometricScore.date)})`
        );
      }
      if ('hdlCholesterolFailureReason' in biometricScore.scores?.cholesterol) {
        messageList.push(
          `Serum high density lipoprotein cholesterol level (observable entity) Failed due to ${biometricScore.scores.cholesterol.hdlCholesterolFailureReason} (${getDateAndTime(biometricScore.date)})`
        );
      }
      if (
        'totalCholesterolHdlRatioFailureReason' in
        biometricScore.scores?.cholesterol
      ) {
        messageList.push(
          `High density/low density lipoprotein ratio (observable entity) Failed due to ${biometricScore.scores.cholesterol.totalCholesterolHdlRatioFailureReason} (${getDateAndTime(biometricScore.date)})`
        );
      }
    }

    if (biometricScore.scores?.diabetes != null) {
      if ('failureReason' in biometricScore.scores?.diabetes) {
        messageList.push(
          `Haemoglobin A1c level (observable entity) Failed due to ${biometricScore.scores.diabetes.failureReason} (${getDateAndTime(biometricScore.date)})`
        );
      }
    }
  });
  return messageList;
}

export function getIncompleteBloodTestCholesterolDiabetesReorderFailed(): IncompleteBloodTestPayload {
  const biometricScoreData: IBiometricScores[] = [
    {
      date: new Date().toISOString(),
      scores: {
        cholesterol: failedCholesterolScores(),
        diabetes: failedDiabetesScores()
      }
    },
    {
      date: new Date(currentDate.getTime() - 86400000).toISOString(),
      scores: {
        cholesterol: failedCholesterolScores(),
        diabetes: failedDiabetesScores()
      }
    }
  ];
  return {
    biometricScoreData,
    expectedMessages: getExpectedMessagesInEmisPayload(biometricScoreData),
    isHealthCheckCompleted: false,
    description: 'Cholesterol and diabetes reorder failed'
  };
}

export function getIncompleteBloodTestCholesterolDiabetesReorderSuccess(): IncompleteBloodTestPayload {
  const biometricScoreData = [
    {
      date: new Date().toISOString(),
      scores: {
        cholesterol: healthyCholesterolScores(),
        diabetes: healthyDiabetesScores()
      }
    },
    {
      date: new Date(currentDate.getTime() - 86400000).toISOString(),
      scores: {
        cholesterol: failedCholesterolScores(),
        diabetes: failedDiabetesScores()
      }
    }
  ];
  return {
    biometricScoreData,
    expectedMessages: getExpectedMessagesInEmisPayload(biometricScoreData),
    isHealthCheckCompleted: true,
    description: 'Cholesterol and diabetes reorder success'
  };
}

export function getIncompleteBloodTestCholesterolReorderSuccessDiabetesReorderFailed(): IncompleteBloodTestPayload {
  const biometricScoreData = [
    {
      date: new Date().toISOString(),
      scores: {
        cholesterol: healthyCholesterolScores(),
        diabetes: failedDiabetesScores()
      }
    },
    {
      date: new Date(currentDate.getTime() - 86400000).toISOString(),
      scores: {
        cholesterol: failedCholesterolScores(),
        diabetes: failedDiabetesScores()
      }
    }
  ];
  return {
    biometricScoreData,
    expectedMessages: getExpectedMessagesInEmisPayload(biometricScoreData),
    isHealthCheckCompleted: true,
    description: 'Cholesterol reorder success and diabetes reorder failed'
  };
}
