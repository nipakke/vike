import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite"


export default defineConfig({
  plugins: [
    vike(),
    vue(),
    tailwindcss()
  ],
});
