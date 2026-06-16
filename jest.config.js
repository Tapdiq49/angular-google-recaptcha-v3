/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/projects/angular-google-recaptcha-v3'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: true,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  moduleNameMapper: {
    '^angular-google-recaptcha-v3$': '<rootDir>/projects/angular-google-recaptcha-v3/src/public-api.ts',
    '^angular-google-recaptcha-v3/(.*)$': '<rootDir>/projects/angular-google-recaptcha-v3/$1/src/public-api.ts',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: ['node_modules/(?!@angular|rxjs)'],
};
