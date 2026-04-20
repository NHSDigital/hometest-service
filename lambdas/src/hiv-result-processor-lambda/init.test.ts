import { ConsoleCommons } from "../lib/commons";
import { buildEnvironment as init } from "./init";
import { ResultStatusLambdaService } from "./result-status-lambda-service";

jest.mock("../lib/commons");
jest.mock("./result-status-lambda-service");

describe("hiv-results-processor init", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    process.env.AWS_REGION = "eu-west-2";
    process.env.RESULT_STATUS_LAMBDA_NAME = "status-lambda";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("initializes commons and resultStatusLambdaService", () => {
    const env = init();

    expect(env.commons).toBeInstanceOf(ConsoleCommons);
    expect(env.resultStatusLambdaService).toBeInstanceOf(ResultStatusLambdaService);
  });

  it("passes AWS_REGION and RESULT_STATUS_LAMBDA_NAME to ResultStatusLambdaService", () => {
    init();

    expect(ResultStatusLambdaService).toHaveBeenCalledWith("status-lambda", "eu-west-2");
  });

  it("throws if AWS_REGION is missing", () => {
    delete process.env.AWS_REGION;

    expect(() => init()).toThrow("Missing value for an environment variable AWS_REGION");
  });

  it("throws if RESULT_STATUS_LAMBDA_NAME is missing", () => {
    delete process.env.RESULT_STATUS_LAMBDA_NAME;

    expect(() => init()).toThrow(
      "Missing value for an environment variable RESULT_STATUS_LAMBDA_NAME",
    );
  });

  it("returns the same instance on repeated calls (singleton)", () => {
    jest.isolateModules(() => {
      const { init: isolatedInit } = require("./init");

      const env1 = isolatedInit();
      const env2 = isolatedInit();

      expect(env1).toBe(env2);
      expect(ResultStatusLambdaService).toHaveBeenCalledTimes(1);
    });
  });

  it("allows retry if buildEnvironment throws the first time", () => {
    jest.isolateModules(() => {
      jest.clearAllMocks();

      // First call: throw
      (ResultStatusLambdaService as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Boom");
      });

      const { init: isolatedInit } = require("./init");

      expect(() => isolatedInit()).toThrow("Boom");

      // Second call: should succeed
      const env = isolatedInit();
      expect(env).toBeTruthy();
    });
  });
});
