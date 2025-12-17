async function status(req, res, next) {
  res.status(200).json({
    status: 'pass',
    version: '1.0.0',
    description: 'Health of the digital health check results API'
  });
  res.end();

  next();
}

const ResultsScenario = {
  ORDER_REFERENCE_INVALID: '400InvalidOrderExternalReference',
  PARSING_BODY_FAILED: '400UnknownBodyParsingError',
  INVALID_RESULT: '400InvalidResult',
  RESULTS_ALREADY_SUBMITTED: '400ResultsAlreadySubmitted',
  RESULTS_NOT_EXPECTED: '400ResultsNotExpected',
  MISSING_BIOMARKERS: '400MissingBiomarkers',
  REQUEST_TOO_LARGE: '413RequestTooLarge',
  SERVER_ERROR: '500ServerError'
};

const ResultsResponses = {
  [ResultsScenario.ORDER_REFERENCE_INVALID]: {
    status: 400,
    code: 'INVALID_INPUT',
    message: 'The orderExternalReference is invalid'
  },
  [ResultsScenario.PARSING_BODY_FAILED]: {
    status: 400,
    code: 'INVALID_INPUT',
    message: 'Unknown error parsing request body'
  },
  [ResultsScenario.INVALID_RESULT]: {
    status: 400,
    code: 'INVALID_INPUT',
    message:
      'Invalid payload: The request body contains invalid or missing data'
  },
  [ResultsScenario.RESULTS_ALREADY_SUBMITTED]: {
    status: 400,
    code: 'INVALID_INPUT',
    message:
      'Invalid payload: The lab results for the health check have already been submitted, and the processing has already been initiated'
  },
  [ResultsScenario.RESULTS_NOT_EXPECTED]: {
    status: 400,
    code: 'INVALID_INPUT',
    message: 'Invalid payload: No lab results are expected for the health check'
  },
  [ResultsScenario.MISSING_BIOMARKERS]: {
    status: 400,
    code: 'INVALID_INPUT',
    message: 'Invalid payload: Missing expected biomarkers: GHBI'
  },
  [ResultsScenario.REQUEST_TOO_LARGE]: {
    status: 413,
    code: 'REQUEST_TOO_LARGE',
    message: 'Payload too large. Limit is 1MB.'
  },
  [ResultsScenario.SERVER_ERROR]: {
    status: 500,
    code: 'SERVER_ERROR',
    message: 'Server error.'
  }
};

async function results(req, res, next) {
  // simulate different error scenarios based on orderId
  const response = ResultsResponses[req.body.orderId];

  if (response) {
    return res.status(response.status).json({
      code: response.code,
      message: response.message
    });
  }

  // basic validation for required fields
  const requiredFields = [
    'orderId',
    'orderExternalReference',
    'pendingReorder',
    'resultData',
    'resultDate'
  ];
  const missingFields = requiredFields.filter(
    (field) => req.body[field] === null || req.body[field] === undefined
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message:
        'Invalid payload: The request body contains invalid or missing data.'
    });
  }

  res.status(200).json({
    message: 'Result received successfully'
  });

  next();
}

module.exports = {
  status: status,
  results: results
};
