/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/projects/angular-google-recaptcha-v3'],
  // Initialize Angular's TestBed environment after Jest is ready.
  // setupFilesAfterEnv runs after the test framework is installed —
  // this is the correct hook for TestBed.initTestEnvironment().
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx|mts)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: true,
      diagnostics: false,
    }],
    '^.+\\.mjs$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: true,
      diagnostics: false,
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'mts', 'js', 'jsx', 'mjs', 'json', 'node'],
  moduleNameMapper: {
    '^angular-google-recaptcha-v3$': '<rootDir>/projects/angular-google-recaptcha-v3/src/public-api.ts',
    '^angular-google-recaptcha-v3/(.*)$': '<rootDir>/projects/angular-google-recaptcha-v3/$1/src/public-api.ts',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  // Transform all @angular/* and rxjs packages — they ship as ESM .mjs files
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|rxjs)/)',
  ],
};
