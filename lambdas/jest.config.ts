import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest/jest.setup.js"],
  testRegex: String.raw`.*\.test\.ts$`,
  testPathIgnorePatterns: ["/node_modules/"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json", "json-summary"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "test-results",
        outputName: "junit.xml",
        addFileAttribute: true,
        reportTestSuiteErrors: true,
      },
    ],
  ],
  moduleNameMapper: {
    "^@hometest-service/shared/(.*)$": "<rootDir>/../shared/$1",
    "^@middy/core$": "<rootDir>/node_modules/@middy/core/index.js",
    "^@middy/http-cors$": "<rootDir>/node_modules/@middy/http-cors/index.js",
    "^@middy/http-error-handler$": "<rootDir>/node_modules/@middy/http-error-handler/index.js",
    "^@middy/http-security-headers$":
      "<rootDir>/node_modules/@middy/http-security-headers/index.js",
    "^@middy/util$": "<rootDir>/node_modules/@middy/util/index.js",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: { module: "CommonJS" },
      },
    ],
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
  transformIgnorePatterns: [
    String.raw`/node_modules/(?!(\.pnpm/)?(@middy|uuid|@aws-sdk))`, // add ESM packages here
  ],
};
export default config;
