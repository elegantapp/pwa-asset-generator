import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';

export default [
  // Base ESLint recommended rules for all files
  js.configs.recommended,

  // JavaScript specific rules
  {
    files: ['**/*.js'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Error prevention
      'no-console': 'off', // Allow console in Node.js applications
      'no-debugger': 'error',

      // Style
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__filename', '__dirname'],
        },
      ],

      // Other
      'no-prototype-builtins': 'off',
      'global-require': 'off',
    },
  },

  // Special rules for bin scripts
  {
    files: ['bin/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    linterOptions: {
      noInlineConfig: false,
    },
    rules: {
      'n/hashbang': 'off', // Allow shebang in bin scripts
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],
    },
  },

  // Node.js specific rules for JavaScript files
  {
    files: ['**/*.js'],
    plugins: {
      n: nodePlugin,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...nodePlugin.configs.recommended.rules,
      // Allow process.exit in CLI tools
      'n/no-process-exit': 'off',
      // Enforce file extensions in JavaScript imports
      'n/file-extension-in-import': ['error', 'always'],
      // Disable some Node.js rules
      'n/no-unpublished-import': 'off',
      // Warn for deprecated APIs instead of erroring
      'n/no-deprecated-api': 'warn',
    },
  },

  // TypeScript-specific rules for source files
  {
    files: ['**/*.ts'],
    ignores: ['**/*.test.ts', 'vitest.config.ts', 'vitest.setup.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        NodeModule: 'readonly',
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Allow unused vars for destructuring and catch errors
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],
      // Enforce explicit function return types
      '@typescript-eslint/explicit-function-return-type': [
        'off',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
    },
  },

  // TypeScript-specific rules for test files
  {
    files: ['**/*.test.ts', 'vitest.config.ts', 'vitest.setup.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.browser,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Node.js specific rules for TypeScript files
  {
    files: ['**/*.ts'],
    plugins: {
      n: nodePlugin,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...nodePlugin.configs.recommended.rules,
      // Disable rules that conflict with TypeScript
      'n/no-missing-import': 'off',
      'n/no-missing-require': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      // Don't require extensions in TypeScript imports
      'n/file-extension-in-import': 'off',
      // Disable some Node.js rules for test files
      'n/no-unpublished-import': 'off',
      // Allow @puppeteer/browsers as it's a dependency
      'n/no-extraneous-import': [
        'error',
        {
          allowModules: ['@puppeteer/browsers', 'pngjs'],
        },
      ],
      // Warn for deprecated APIs instead of erroring
      'n/no-deprecated-api': 'warn',
    },
  },

  // Common rules for TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Error prevention
      'no-console': 'off', // Allow console in Node.js applications
      'no-debugger': 'error',

      // Style
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__filename', '__dirname'],
        },
      ],

      // Other
      'no-prototype-builtins': 'off',
      'global-require': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
