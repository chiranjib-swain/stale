module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!node-fetch|@actions|@octokit)' // Add node-fetch here
  ],
  setupFiles: ['<rootDir>/__tests__/setup-tests.ts'], // Add this line
  verbose: true,
  testTimeout: 20000, // 20 seconds timeout for each test
};
