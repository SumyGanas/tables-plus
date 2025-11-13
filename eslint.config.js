// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    {
    ignores: ["**/temp.js", 
        "config/*", 
        "node_modules/",
        "main.js",
        "components/*",
        "lib/*",
        ".*/*",
        "*.json",
        ".config.*"]
  },
    {
        rules: {
                "@typescript-eslint/no-unused-vars": [
                    "error",
                    {
                    "argsIgnorePattern": "^_|^state$|^ctx$",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_"
                    }
                ]
        }
    },
    
);

