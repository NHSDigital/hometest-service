import {
  type MessageAttributeValue,
  type SQSClient,
  SendMessageCommand,
  type SendMessageRequest
} from '@aws-sdk/client-sqs';
import { type Commons } from '../commons';
import { AWSService } from '../aws-service';

export interface ISQSClientResponse {
  messageId: string;
}

export class SQSClientService extends AWSService<SQSClient> {
  constructor(commons: Commons, sqsClient: SQSClient) {
    super(commons, 'SQSClientService', sqsClient);
  }

  async sendMessage<TBody>(
    queueUrl: string,
    payload: TBody,
    messageGroupId?: string,
    messageDeduplicationId?: string,
    messageAttributes?: Record<string, MessageAttributeValue>
  ): Promise<ISQSClientResponse> {
    try {
      this.logger.debug('about to send SQS message to queue', { queueUrl });

      const input: SendMessageRequest = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
        MessageGroupId: messageGroupId,
        MessageDeduplicationId: messageDeduplicationId,
        MessageAttributes: messageAttributes
      };
      const command = new SendMessageCommand(input);
      const response = await this.client.send(command);

      this.logger.debug('message successfully put on the queue', {
        messageId: response.MessageId
      });
      return { messageId: response.MessageId ?? '' };
    } catch (error) {
      this.logger.error('message could not be put on the queue', { error });
      throw error;
    }
  }
}
