import baseConfig from "@juicebox/config/eslint";
import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: [".next/"],
  },
];
