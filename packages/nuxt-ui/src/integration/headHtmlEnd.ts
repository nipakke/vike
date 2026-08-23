import { headSymbol, type Unhead } from "@unhead/vue";
import { renderSSRHead } from "@unhead/vue/server";
import type { PageContextServer } from "vike/types";
import { toValue } from "vue";

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

  // Nuxt UI's colors plugin passes a raw ComputedRef as style[].innerHTML to useHead:
  //  - 4.8 changed to pass a raw ComputedRef instead of a getter fn:
  //    https://github.com/nuxt/ui/commit/00b747616fc4890a3fe385b99b0202db02af2228#diff-748120e89203f34cef10afaa214550c346e5919add4581bf6e22a0fa277403a7R47
  //  - 4.11 still does this (runtime/plugins/colors.js), and Unhead 3.x does not unwrap
  //    Vue refs in SSR entries (resolveTags only applies head.resolvedOptions.propResolvers).
  // toValue() handles refs, computed, getter fns, and plain values — so this works across all versions.
  for (const [, entry] of unhead.entries) {
    const styles: any[] = (entry.input as any)?.style ?? [];
    for (const style of styles) {
      if ("innerHTML" in style) {
        style.innerHTML = toValue(style.innerHTML);
      }
    }
  }

  // https://ui.nuxt.com/docs/getting-started/integrations/ssr#color-scheme-detection
  //
  // NOTE: The head instance is created by Nuxt UI's vue-plugin from @unhead/vue/client.
  // Nuxt UI >= 4.11 depends on @unhead/vue 3.x, whose head instances do NOT expose a
  // resolveTags() method (it's a standalone util in unhead/utils). We build against
  // @unhead/vue ^3.4.0 so this renderSSRHead call matches the head Nuxt UI provides —
  // which is why this package requires @nuxt/ui ^4.11.0 (see peerDependencies).
  //
  // renderSSRHead carries a @deprecated marker ("use head.render()") in unhead 3.x,
  // but that guidance only applies to heads created with a server renderer
  // (@unhead/vue/server createHead / unhead/server). Nuxt UI creates its head via
  // @unhead/vue/client, whose render() is the debounced DOM renderer and returns
  // undefined server-side. renderSSRHead is the ONLY API that SSR-renders the
  // client-created head, so we keep it here.
  try {
    // renderSSRHead is synchronous in unhead 3.x (2.x returned a Promise).
    const { headTags } = renderSSRHead(unhead);
    return headTags;
  } catch (error) {
    console.error("\x1b[41m\x1b[97m [vike-nuxt-ui] SSR HEAD RENDER FAILED \x1b[0m");
    console.error(
      "\x1b[33m⚠ Impact:\x1b[0m  Nuxt UI critical styles (color mode, CSS variables) will NOT be injected server-side.",
    );
    console.error(
      "\x1b[33m⚠ Symptom:\x1b[0m The page may appear \x1b[1munstyled or flash white\x1b[0m until client-side hydration completes.",
    );
    console.error("\x1b[31m✖ Cause:\x1b[0m  ", error instanceof Error ? error.message : String(error));
    console.error(
      "\x1b[36mℹ Likely reason:\x1b[0m A reactive value (ref/computed) was passed directly to useHead() and could not be unwrapped.",
    );
    console.error("\x1b[36mℹ Please open an issue at:\x1b[0m https://github.com/nipakke/vike");
    console.error("\x1b[90mStack trace:\x1b[0m", error);
  }
};