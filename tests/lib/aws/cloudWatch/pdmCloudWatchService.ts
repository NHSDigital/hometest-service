import { type FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchService } from './cloudWatchService';

export class PdmCloudWatchService extends CloudWatchService {
  protected getLogGroupName(): string {
    return `/aws/lambda/${this.config.name}NhcPdmIntegrationLambdaLogGroup`;
  }

  constructor(region: string = 'eu-west-2') {
    super(region);
  }

  async waitForSuccessfulPdmLog(
    healthCheckId: string
  ): Promise<FilteredLogEvent[]> {
    return this.searchForLogs(
      (logs) => logs.filter((log) => log.message?.includes(healthCheckId)),
      'resources added'
    );
  }

  async waitForErrorPdmLog(healthCheckId: string): Promise<FilteredLogEvent[]> {
    return this.searchForLogs(
      (logs) => logs.filter((log) => log.message?.includes(healthCheckId)),
      'Error consuming SQS message'
    );
  }

  async waitForMnsDisabledLog(
    healthCheckId: string
  ): Promise<FilteredLogEvent[]> {
    return this.searchForLogs(
      (logs) => logs.filter((log) => log.message?.includes(healthCheckId)),
      'MNS integration is disabled'
    );
  }
}
