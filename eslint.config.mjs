// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * One flat config for the whole workspace. The backend and the shared library
 * are type-checked Node code; apps/web is browser React. Anything that is a
 * genuine defect is an error; style and tidiness are warnings so that CI can
 * gate on `--max-warnings` separately from correctness.
 */
export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      '.nx/**',
      'coverage/**',
      '**/*.js',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'unused-imports': unusedImports },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // The workspace is at zero. Keep it there: `unknown` plus a narrowing
      // step is always available, and `any` disables every other rule here.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Backend + shared library: Node globals.
  {
    files: ['apps/api/**/*.ts', 'libs/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Frontend: browser globals and the React rules.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // shadcn primitives export their cva variants next to the component, and a
  // context file exports its hook next to its provider. Both are the accepted
  // shape for those files; the rule only affects how granular hot reload is.
  {
    files: [
      'apps/web/src/components/ui/**/*.tsx',
      'apps/web/src/contexts/**/*.tsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Standalone entry points run before the Nest logger exists; console is the
  // only output they have.
  {
    files: ['apps/api/src/database/migrate.ts', 'apps/api/src/main.ts'],
    rules: { 'no-console': 'off' },
  },

  // Migrations are generated: raw SQL strings and long lines are expected.
  {
    files: ['apps/api/src/database/migrations/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // Tests may reach for `any` while building fixtures.
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
