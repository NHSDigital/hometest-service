import {
  SQSClient,
  SendMessageCommand,
  type SendMessageRequest
} from '@aws-sdk/client-sqs';
import { StsService } from '../StsService';
import { v4 as uuidv4 } from 'uuid';

export interface ISQSClientResponse {
  messageId: string;
}

export class SqsClientService<TBody> {
  readonly client: SQSClient;
  readonly envName: string;
  readonly stsClient: StsService;
  readonly queueName: string;
  readonly isFifo: boolean;

  constructor(envName: string, queueName: string, isFifo: boolean = false) {
    this.client = new SQSClient();
    this.envName = envName;
    this.stsClient = new StsService();
    this.queueName = queueName;
    this.isFifo = isFifo;
  }

  async sendMessage(payload: TBody): Promise<ISQSClientResponse> {
    const input: SendMessageRequest = {
      QueueUrl: await this.getQueueUrl(this.queueName),
      MessageBody: JSON.stringify(payload),
      ...(this.isFifo && {
        MessageGroupId: uuidv4(),
        MessageDeduplicationId: uuidv4()
      })
    };
    const command = new SendMessageCommand(input);
    const response = await this.client.send(command);
    console.log(`Successful call to SQS queue`, { payload });
    return { messageId: response.MessageId ?? '' };
  }

  protected async getQueueUrl(queueName: string): Promise<string> {
    const accountId = (await this.stsClient.getAccountId()) ?? '';
    return `https://sqs.eu-west-2.amazonaws.com/${accountId}/${this.envName}${queueName}`;
  }

  async getNhcLabOrderQueueUrl(): Promise<string> {
    return `${await this.getQueueUrl('NhcLabOrderQueue')}`;
  }

  async getQueueArn(queueName: string): Promise<string> {
    const accountId = (await this.stsClient.getAccountId()) ?? '';
    return `arn:aws:sqs:eu-west-2:${accountId}:${this.envName}${queueName}`;
  }
}
