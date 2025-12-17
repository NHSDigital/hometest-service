export interface IDeadLetterMessage {
  id: string;
  queueName: string;
  messageId: string;
  messageCreationTime: string;
  addToDbTime: string;
  messageBody: string;
  status: DeadLetterMessageStatus;
  retries: number;
  originalMessageId: string;
  maxAutoRetriesReached: boolean;
  deleteTime?: number; // UNIX epoch in seconds - used for TTL
  messageGroupId?: string; // only exists on FIFO queues
}

export enum DeadLetterMessageStatus {
  New = 'New',
  Redriven = 'Redriven'
}

export enum DeadLetterMessageAttributes {
  Retries = 'retries',
  OriginalMessageId = 'originalMessageId'
}
