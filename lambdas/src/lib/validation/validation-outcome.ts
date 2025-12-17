import { type ErrorObject } from 'ajv';

export interface ValidationOutcome {
  isValid: boolean;
  errorMessage?: string;
  errorDetails?: ErrorObject[];
}
