import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import ui from "@nipakke/vike-nuxt-ui/vite"
import { vikePlugins } from "@nipakke/vike-plugins/vite"
import Inspect from "vite-plugin-inspect"

export default defineConfig({
  plugins: [
    Inspect(),
    vike(),
    vue(),
    vikePlugins(),
    ui({
      ui: {
        colors: {
          primary: "red",
          neutral: "zinc",
        },
      },
      autoImport: {
        imports: ["vue"],
        dts: ".vike/auto-imports.d.ts",
      },
      components: {
        dts: ".vike/components.d.ts",
      },
    }),
  ],
});
