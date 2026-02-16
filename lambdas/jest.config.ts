/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest/jest.setup.js"],
  testRegex: ".*\\.test\\.ts$",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json", "json-summary"],
  moduleNameMapper: {
    "^@hometest-service/shared/(.*)$": "<rootDir>/../shared/$1",
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
    "/node_modules/(?!(@middy|uuid)/)", // add ESM packages here
  ],
};
