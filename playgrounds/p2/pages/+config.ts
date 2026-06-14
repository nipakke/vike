import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";
import ui from "@nipakke/vike-nuxt-ui/config";
import plugins from "@nipakke/vike-plugins/config";

export default {
  server: true,
  extends: [vikeVue, ui, plugins],
} satisfies Config;
