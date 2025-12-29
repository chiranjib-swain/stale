module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
    // whitelist octokit (and @actions if needed) for transformation
    transformIgnorePatterns: [
      '/node_modules/(?!(@octokit|@actions|universal-user-agent|before-after-hook|unenv|before-after-hook|is-plain-object)/)'
    ]
,    
  verbose: true
};