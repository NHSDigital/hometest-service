import { type JSONSchemaType } from 'ajv';
import { type IPatientInfo } from '../../../nhc-backend-stack/update-patient-info-lambda/update-patient-info-service';

export const patientInfoSchema: JSONSchemaType<IPatientInfo> = {
  type: 'object',
  properties: {
    termsAccepted: { type: 'boolean', nullable: false }
  },
  required: ['termsAccepted'],
  additionalProperties: false
};
