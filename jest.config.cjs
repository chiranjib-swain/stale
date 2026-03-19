module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': ['ts-jest', {tsconfig: 'tsconfig.spec.json'}],
    '^.+\\.js$': [
      'ts-jest',
      {tsconfig: 'tsconfig.spec.json', diagnostics: false}
    ]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|universal-user-agent|before-after-hook)/)'
  ],
  verbose: true
};
