// eslint.config.js
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // Configuração base recomendada do ESLint
  js.configs.recommended,

  // Configurações customizadas
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Globals do Node.js
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",

        // Globals do Jest (se usar testes)
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        it: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },

    plugins: {
      prettier: prettierPlugin,
    },

    rules: {
      // Prettier como regra do ESLint
      "prettier/prettier": "error",

      // Regras de qualidade de código
      "no-console": "warn",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-debugger": "error",

      // Estilo de código
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",
      "no-duplicate-imports": "error",
    },
  },

  // Desabilitar regras do ESLint que conflitam com Prettier
  prettierConfig,

  // Ignorar arquivos
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "*.config.js",
      ".env*",
    ],
  },
];
