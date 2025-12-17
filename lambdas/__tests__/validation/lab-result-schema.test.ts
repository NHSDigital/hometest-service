import {
  SchemaValidationService,
  ValidatorType
} from '../../src/lib/validation/schema-validator';
import { Commons } from '../../src/lib/commons';

describe('labResultSchema', () => {
  const commons = new Commons('test', 'test');
  const schemaValidationService = new SchemaValidationService(commons);

  const orderId = '123';
  const orderExternalReference = 'abc';
  const resultDate = '2020-07-23T08:30:00.000Z';

  const validate = (input: any): boolean => {
    const result = schemaValidationService.validateObject(
      input,
      ValidatorType.LabResult
    );
    if (!result.isValid) {
      console.log(result.errorDetails);
    }
    return result.isValid;
  };

  it('validates if schema is backward compatible with API version 0.5.4 (without Partial results)', () => {
    const input = {
      orderId,
      orderExternalReference,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: 25
        },
        {
          biomarkerCode: 'CHO',
          units: 'mmol/L',
          value: 6.3
        },
        {
          biomarkerCode: 'HDL',
          units: 'mmol/L',
          value: 1.5
        },
        {
          biomarkerCode: 'CHDD',
          units: 'mmol/L',
          value: 5
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(true);
  });

  it('validates if default values are set if not provided', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: undefined,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: 25,
          successful: undefined
        },
        {
          biomarkerCode: 'CHO',
          units: 'mmol/L',
          value: 6.3,
          successful: undefined
        },
        {
          biomarkerCode: 'HDL',
          units: 'mmol/L',
          value: 1.5,
          successful: undefined
        },
        {
          biomarkerCode: 'CHDD',
          units: 'mmol/L',
          value: 5,
          successful: undefined
        }
      ],
      resultDate
    };
    const result = schemaValidationService.validateObject(
      input,
      ValidatorType.LabResult
    );
    if (!result.isValid) {
      console.log(result.errorDetails);
    }
    expect(validate(input)).toBe(true);
    expect(input.pendingReorder).toBe(false);
    expect(input.resultData.every((result) => result.successful)).toBe(true);
  });

  it('validates a correct lab result', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: null,
          successful: false,
          failureReasonCode: 'not_calculated',
          failureReasonDescription: 'The result was not calculated'
        },
        {
          biomarkerCode: 'CHO',
          units: 'mmol/L',
          value: 6.3,
          successful: true
        },
        {
          biomarkerCode: 'HDL',
          units: 'mmol/L',
          value: 1.5,
          successful: true
        },
        {
          biomarkerCode: 'CHDD',
          units: 'mmol/L',
          value: 5,
          successful: true
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(true);
  });

  it('validates when successful is true and value and units are provided', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: 25,
          successful: true
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(true);
  });

  it('validates when successful is false, failureReasonCode and failureReasonDescription are provided, and value is missing', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          successful: false,
          failureReasonCode: 'some_failure_reason_code',
          failureReasonDescription: 'some_failure_reason_description'
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(true);
  });

  it('validates when successful is false, failureReasonCode and failureReasonDescription are provided, and value is null', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          successful: false,
          value: null,
          failureReasonCode: 'some_failure_reason_code',
          failureReasonDescription: 'some_failure_reason_description'
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(true);
  });

  it('fails when required fields are missing', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when successful is true but failureReasonCode is provided', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: 25,
          successful: true,
          failureReasonCode: 'some_failure_reason_code'
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when successful is true but failureReasonDescription is provided', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: 25,
          successful: true,
          failureReasonDescription: 'some_failure_reason_description'
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when successful is true but value and units are missing', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          successful: true
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when successful is true but value is null', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          units: 'mmol/L',
          value: null,
          successful: true
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when successful is false but failureReasonCode and failureReasonDescription are missing', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          successful: false
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when successful is false and value is provided', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          successful: false,
          value: 5.6,
          failureReasonCode: 'some_failure_reason_code',
          failureReasonDescription: 'some_failure_reason_description'
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when additional properties are present in labResultSchema', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          value: 5.6,
          units: 'mmol/L',
          successful: true
        }
      ],
      resultDate,
      extraProperty: 'not allowed'
    };
    expect(validate(input)).toBe(false);
  });

  it('fails when additional properties are present in resultDataSchema', () => {
    const input = {
      orderId,
      orderExternalReference,
      pendingReorder: false,
      resultData: [
        {
          biomarkerCode: 'GHBI',
          value: 5.6,
          units: 'mmol/L',
          successful: true,
          extraProperty: 'not allowed'
        }
      ],
      resultDate
    };
    expect(validate(input)).toBe(false);
  });
});
