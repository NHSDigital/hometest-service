import { APIGatewayProxyEvent } from 'aws-lambda';
import { OrderStatus, ResultStatus } from '../lib/types/status';
const { extractAndValidateObservationFields, extractInterpretationCodeFromFHIRObservation, validateDBData } = require('./validation');
const { createFhirErrorResponse, createFhirResponse } = require('../lib/fhir-response');

const initSingleton = {
  commons: {
    logInfo: jest.fn(),
    logError: jest.fn(),
  },
  orderService: {
    retrieveOrderDetails: jest.fn(),
    updateOrderStatusAndResultStatus: jest.fn(),
    updateResultStatus: jest.fn(),
  },
}

jest.mock('./init', () => ({
  init: () => initSingleton,
}));

jest.mock('./validation', () => ({
  extractAndValidateObservationFields: jest.fn(),
  extractInterpretationCodeFromFHIRObservation: jest.fn(),
  validateDBData: jest.fn(),
}));

jest.mock('../lib/fhir-response', () => ({
  createFhirErrorResponse: jest.fn((code, type, message, severity) => ({
    statusCode: code,
    body: JSON.stringify({
      issue: [
        {
          code: type,
          diagnostics: message,
          severity,
        },
      ],
    }),
  })),
  createFhirResponse: jest.fn((code, resource) => ({
    statusCode: code,
    body: JSON.stringify(resource),
  })),
  ErrorStatusCode: {
    BadRequest: 400,
    NotFound: 404,
    Internal: 500,
  },
}));

const { handler, InterpretationCode } = require('./index');
const { orderService } = require('./init').init();

describe('order-result-lambda handler', () => {
  const identifiers = {
    orderUid: 'order-uid-1',
    patientId: 'patient-1',
    supplierId: 'supplier-1',
    correlationId: 'corr-1',
  };
  const observation = { resourceType: 'Observation', status: 'final' };
  const event: Partial<APIGatewayProxyEvent> = {
    path: '/result',
    httpMethod: 'POST',
    body: JSON.stringify(observation),
    headers: {},
  };
  const testOrderResult = { order_reference: 'order-ref-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    extractAndValidateObservationFields.mockReturnValue({
      validationResult: { isValid: true },
      observation,
      identifiers,
    });
    orderService.retrieveOrderDetails.mockResolvedValue(testOrderResult);
    validateDBData.mockResolvedValue({ isValid: true, isIdempotent: false });
    extractInterpretationCodeFromFHIRObservation.mockReturnValue(InterpretationCode.Normal);
    orderService.updateOrderStatusAndResultStatus.mockResolvedValue(undefined);
    orderService.updateResultStatus.mockResolvedValue(undefined);
  });

  it('returns 201 and resource on success', async () => {
    const res = await handler(event as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(201);
    expect(createFhirResponse).toHaveBeenCalledWith(201, observation);
  });

  it('returns error if validation fails', async () => {
    extractAndValidateObservationFields.mockReturnValueOnce({
      validationResult: { isValid: false, errorCode: 400, errorType: 'invalid', errorMessage: 'fail', severity: 'error' },
    });
    const res = await handler(event as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(400);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(400, 'invalid', 'fail', 'error');
  });

  it('returns 404 if order not found', async () => {
    orderService.retrieveOrderDetails.mockResolvedValueOnce(null);
    const res = await handler(event as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(404);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(404, 'not-found', expect.stringContaining('No order found'), 'error');
  });

  it('returns error if db validation fails', async () => {
    validateDBData.mockResolvedValueOnce({ isValid: false, errorCode: 400, errorType: 'invalid', errorMessage: 'db fail', severity: 'error' });
    const res = await handler(event as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(400);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(400, 'invalid', 'db fail', 'error');
  });

  it('returns 201 if idempotent', async () => {
    validateDBData.mockResolvedValueOnce({ isValid: true, isIdempotent: true });
    const res = await handler(event as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(201);
    expect(createFhirResponse).toHaveBeenCalledWith(201, observation);
  });

  it('calls updateOrderStatusAndResultStatus for interpretation code normal with order status complete and result available', async () => {
    extractInterpretationCodeFromFHIRObservation.mockReturnValueOnce(InterpretationCode.Normal);
    await handler(event as APIGatewayProxyEvent);
    expect(orderService.updateOrderStatusAndResultStatus).toHaveBeenCalledWith(
      identifiers.orderUid,
      testOrderResult.order_reference,
      OrderStatus.Complete,
      ResultStatus.Result_Available,
      identifiers.correlationId
    );
  });

  it('calls updateResultStatus for interpretation code abnormal with result withheld', async () => {
    extractInterpretationCodeFromFHIRObservation.mockReturnValueOnce(InterpretationCode.Abnormal);
    await handler(event as APIGatewayProxyEvent);
    expect(orderService.updateResultStatus).toHaveBeenCalledWith(
      identifiers.orderUid,
      ResultStatus.Result_Withheld,
      identifiers.correlationId
    );
  });

  it('returns 500 if updateDatabase throws', async () => {
    orderService.updateOrderStatusAndResultStatus.mockRejectedValueOnce(new Error('fail'));
    const res = await handler(event as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(500);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(500, 'exception', 'An internal error occurred', 'fatal');
  });
});
