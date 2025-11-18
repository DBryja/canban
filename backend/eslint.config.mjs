import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import tseslintParser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
  {
    ignores: ["node_modules/**", "prisma/migrations/**", "dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "warn",
    },
  },
  prettierConfig,
]);

export default eslintConfig;
