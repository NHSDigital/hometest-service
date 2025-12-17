export enum JobType {
  preRelease = 'pre-release',
  postRelease = 'post-release'
}

export enum ReleaseTag {
  v3_0_0 = 'v3.0.0',
  v3_1_0 = 'v3.1.0',
  v3_3_0 = 'v3.3.0',
  v3_12_0 = 'v3.12.0',
  v3_14_0 = 'v3.14.0',
  v3_15_0 = 'v3.15.0'
}

export interface IAction {
  getActionName: () => string;
  run: (envName: string, dryRun: boolean) => Promise<void>;
  cleanUp: () => Promise<void>;
}
