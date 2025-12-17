import { SqsClientService } from './sqsClient';
export interface IUpdatePatientRecordQueueUrl {
  patientGpOdsCode: string;
  patientNhsNumber: string;
  healthCheckId: string;
  correlationId: string;
}
export class UpdatePatientRecordQueueClientService extends SqsClientService<IUpdatePatientRecordQueueUrl> {
  constructor(envName: string) {
    super(envName, 'NhcUpdatePatientRecord.fifo', true);
  }
}
