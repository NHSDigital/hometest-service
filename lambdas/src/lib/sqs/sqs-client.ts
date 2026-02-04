import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export interface SqsResult {
  messageId?: string;
  sequenceNumber?: string;
}

export interface SQSClientInterface {
  sendMessage(queueUrl: string, messageBody: string, messageAttributes?: Record<string, any>): Promise<SqsResult>;
  close(): Promise<void>;
}
export class AWSSQSClient implements SQSClientInterface {
  private client: SQSClient;

  constructor(region: string = process.env.AWS_REGION || "eu-west-1") {
    this.client = new SQSClient({
      region,
      maxAttempts: 3,
      endpoint: process.env.SQS_ENDPOINT,
    });
  }

  async sendMessage(
    queueUrl: string,
    messageBody: string,
    messageAttributes?: Record<string, any>
  ): Promise<SqsResult> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageAttributes: messageAttributes,
    });

    const result = await this.client.send(command);
    return {
      messageId: result.MessageId,
      sequenceNumber: result.SequenceNumber,
    };
  }

  async close(): Promise<void> {
    this.client.destroy();
  }
}
