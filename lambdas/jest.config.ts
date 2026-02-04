/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest/jest.setup.js'],
  testRegex: '.*\\.test\\.ts$',
  moduleNameMapper: {
    '^@hometest-service/shared/(.*)$': '<rootDir>/../shared/$1'
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
};
