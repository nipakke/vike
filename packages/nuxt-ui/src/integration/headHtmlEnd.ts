import { headSymbol, type Unhead } from "@unhead/vue";
import { renderSSRHead } from "@unhead/vue/server";
import type { PageContextServer } from "vike/types";

export default async (pageContext: PageContextServer) => {
  const app = pageContext.app;

  if (!app) {
    throw new Error(
      `[vike-nuxt-ui] "app" was not found in pageContext — this is unexpected and likely a bug in vike-nuxt-ui itself.\n` +
        `Please open an issue at https://github.com/nipakke/vike`,
    );
  }

  const unhead: Unhead | undefined = app._context.provides[headSymbol];

  if (!unhead) {
    throw new Error(
      `[vike-nuxt-ui] Unhead was not found in the Vue app context.\n` +
        `Make sure the vike-nuxt-ui Vite plugin is registered in your vite.config.ts:\n\n` +
        `  import ui from "@nipakke/vike-nuxt-ui/vite"\n\n` +
        `  export default defineConfig({\n` +
        `    plugins: [\n` +
        `      vike(),\n` +
        `      vue(),\n` +
        `      ui(), // <-- this is required\n` +
        `    ],\n` +
        `  })\n`,
    );
  }

  //https://ui.nuxt.com/docs/getting-started/integrations/ssr#color-scheme-detection
  const { headTags } = await renderSSRHead(unhead);

  return headTags;
};