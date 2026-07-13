import {createDefaultEsmPreset, type JestConfigWithTsJest} from 'ts-jest';

const preset = createDefaultEsmPreset({
  tsconfig: './tsconfig.json'
});

const config: JestConfigWithTsJest = {
  ...preset,
  clearMocks: true,
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'ts', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  verbose: true
};

export default config;
