export enum EnvironmentVariables {
  ENV = 'ENV',
  UI_BASE_URL = 'UI_BASE_URL',
  API_BASE_URL = 'API_BASE_URL',
  HEADLESS = 'HEADLESS',
  TIMEOUT = 'TIMEOUT',
  SLOW_MO = 'SLOW_MO',
  ACCESSIBILITY_STANDARDS = 'ACCESSIBILITY_STANDARDS',
  REPORTING_OUTPUT_DIRECTORY = 'REPORTING_OUTPUT_DIRECTORY',
}

export const availableEnvironments = ['dev', 'staging', 'production'] as const;
export type Environment = typeof availableEnvironments[number];
