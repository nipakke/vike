import { defineConfig } from "vite-plus";
import { copyFileSync, writeFileSync, renameSync, existsSync } from "fs";

const renameSafeSync = (oldPath: string, newPath: string) => {
  if (existsSync(oldPath)) {
    renameSync(oldPath, newPath);
  }
};

export default defineConfig({
  pack: {
    entry: [
      "src/+config.ts",
      "src/integration/onCreateApp.ts",
      "src/integration/headHtmlEnd.ts",
      "src/vite/index.ts",
    ],
    format: "esm",
    dts: true,
    clean: false,
    outExtensions: () => ({ js: ".js" }),
    hooks: {
      "build:done": async () => {
        copyFileSync("src/styles.css", "dist/styles.css");
        writeFileSync("dist/styles.d.ts", "declare module '@nipakke/vike-nuxt-ui/styles' {}\n");

        renameSafeSync("dist/_config.js", "dist/+config.js");
        renameSafeSync("dist/_config.d.ts", "dist/+config.d.ts");
      },
    },
  },
});
