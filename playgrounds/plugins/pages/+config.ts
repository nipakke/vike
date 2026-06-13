import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";
import vikePluginsConfig from "@nipakke/vike-plugins/config"

export default {
  server: true,
  extends: [vikeVue, vikePluginsConfig],
} satisfies Config;
