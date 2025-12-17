import { type Recipient } from '../components/recipient';
import { type TypeMessage } from '../enums/type-message';

export interface NotifyMessageRequest {
  data: Data;
}

export interface Data {
  type: TypeMessage;
  attributes: Attributes;
}

export interface Attributes {
  routingPlanId: string;
  messageReference: string;
  recipient: Recipient;
  personalisation?: Personalisation;
}

export type Personalisation = Record<string, string>;
