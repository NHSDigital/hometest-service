/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest/jest.setup.js'],
  testRegex: '.*\\.test\\.ts$',
  moduleNameMapper: {
    '^@dnhc-health-checks/shared/(.*)$': '<rootDir>/../shared/$1'
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!digital-health-checks-fhir-translator/)'
  ],
  extensionsToTreatAsEsm: ['.ts']
};
