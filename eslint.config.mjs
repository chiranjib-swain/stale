import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import jest from 'eslint-plugin-jest';
import n from 'eslint-plugin-n';

const testFiles = ['**/*.{spec,test}.ts'];

export default [
  {
    ignores: ['**/dist/**', '**/lib/**', '**/node_modules/**', '**/coverage/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.es2024,
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      n
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description'
        }
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      'n/no-extraneous-import': 'error',
      'no-console': 'error',
      'no-constant-condition': ['error', {checkLoops: false}],
      'no-control-regex': 'off',
      'prefer-const': ['error', {destructuring: 'all'}],
      yoda: 'error',
      'no-undef': 'off'
    }
  },
  {
    files: testFiles,
    plugins: {
      jest
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      '@typescript-eslint/no-unused-vars': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/no-standalone-expect': 'off',
      'no-console': 'off'
    }
  },
  eslintConfigPrettier
];
