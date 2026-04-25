import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";
import ui from "@nipakke/vike-nuxt-ui/config";

export default {
  server: true,
  extends: [vikeVue, ui],
} satisfies Config;
