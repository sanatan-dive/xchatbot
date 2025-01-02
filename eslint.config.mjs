import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Disable the rule
      "@typescript-eslint/no-unused-vars": "warn", // Set unused vars to warning
      "next/next/no-img-element": "off", // Allow the use of <img>
    },
  },
];

export default eslintConfig;
