import { V1HealthCheckMigration } from '../actions/v3.0.0/post-release/v1-health-check-migration';
import { V2HealthCheckMigration } from '../actions/v3.0.0/post-release/v2-health-check-migration';
import { V3HealthCheckMigration } from '../actions/3.12.0/v3-health-check-migration';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { JobType, ReleaseTag, type IAction } from './types';
import { SSMClient } from '@aws-sdk/client-ssm';
import { SetParameterAction } from './actions/set-parameter-action';

enum ToggleName {
  GPPracticeEmailEnabled = 'gpPracticeEmailEnabled',
  PDMEnabled = 'pdmEnabled',
  HCExpiryNotificationEnabled = 'hcExpiryNotificationEnabled',
  MNSEnabled = 'mnsEnabled'
}

const dynamoDbClient = DynamoDBDocument.from(new DynamoDBClient({}));
const ssmClient = new SSMClient();

const actionsMap: Record<ReleaseTag, Record<JobType, () => IAction[]>> = {
  [ReleaseTag.v3_0_0]: {
    [JobType.preRelease]: () => [
      setParameterValue(ToggleName.GPPracticeEmailEnabled, 'false')
    ],
    [JobType.postRelease]: () => [
      new V1HealthCheckMigration(dynamoDbClient),
      new V2HealthCheckMigration(dynamoDbClient)
    ]
  },
  [ReleaseTag.v3_1_0]: {
    [JobType.preRelease]: () => [
      setParameterValue(ToggleName.PDMEnabled, 'true')
    ],
    [JobType.postRelease]: () => []
  },
  [ReleaseTag.v3_3_0]: {
    [JobType.preRelease]: () => [],
    [JobType.postRelease]: () => [
      setParameterValue(ToggleName.GPPracticeEmailEnabled, 'true')
    ]
  },
  [ReleaseTag.v3_12_0]: {
    [JobType.preRelease]: () => [],
    [JobType.postRelease]: () => [new V3HealthCheckMigration(dynamoDbClient)]
  },
  [ReleaseTag.v3_14_0]: {
    [JobType.preRelease]: () => [
      setParameterValue(ToggleName.HCExpiryNotificationEnabled, 'false')
    ],
    [JobType.postRelease]: () => []
  },
  [ReleaseTag.v3_15_0]: {
    [JobType.preRelease]: () => [
      setParameterValue(ToggleName.MNSEnabled, 'false')
    ],
    [JobType.postRelease]: () => []
  }
};

function setParameterValue(toggleName: ToggleName, value: string): IAction {
  return new SetParameterAction(ssmClient, toggleName, value);
}

export const ActionsRegistry = {
  getActions(tag: string, jobType: string): IAction[] {
    if (actionsMap[tag]?.[jobType] !== undefined) {
      return actionsMap[tag][jobType]();
    }
    return [];
  }
};
