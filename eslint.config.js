const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
        App: "readonly",
        Timeline: "readonly",
        Accessibility: "readonly",
        CSRF: "readonly",
        Quiz: "readonly",
        I18n: "readonly",
        select: "readonly",
        Chat: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "eqeqeq": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "prefer-const": "error",
      "no-var": "error",
      "curly": "error",
      "no-throw-literal": "error",
      "no-return-await": "warn",
      "require-await": "warn",
      "no-shadow": "warn",
      "no-param-reassign": "warn"
    }
  }
];
