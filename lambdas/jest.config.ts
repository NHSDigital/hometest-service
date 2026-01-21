/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest/jest.setup.js'],
  testRegex: '.*\\.test\\.ts$',
  moduleNameMapper: {
    '^@hometest-service/shared/(.*)$': '<rootDir>/../shared/$1'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'
  },
  extensionsToTreatAsEsm: ['.ts']
};
