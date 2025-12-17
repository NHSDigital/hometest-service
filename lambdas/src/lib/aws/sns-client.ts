import {
  type SNSClient,
  type PublishCommandInput,
  PublishCommand
} from '@aws-sdk/client-sns';
import { AWSService } from '../aws-service';
import type { Commons } from '../commons';

export interface ISNSClientResponse {
  messageId: string;
}

export class SNSClientService extends AWSService<SNSClient> {
  constructor(commons: Commons, snsClient: SNSClient) {
    super(commons, 'SNSClientService', snsClient);
  }

  async sendSNSMessage(
    message: string,
    topicArn: string
  ): Promise<ISNSClientResponse> {
    try {
      this.logger.debug('about to send SNS message', { topicArn, message });

      const params: PublishCommandInput = {
        Message: message,
        TopicArn: topicArn
      };
      const response = await this.client.send(new PublishCommand(params));

      this.logger.info('SNS message sent successfully', {
        messageId: response.MessageId
      });

      return { messageId: response.MessageId ?? '' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('error occurred while sending SNS message', {
        error: errorMessage
      });
      throw error;
    }
  }
}
