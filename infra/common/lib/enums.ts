export enum EnvType {
  PROD = 'prod',
  NONPROD = 'nonprod'
}

export enum BackupTags {
  HourlyBackup = 'DNHCAwsBackupHourly',
  DailyBackup = 'DNHCAwsBackupDaily'
}

export enum NhcTopic {
  SECURITY = 'SecurityAlarmTopicArn',
  STANDARD = 'AlarmTopicArn',
  GP_ONBOARDING = 'GpOnboardingTopicArn'
}

export enum AccountName {
  POC = 'poc',
  TEST = 'test',
  INT = 'int',
  PROD = 'prod'
}
