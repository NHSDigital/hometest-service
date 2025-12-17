import { type IHealthCheck, type IScores } from '@dnhc-health-checks/shared';

export function getLatestBiometricScores(
  healthCheck: IHealthCheck | undefined
): IScores {
  if (
    healthCheck?.biometricScores === undefined ||
    healthCheck.biometricScores.length === 0
  ) {
    throw new Error('Invalid biometrics data!');
  }

  let latestBiometricScore = healthCheck.biometricScores[0];

  for (const item of healthCheck.biometricScores) {
    if (item.date > latestBiometricScore.date) {
      latestBiometricScore = item;
    }
  }

  return latestBiometricScore.scores;
}
