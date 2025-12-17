import Ajv, { type ValidateFunction } from 'ajv';
import { questionnaireSchema } from './schemas/questionnaire-schema';
import { labResultSchema } from './schemas/lab-result-schema';
import { patientInfoSchema } from './schemas/patient-info-schema';
import { Service } from '../service';
import { type Commons } from '../commons';
import { auditEventSchema } from './schemas/audit-event-schema';
import { bloodTestOrderSchema } from './schemas/blood-test-order-schema';
import validatePostCode from './validate-post-code';
import validateFreeTextInputLength from './validate-text-input';
import { notifyCallbacksSchema } from './schemas/notify-callbacks-schema';
import type { ValidationOutcome } from './validation-outcome';

export enum ValidatorType {
  Questionnaire = 'Questionnaire',
  LabResult = 'LabResult',
  AuditEvent = 'AuditEvent',
  PatientInfo = 'PatientInfo',
  BloodTestOrder = 'BloodTestOrder',
  NotifyCallbacks = 'NotifyCallbacks'
}

const ajv = new Ajv({ $data: true, allowUnionTypes: true, useDefaults: true });

ajv.addFormat('postcode', {
  type: 'string',
  validate: validatePostCode
});

ajv.addFormat('freeTextInput', {
  type: 'string',
  validate: validateFreeTextInputLength
});

const validators = new Map<ValidatorType, ValidateFunction>([
  [ValidatorType.Questionnaire, ajv.compile(questionnaireSchema)],
  [ValidatorType.LabResult, ajv.compile(labResultSchema)],
  [ValidatorType.AuditEvent, ajv.compile(auditEventSchema)],
  [ValidatorType.PatientInfo, ajv.compile(patientInfoSchema)],
  [ValidatorType.BloodTestOrder, ajv.compile(bloodTestOrderSchema)],
  [ValidatorType.NotifyCallbacks, ajv.compile(notifyCallbacksSchema)]
]);

export class SchemaValidationService extends Service {
  constructor(commons: Commons) {
    super(commons, 'SchemaValidationService');
  }

  public validateObject<TObject>(
    objectToValidate: TObject,
    validatorType: ValidatorType
  ): ValidationOutcome {
    this.logger.debug('About to validate object using validator', {
      validatorType
    });

    const validator = validators.get(validatorType);
    if (validator === undefined) {
      return {
        isValid: false,
        errorMessage: 'The validator could not be found'
      };
    }

    if (validator(objectToValidate)) {
      return {
        isValid: true
      };
    } else {
      this.logger.error('The object is invalid', { errors: validator.errors });
      return {
        isValid: false,
        errorMessage: 'The object does not conform to the schema',
        errorDetails: validator.errors ?? undefined
      };
    }
  }
}
