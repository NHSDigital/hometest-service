import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { Service } from '../service';
import { type Commons } from '../commons';
import { gpOdsCodeSchema } from './schemas/auto-db-load/gp-ods-code-schema';
import type { ValidationOutcome } from './validation-outcome';

export enum ValidatorType {
  GpOdsCode = 'GpOdsCode'
}

const ajv = new Ajv({ $data: true, allowUnionTypes: true, useDefaults: true });
addFormats(ajv);

const validators = new Map<ValidatorType, ValidateFunction>([
  [ValidatorType.GpOdsCode, ajv.compile(gpOdsCodeSchema)]
]);

export class AutoDbLoadSchemaValidationService extends Service {
  private readonly tableValidators: Record<string, ValidatorType> = {
    'nhc-ods-code-db': ValidatorType.GpOdsCode
  };

  constructor(commons: Commons) {
    super(commons, 'AutoDbLoadSchemaValidationService');
  }

  public getValidatorTypeForTable(
    tableName: string
  ): ValidatorType | undefined {
    return this.tableValidators[tableName];
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
