import { v4 as uuidv4 } from 'uuid';

interface NhcCollectDlqMessagesLambdaSqsPayload {
  Records: unknown[];
}

interface SqsPayloadAttributes {
  ApproximateReceiveCount: string;
  SentTimestamp: string;
  MessageGroupId?: string;
  MessageDeduplicationId?: string;
  ApproximateFirstReceiveTimestamp: string;
  DeadLetterQueueSourceArn: string;
}

export function getNhcCollectDlqMessagesLambdaPayload(
  body: unknown,
  messageId: string,
  sentTimestamp: string,
  dlqSourceArn: string,
  isFifo: boolean = true
): NhcCollectDlqMessagesLambdaSqsPayload {
  const attributesValues: SqsPayloadAttributes = {
    ApproximateReceiveCount: '1',
    SentTimestamp: sentTimestamp,
    ApproximateFirstReceiveTimestamp: '1733751508295',
    DeadLetterQueueSourceArn: dlqSourceArn
  };
  if (isFifo) {
    attributesValues.MessageGroupId = uuidv4();
    attributesValues.MessageDeduplicationId = uuidv4();
  }
  return {
    Records: [
      {
        body: JSON.stringify(body),
        messageId,
        attributes: attributesValues
      }
    ]
  };
}
