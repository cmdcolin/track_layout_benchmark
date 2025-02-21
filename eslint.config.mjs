import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'webpack.config.js',
      'dist/*',
      'esm/*',
      'example/*',
      'eslint.config.mjs',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.strictTypeChecked,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'no-underscore-dangle': 0,
      curly: 'error',
    },
  },
)
