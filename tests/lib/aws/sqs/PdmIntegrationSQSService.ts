import { SqsClientService } from './sqsClient';

export class PdmIntegrationSQSService extends SqsClientService<any> {
  constructor(envName: string) {
    super(envName, 'NhcPdmIntegration');
  }
}
