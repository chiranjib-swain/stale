// eslint.config.js
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jestPlugin from "eslint-plugin-jest";
import nodePlugin from "eslint-plugin-node";

export default [
  {
    ignores: [
      "**/*",           // equivalent to /* — ignore everything by default
      "!src/**",        // do NOT ignore src/
      "!__tests__/**"   // do NOT ignore __tests__/
    ], // replaces .eslintignore
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      node: nodePlugin,
      jest: jestPlugin,
    },
    rules: {
      // JS recommended
      ...js.configs.recommended.rules,

      // TS recommended
      ...tseslint.configs.recommended.rules,

      // Jest recommended
      ...jestPlugin.configs.recommended.rules,

      // Custom rules
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
        },
      ],
      "no-console": "error",
      yoda: "error",
      "prefer-const": [
        "error",
        {
          destructuring: "all",
        },
      ],
      "no-control-regex": "off",
      "no-constant-condition": ["error", { checkLoops: false }],
      "node/no-extraneous-import": "error",

      // ✅ allow unused vars if prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*{test,spec}.ts","**/setup-tests.ts"],
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals, // 👈 inject Jest globals
        jest:true,
      },
    },
    rules: {
      "jest/no-standalone-expect": "off",
      "jest/no-conditional-expect": "off",
      "no-console": "off",
    },
  },
];
