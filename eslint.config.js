import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';
import nPlugin from 'eslint-plugin-n';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'lib/**',
      'dist/**',
      '**/*.cjs',
      '**/*.js',
      '!eslint.config.js'
    ]
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      jest: jestPlugin,
      n: nPlugin
    },
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals
      }
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description'
        }
      ],
      'no-console': 'error',
      yoda: 'error',
      'prefer-const': [
        'error',
        {
          destructuring: 'all'
        }
      ],
      'no-control-regex': 'off',
      'no-constant-condition': ['error', {checkLoops: false}],
      'n/no-extraneous-import': 'error'
    }
  },
  {
    files: ['**/*{test,spec}.ts'],
    ...jestPlugin.configs['flat/recommended'],
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      '@typescript-eslint/no-unused-vars': 'off',
      'jest/no-standalone-expect': 'off',
      'jest/no-conditional-expect': 'off',
      'no-console': 'off'
    }
  },
  prettierConfig
);
