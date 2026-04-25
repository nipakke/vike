// oxlint-disable-next-line no-unused-vars
import type _ from "vike-vue/config";
import type { Config } from "vike/types";

const config: Config = {
  name: "@nipakke/vike-nuxt-ui",
  require: {
    vike: ">=0.4.249",
    "vike-vue": ">=0.8.3",
  },
  /* Detect color mode on initial load */
  bodyHtmlBegin: `<script>
const theme = localStorage.getItem('vueuse-color-scheme') || 'auto'
if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
</script>`,
  onCreateApp: "import:@nipakke/vike-nuxt-ui/__internal/integration/onCreateApp:default",
  headHtmlEnd: "import:@nipakke/vike-nuxt-ui/__internal/integration/headHtmlEnd:default",
  vite: {
    ssr: {
      noExternal: ["@nipakke/vike-nuxt-ui", "@nuxt/ui"],
    },
  },
};

export default config;