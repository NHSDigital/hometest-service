import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
  type FilteredLogEvent
} from '@aws-sdk/client-cloudwatch-logs';
import { ConfigFactory } from '../../../env/config';

export abstract class CloudWatchService {
  protected client: CloudWatchLogsClient;
  protected config = ConfigFactory.getConfig();
  protected abstract getLogGroupName(): string;

  constructor(region: string = 'eu-west-2') {
    this.client = new CloudWatchLogsClient({ region });
  }

  protected async pause(timeMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeMs));
  }

  async searchForLogs(
    expectedLogsFilter: (logs: FilteredLogEvent[]) => FilteredLogEvent[],
    searchPhrase: string,
    options: {
      startTime?: number;
      endTime?: number;
      maxAttempts?: number;
      delayMs?: number;
    } = {}
  ): Promise<FilteredLogEvent[]> {
    const {
      startTime = new Date().setDate(new Date().getDate() - 1),
      endTime = new Date().setDate(new Date().getDate() + 1),
      maxAttempts = 48,
      delayMs = 5000
    } = options;
    const logGroupName = this.getLogGroupName();
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const command = new FilterLogEventsCommand({
        logGroupName,
        startTime,
        endTime,
        filterPattern: searchPhrase,
        limit: 2000
      });
      let response = await this.client.send(command);
      const logs = response.events ?? [];
      while (response.nextToken) {
        const nextCommand = new FilterLogEventsCommand({
          logGroupName,
          startTime,
          endTime,
          filterPattern: searchPhrase,
          limit: 2000,
          nextToken: response.nextToken
        });
        response = await this.client.send(nextCommand);
        logs.push(...(response.events ?? []));
      }
      const filteredLogs = expectedLogsFilter(logs);
      if (filteredLogs.length > 0) {
        console.log('Found matching logs');
        return filteredLogs;
      }
      if (attempts < maxAttempts - 1) {
        await this.pause(delayMs);
      }
    }
    console.error('No matching logs found');
    return [];
  }
}
