import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import ui from "@nipakke/vike-nuxt-ui/vite";

export default defineConfig({
  plugins: [
    vike(),
    vue(),
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
