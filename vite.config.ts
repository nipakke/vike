import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    printWidth: 110,
    tabWidth: 2,
    useTabs: false,
    endOfLine: "lf",
    insertFinalNewline: false,
    singleQuote: false,
    trailingComma: "all",
    experimentalSortPackageJson: true,
    experimentalSortImports: {
      groups: [["builtin", "external"], "internal", "parent", ["sibling", "index"]],
      sortExports: true
    },
    experimentalTailwindcss: {},
    ignorePatterns: [
      "**/.nuxt/",
      "**/.output/",
      "**/node_modules/",
      "**/dist/",
      "**/coverage/",
      "**/*.d.ts",
      "**/*.config.*",
      "**/docs/",
      "/config/",
      "**/package.json",
      "**/CHANGELOG.md",
      "**/.vscode/",
      "**/fixtures/**",
      "**/playgrounds/**"
    ]
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ["**/playgrounds/**"],
    rules: {
      "eslint/no-console": "off",
      "eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_"
        }
      ]
    }
  },
});
