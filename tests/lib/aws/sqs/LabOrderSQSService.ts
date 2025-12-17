import { SqsClientService } from './sqsClient';

export class LabOrderSQSService extends SqsClientService<any> {
  constructor(envName: string) {
    super(envName, 'NhcLabOrderQueue');
  }
}
