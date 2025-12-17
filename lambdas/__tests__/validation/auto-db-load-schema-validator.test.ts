import {
  AutoDbLoadSchemaValidationService,
  ValidatorType
} from '../../src/lib/validation/auto-db-load-schema-validator';
import { Commons } from '../../src/lib/commons';

describe('AutoDbLoadSchemaValidationService', () => {
  const commons = new Commons('test', 'test');
  const service = new AutoDbLoadSchemaValidationService(commons);

  const validObject = {
    gpOdsCode: 'A12345',
    gpEmail: 'test@example.com',
    gpName: 'Test Practice',
    localAuthority: 'Test Authority',
    validFrom: '2023-01-01'
  };

  it('When all fields are valid then validation passes', () => {
    const result = service.validateObject(validObject, ValidatorType.GpOdsCode);
    expect(result.isValid).toBe(true);
  });

  it('Sets "enabled" to false automatically', () => {
    const objectToValidate = {};
    service.validateObject(objectToValidate, ValidatorType.GpOdsCode);
    expect((objectToValidate as any).enabled).toBe(false);
  });

  it.each([
    ['missing gpOdsCode', { ...validObject, gpOdsCode: undefined }],
    ['empty gpOdsCode', { ...validObject, gpOdsCode: '' }],
    ['missing gpEmail', { ...validObject, gpEmail: undefined }],
    ['empty gpEmail', { ...validObject, gpEmail: '' }],
    ['missing gpName', { ...validObject, gpName: undefined }],
    ['empty gpName', { ...validObject, gpName: '' }],
    ['missing localAuthority', { ...validObject, localAuthority: undefined }],
    ['empty localAuthority', { ...validObject, localAuthority: '' }],
    ['missing validFrom', { ...validObject, validFrom: undefined }],
    ['empty validFrom', { ...validObject, validFrom: '' }],
    ['invalid validFrom format', { ...validObject, validFrom: 'not-a-date' }],
    ['enabled true (should be false)', { ...validObject, enabled: true }],
    ['additional property', { ...validObject, extra: 'not allowed' }]
  ])('When %s then validation fails', (_desc, obj) => {
    const result = service.validateObject(obj, ValidatorType.GpOdsCode);
    expect(result.isValid).toBe(false);
  });

  it('When required fields are missing then validation fails', () => {
    const result = service.validateObject({}, ValidatorType.GpOdsCode);
    expect(result.isValid).toBe(false);
  });
});
