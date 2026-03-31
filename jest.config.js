// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const { createSourcePath, createSourceFilterConfig } = require('./scripts/utils/coverage');
const baseConfig = require('./.config/jest.config');
const { nodeModulesToTransform, grafanaESModules } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...baseConfig,

  // Silence console output during tests
  silent: true,

  // Override transformIgnorePatterns to include ts-graphviz
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, 'ts-graphviz', '@ts-graphviz'])],

  // Enable coverage with V8 provider for monocart reports
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageReporters: ['none'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/types.ts',
  ],

  // Custom reporters
  reporters: [
    'default',
    [
      'jest-monocart-coverage',
      {
        name: 'Coverage Report - Graphviz panel Jest unit tests',
        outputDir: './coverage/unit',
        reports: [['v8'], ['console-summary'], ['lcov'], ['json'], ['raw']],
        all: './src',
        sourceFilter: createSourceFilterConfig({
          excludeTypes: true,
          packageName: 'grafana-graphviz-panel',
          includeTypescriptOnly: false,
        }),
        sourcePath: createSourcePath({ packageName: 'grafana-graphviz-panel' }),
      },
    ],
  ],
};
