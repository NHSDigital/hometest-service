import { getAwsClientOptions } from "./aws-client-config";

describe("getAwsClientOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AWS_ENDPOINT_URL;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns region-only config when AWS_ENDPOINT_URL is not set", () => {
    expect(getAwsClientOptions("eu-west-2")).toEqual({
      region: "eu-west-2",
    });
  });

  it("returns endpoint and credentials when AWS_ENDPOINT_URL is set", () => {
    process.env.AWS_ENDPOINT_URL = "http://localhost:4566";
    process.env.AWS_ACCESS_KEY_ID = "abc";
    process.env.AWS_SECRET_ACCESS_KEY = "xyz";

    expect(getAwsClientOptions("eu-west-2")).toEqual({
      region: "eu-west-2",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "abc",
        secretAccessKey: "xyz",
      },
    });
  });

  it("falls back to test credentials for endpoint mode", () => {
    process.env.AWS_ENDPOINT_URL = "http://localhost:4566";

    expect(getAwsClientOptions("eu-west-2")).toEqual({
      region: "eu-west-2",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    });
  });
});
