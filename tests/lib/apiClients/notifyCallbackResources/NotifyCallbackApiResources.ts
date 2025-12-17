import type { APIResponse } from '@playwright/test';
import { NotifyCallbackApiClient } from '../NotifyCallbackApiClient';

export interface notifyApiKeys {
  secretKey: string;
  secertValue: string;
}

export interface NotifyPayloadSingleItem {
  type: string;
  attributes: {
    messageId: string;
    messageReference?: string;
    messageStatus?: string;
    messageStatusDescription?: string;
    channels: Array<{
      type: string;
      channelStatus: string;
    }>;
    timestamp?: string;
    routingPlan?: {
      id: string;
      name: string;
      version: string;
      createdDate: string;
    };
  };
  links?: {
    message: string;
  };
  meta?: {
    idempotencyKey: string;
  };
}

export interface NotifyCallbackPayloadSchema {
  data: Array<NotifyPayloadSingleItem>;
}

export class NotifyCallbackApiResource {
  protected readonly notifyCallbackApiClient: NotifyCallbackApiClient;

  constructor() {
    this.notifyCallbackApiClient = new NotifyCallbackApiClient();
  }

  public async sendNotification(
    notifyCallbackPayload: NotifyCallbackPayloadSchema
  ): Promise<APIResponse> {
    return await this.notifyCallbackApiClient.postRequest(
      'notify/message-status',
      notifyCallbackPayload
    );
  }

  public async sendNotificationWithInvalidApiKey(
    notifyCallbackPayload: NotifyCallbackPayloadSchema
  ): Promise<APIResponse> {
    return await this.notifyCallbackApiClient.postRequest(
      'notify/message-status',
      notifyCallbackPayload,
      'invalid-api_key'
    );
  }

  public async sendNotificationWithInvalidHeader(
    notifyCallbackPayload: NotifyCallbackPayloadSchema
  ): Promise<APIResponse> {
    return await this.notifyCallbackApiClient.postRequest(
      'notify/message-status',
      notifyCallbackPayload,
      await this.notifyCallbackApiClient.getApiKeyValue(),
      { wrong_header: 'invalid-header' }
    );
  }
}
