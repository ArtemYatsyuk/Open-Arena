// Flat ESLint config (ESLint 9+).
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.d.ts',
      'backend/prisma/migrations/**',
    ],
  },

  // Base JS recommended (applies to everything not specifically overridden).
  {
    ...js.configs.recommended,
    // no-undef is redundant in TS strict mode (tsc catches it better) and
    // causes false positives for TS types like RequestInit.
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // TypeScript.
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      // Prefer TS checks over base ESLint's for these.
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
    },
  },

  // React (frontend only).
  {
    files: ['frontend/**/*.{ts,tsx,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: '19.0' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 19 JSX transform — no need for `import React`.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      // TS + Zod handles these better.
      'react/no-unescaped-entities': 'warn',
    },
  },

  // Backend overrides.
  {
    files: ['backend/**/*.{ts,js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Always last: disable rules that conflict with Prettier.
  prettier,
];
