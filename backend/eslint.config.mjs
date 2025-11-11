import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  {
    ignores: ["node_modules/**", "prisma/migrations/**", "dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
  prettierConfig,
]);

export default eslintConfig;
