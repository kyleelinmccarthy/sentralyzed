import tseslint from 'typescript-eslint'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/.turbo/**'],
  },
]
