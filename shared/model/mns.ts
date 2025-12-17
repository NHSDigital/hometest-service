export enum MnsAcknowledgeType {
  BUSINESS_ACK = 'BUSINESS_ACK',
  TECH_ACK = 'TECH_ACK'
}

export enum MnsDnhcSubscriptionEventType {
  HC_COMPLETE_EVENT_ACK = 'nhshco-hc-complete-1-ack-1'
}

export enum MnsDnhcEventType {
  HC_COMPLETE_EVENT = 'nhshco-hc-complete-1'
}

export enum MnsMessageStatus {
  SENT = 'SENT',
  BUSINESS_ACK_RECEIVED = 'BUSINESS_ACK_RECEIVED',
  TECH_ACK_RECEIVED = 'TECH_ACK_RECEIVED'
}

export interface IMnsMessageLog {
  id: string;
  mnsId: string;
  nhsNumber: string;
  gpOdsCode: string;
  patientId: string;
  healthCheckId: string;
  sendTime: string;
  ack?: IMnsAcknowledgement[];
  status: MnsMessageStatus;
  resourceId: string;
}

export interface IMnsAcknowledgement {
  time: string;
  receiveTime: string;
  resourceId: string;
  ackType: MnsAcknowledgeType;
}

export interface IMnsOutboundQueueMessage {
  patientId: string;
  healthCheckId: string;
  pdmResourceId: string;
  nhsNumber: string;
  gpOdsCode: string;
  mnsNotificationType: string;
}

export interface MnsEventRequest {
  specversion: string;
  id: string;
  type: string;
  source: string;
  time: string;
  dataref: string;
}

export interface MnsCompletedHealthCheckEventRequest extends MnsEventRequest {
  subject: string;
  filtering: {
    gppractice: string;
  };
}

export interface MnsEventResponse {
  id: string;
}
