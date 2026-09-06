import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'dist-playground/**',
      'coverage/**',
      'smoke-test/**',
      'temp-pack/**',
      '*.config.*',
      'take_screenshot.mjs',
      'scripts/**',
      'liquid-glass-react/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
      },
    },
  },
  // Architecture Enforcement: types cannot import business layers
  {
    files: ['src/types/**/*.{ts,d.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'vue', message: 'Violation: Types layer cannot import Vue.' }],
          patterns: [
            {
              group: ['**/utils/**', '**/constants/**', '**/engine/**', '**/core/**', '**/vue/**'],
              message: 'Violation: Types layer cannot import higher business layers.',
            },
          ],
        },
      ],
    },
  },
  // Architecture Enforcement: utils cannot import constants, engine, core, or vue
  {
    files: ['src/utils/**/*.{ts,d.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'vue', message: 'Violation: Utils layer cannot import Vue.' }],
          patterns: [
            {
              group: ['**/constants/**', '**/engine/**', '**/core/**', '**/vue/**'],
              message: 'Violation: Utils layer cannot import higher business layers.',
            },
          ],
        },
      ],
    },
  },
  // Architecture Enforcement: constants cannot import engine, core, or vue
  {
    files: ['src/constants/**/*.{ts,d.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'vue', message: 'Violation: Constants layer cannot import Vue.' }],
          patterns: [
            {
              group: ['**/engine/**', '**/core/**', '**/vue/**'],
              message: 'Violation: Constants layer cannot import higher business layers.',
            },
          ],
        },
      ],
    },
  },
  // Architecture Enforcement: engine cannot import core or vue
  {
    files: ['src/engine/**/*.{ts,d.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              message:
                'Violation: Engine layer must remain 100% framework-agnostic. Do NOT import Vue.',
            },
          ],
          patterns: [
            {
              group: ['**/core/**', '**/vue/**'],
              message: 'Violation: Engine layer cannot import Core facade or Vue adapter.',
            },
          ],
        },
      ],
    },
  },
  // Architecture Enforcement: core facade cannot import vue
  {
    files: ['src/core/**/*.{ts,d.ts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              message: 'Violation: Core facade must remain framework-agnostic. Do NOT import Vue.',
            },
          ],
          patterns: [
            { group: ['**/vue/**'], message: 'Violation: Core facade cannot import Vue adapter.' },
          ],
        },
      ],
    },
  }
);
