import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['']
  },
  setupFiles: [
    '<rootDir>/jest/jest.setup.js',
    '<rootDir>/jest/jest.polyfills.js'
  ],
  moduleNameMapper: {
    '^@dnhc-health-checks/shared/(.*)$': '<rootDir>/../shared/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^uuid$': 'uuid'
  },
  setupFilesAfterEnv: ['<rootDir>/jest/setupTests.ts'],
  collectCoverage: false
};

export default config;
