import { defineConfig } from "vite-plus";
import { renameSync, existsSync } from "fs";


const renameSafeSync = (oldPath: string, newPath: string) => {
  if (existsSync(oldPath)) {
    renameSync(oldPath, newPath);
  }
};
const isDev = process.env.NODE_ENV === 'development'

console.log(isDev)
export default defineConfig({
  pack: {
    entry: {
      'vike': 'src/vike/index.ts',
      'vite': 'src/vite/index.ts',
      'runner': 'src/vike/runner.ts',
      '_config': 'src/vike/+config.ts',
    },
    format: "esm",
    dts: true,
    clean: false,
    sourcemap: true,
    tsconfig: "tsconfig.build.json",
    outExtensions: () => ({ js: ".js" }),
    deps: {
      neverBundle: ['vike', '@nipakke/vike-plugins/vike', 'virtual:vike-plugins']
    },
    hooks: {
      "build:done": async () => {
        renameSafeSync("dist/_config.js", "dist/+config.js");
        renameSafeSync("dist/_config.d.ts", "dist/+config.d.ts");
      },
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
    projects: [
      {
        test: {
          name: 'unit',
          root: './tests/unit',
          environment: 'node',
        },
      },
    ]
  }
});
