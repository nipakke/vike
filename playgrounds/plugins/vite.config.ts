import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import { vikePlugins } from "@nipakke/vike-plugins/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite"
import Inspect from "vite-plugin-inspect"

export default defineConfig({
  plugins: [
    vikePlugins({ dir: 'plugins/' }),
    vike(),
    vue(),
    tailwindcss(),
    Inspect({
      build: true
    }),
  ],
});
