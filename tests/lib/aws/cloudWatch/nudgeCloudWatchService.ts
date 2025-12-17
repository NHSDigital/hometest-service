import { type FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchService } from './cloudWatchService';

export class NudgeCloudWatchService extends CloudWatchService {
  protected getLogGroupName(): string {
    return `/aws/lambda/${this.config.name}NhcIdentifyNudgesLambdaLogGroup`;
  }

  constructor(region: string = 'eu-west-2') {
    super(region);
  }

  async waitForMessageInNudgeLog(
    startTime: number,
    searchedMessage: string
  ): Promise<FilteredLogEvent[]> {
    return this.searchForLogs((logs) => logs, searchedMessage, { startTime });
  }
}
