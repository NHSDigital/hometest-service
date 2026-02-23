import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaHandler } from "./index";
import { validatePostcodeFormat } from "./postcode-validator";

jest.mock("./init", () => {
  const mockLookupByPostcode = jest.fn();
  const mockLogError = jest.fn();

  return {
    init: () => ({
      laLookupService: { lookupByPostcode: mockLookupByPostcode },
      commons: { logError: mockLogError },
    }),
    __mocks: { mockLookupByPostcode, mockLogError },
  };
});

jest.mock("./postcode-validator", () => ({
  validatePostcodeFormat: jest.fn(),
}));


const { mockLookupByPostcode, mockLogError } = require("./init").__mocks;
const buildEvent = (postcode: string | null): APIGatewayProxyEvent =>
  ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path: "/eligibility",
    queryStringParameters: postcode ? { postcode } : null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: "/eligibility",
  }) as APIGatewayProxyEvent;

describe("eligibility-lookup-lambda lambdaHandler", () => {
  const context = { callbackWaitsForEmptyEventLoop: true } as unknown as Context;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if postcode is missing", async () => {
    const event = buildEvent(null);
    const result = await lambdaHandler(event, context);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ error: "Postcode parameter is required" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(String),
      "Postcode parameter is required"
    );
  });

  it("returns 400 if postcode format is invalid", async () => {
    (validatePostcodeFormat as jest.Mock).mockReturnValue({ valid: false });
    const event = buildEvent("bad");
    const result = await lambdaHandler(event, context);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ error: "Invalid postcode format" });
  });

  it("returns 404 if no local authority found", async () => {
    (validatePostcodeFormat as jest.Mock).mockReturnValue({ valid: true, cleaned: "AB1 2CD" });
    mockLookupByPostcode.mockResolvedValueOnce(null);
    const event = buildEvent("AB12CD");
    const result = await lambdaHandler(event, context);
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ error: "No local authority found for AB1 2CD" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(String),
      "No local authority found for AB1 2CD"
    );
  });

  it("returns 200 and local authority if found", async () => {
    (validatePostcodeFormat as jest.Mock).mockReturnValue({ valid: true, cleaned: "AB1 2CD" });
    const la = { localAuthorityCode: "E123", region: "TestRegion" };
    mockLookupByPostcode.mockResolvedValueOnce(la);
    const event = buildEvent("AB12CD");
    const result = await lambdaHandler(event, context);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(la);
  });

  it("returns 500 and logs error on exception", async () => {
    (validatePostcodeFormat as jest.Mock).mockReturnValue({ valid: true, cleaned: "AB1 2CD" });
    mockLookupByPostcode.mockRejectedValueOnce(new Error("fail"));
    const event = buildEvent("AB12CD");
    const result = await lambdaHandler(event, context);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ error: "An internal error occurred" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(String),
      "Internal error",
      expect.any(Error)
    );
  });
});
