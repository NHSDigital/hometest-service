import dayjs from 'dayjs';
import toTitleCase from 'titlecase';
import {
  type IHealthCheck,
  type IBiometricScores,
  type ICholesterolScore,
  OverallCholesterolCategory,
  Smoking
} from '@dnhc-health-checks/shared';

const alwaysUppercase = new Set(['UK', 'NHS']);

export function retrieveMandatoryEnvVariable(name: string): string {
  const result = retrieveOptionalEnvVariable(name);
  if (result === '') {
    throw new Error(`Missing value for an environment variable ${name}`);
  }
  return result;
}

export function retrieveMandatoryJsonEnvVariable<T>(name: string): T {
  const result = retrieveMandatoryEnvVariable(name);
  try {
    return JSON.parse(result) as T;
  } catch {
    throw new Error(`Error while parsing env var ${name} as JSON`);
  }
}

export function retrieveOptionalEnvVariable(
  name: string,
  defaultValue: string = ''
): string {
  const envVarValue = process.env[name];
  if (envVarValue === undefined) {
    console.log(
      `The environment variable ${name} has not been provided for the lambda`
    );
  }
  return envVarValue ?? defaultValue ?? '';
}

export function calculateAge(birthdate: Date): number {
  return dayjs().diff(birthdate, 'years');
}

export function isNullOrUndefined<T>(
  value: T | null | undefined
): value is null | undefined {
  return value === null || value === undefined;
}

export function ensureDefined<T>(
  value: T | undefined,
  errorMessage: string = 'Value is undefined'
): T {
  if (value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}

export function generateRandomString(length): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

export function isInRange(min: number, max: number, value: number): boolean {
  return value >= min && value <= max;
}

export function roundTo1dp(value: number): number {
  return Math.round(value * 10) / 10;
}

export function titleCase(input: string): string {
  // Title case with common exclusions
  const titleCased: string = toTitleCase(input.toLowerCase());
  const parts = titleCased.split(' ');

  // Apply our own filtering to handle certain conditions
  return parts
    .map((part) => {
      // If word starts with a digit, or is in our alwaysUppercase list, leave it alone.
      // Digits because of flat numbers - eg 10A.
      if (/^\d/.test(part) || alwaysUppercase.has(part.toUpperCase())) {
        return part.toUpperCase();
      } else return part;
    })
    .join(' ');
}

export function getLatestBiometricScoreFromHealthCheck(
  healthCheck: IHealthCheck
): IBiometricScores | undefined {
  return healthCheck.biometricScores?.reduce((latest, current) =>
    new Date(current.date).getTime() > new Date(latest.date).getTime()
      ? current
      : latest
  );
}

export function hasAnyFailedOverallCholesterolCategory(
  cholesterol: ICholesterolScore | undefined
): boolean {
  return (
    cholesterol?.overallCategory ===
      OverallCholesterolCategory.PartialFailure ||
    cholesterol?.overallCategory === OverallCholesterolCategory.CompleteFailure
  );
}

export function getHealthCheckState(
  healthCheck: IHealthCheck,
  isPartial: boolean
): string {
  const latestScore =
    getLatestBiometricScoreFromHealthCheck(healthCheck)?.scores;
  return isPartial ||
    Boolean(hasAnyFailedOverallCholesterolCategory(latestScore?.cholesterol))
    ? 'incompleteHealthCheck'
    : 'completedHealthCheck';
}

export function mapSmokingStatusToSnomedCodeId(
  smokingStatus: Smoking | undefined | null
): string | undefined {
  switch (smokingStatus) {
    case Smoking.Quitted:
      return 'smokingStatusExSmoker';
    case Smoking.TwentyOrMorePerDay:
      return 'smokingStatusHeavySmoker';
    case Smoking.UpToNinePerDay:
      return 'smokingStatusLightSmoker';
    case Smoking.TenToNineteenPerDay:
      return 'smokingStatusModerateSmoker';
    case Smoking.Never:
      return 'smokingStatusNonSmoker';
    default:
      return undefined;
  }
}

export function validateUrlSource(urlSource?: string): string | undefined {
  if (!urlSource) {
    return undefined;
  }
  const trimmed = urlSource.trim();

  // Valid values are only 2 characters:
  // https://nhsd-confluence.digital.nhs.uk/spaces/DHC/pages/1161760409
  if (trimmed.length !== 2) {
    return undefined;
  }

  if (!/^[a-zA-Z]+$/.test(trimmed)) {
    return undefined;
  }

  return trimmed.toUpperCase();
}
