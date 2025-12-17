import { type JSONSchemaType } from 'ajv';
import type { IGpOdsCode } from '../../../models/ods-codes/ods-code';

type GpOdsCodeValidation = Omit<
  IGpOdsCode,
  'refId' | 'guid' | 'onboardedAt'
> & {
  validFrom: string;
};

export const gpOdsCodeSchema: JSONSchemaType<GpOdsCodeValidation> = {
  type: 'object',
  properties: {
    gpOdsCode: { type: 'string', minLength: 1, nullable: false },
    gpEmail: { type: 'string', minLength: 1, nullable: false },
    gpName: { type: 'string', minLength: 1, nullable: false },
    localAuthority: { type: 'string', minLength: 1, nullable: false },
    enabled: { type: 'boolean', const: false, default: false },
    validFrom: { type: 'string', nullable: false, format: 'date' }
  },
  required: ['gpOdsCode', 'gpEmail', 'gpName', 'localAuthority', 'validFrom'],
  additionalProperties: false
};
