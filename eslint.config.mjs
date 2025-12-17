import love from 'eslint-config-love';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';
// Added plugin imports for UI linting
import pluginReact from 'eslint-plugin-react';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginJest from 'eslint-plugin-jest';
import pluginJestDom from 'eslint-plugin-jest-dom';
import pluginTestingLibrary from 'eslint-plugin-testing-library';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import pluginPlaywright from 'eslint-plugin-playwright';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      'node_modules/',
      '**/node_modules/',
      '**/cdk.out',
      'scripts/saved-queries/**/*.js',
      'scripts/saved-queries/**/*.mjs',
      'dist/',
      'coverage/',
      '*.d.ts',
      '**/*.d.ts',
      'ui/build/',
      'ui/public/',
      'ui/coverage/',
      'ui/jest/**/*.js',
      '**/jest.config.ts',
      '**/jest',
      'tests/build/',
      'tests/public/',
      'tests/coverage/',
      'tests/eslint.config.js'
    ]
  },
  // Base configurations from eslint-config-love
  // This should set up parsers (like @typescript-eslint/parser) and plugins
  // (like @typescript-eslint/eslint-plugin, eslint-plugin-import) for relevant file types.

  // Custom configuration for TypeScript-specific rules
  {
    files: ['**/*.ts', '**/*.tsx'], // Apply these rules only to TypeScript files
    ...love,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      // Ensure @typescript-eslint plugin is explicitly available for this block
      '@typescript-eslint': tseslintPlugin
    },
    rules: {
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableString: true,
          allowNullableBoolean: true,
          allowNullableNumber: true,
          allowAny: true
        }
      ],
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports'
        }
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/no-dupe-class-members': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  },

  // Custom configuration for other general rules
  // These rules will apply to all files matched by preceding configurations
  // (e.g., .js, .jsx, .ts, .tsx as configured by eslint-config-love)
  // that are not ignored.
  {
    // This block does not specify 'files', so its rules apply broadly.
    // It relies on plugins like 'eslint-plugin-import' being configured by loveConfigArray.
    plugins: {
      // Add this plugins section
      import: importPlugin
    },
    rules: {
      'max-params': ['error', 5],
      'no-duplicate-imports': 'error', // Core ESLint rule
      'import/no-duplicates': 'error' // Relies on eslint-plugin-import
    }
  },
  // UI React source files
  {
    files: ['ui/src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      react: pluginReact,
      'jsx-a11y': pluginJsxA11y,
      import: importPlugin
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { project: './ui/tsconfig.json' }
      }
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs['jsx-runtime'].rules,
      ...pluginJsxA11y.configs.recommended.rules,
      'react/prop-types': 'off',
      'import/no-duplicates': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/adjacent-overload-signatures': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off'
    }
  },
  // UI test files
  {
    files: ['ui/src/**/*.test.{ts,tsx}', 'ui/src/test/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      jest: pluginJest,
      'jest-dom': pluginJestDom,
      'testing-library': pluginTestingLibrary
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    },
    settings: {
      // Explicit to bypass auto-detection errors
      jest: { version: 29 }
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      ...pluginJestDom.configs.recommended.rules,
      ...pluginTestingLibrary.configs.react.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-floating-promises': 'off'
    }
  },
  // Tests rules
  {
    files: ['tests/**/*.{ts}'],
    plugins: {
      playwright: pluginPlaywright
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...pluginPlaywright.configs['flat/recommended'].languageOptions?.globals
      }
    },
    rules: {
      ...pluginPlaywright.configs['flat/recommended'].rules,
      'playwright/no-skipped-test': 'warn'
    }
  },
  eslintConfigPrettier
];
