module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/protocol'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    'tests/**/*.ts',
    '<rootDir>/tests/**/*.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'protocol/**/*.ts',
    '!protocol/**/*.d.ts',
    '!protocol/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/protocol/$1',
    '^@/specs/(.*)$': '<rootDir>/specs/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/examples/(.*)$': '<rootDir>/examples/$1'
  },
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: '50%'
};
