import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";
import { VikePluginStoreKey } from "@nipakke/vike-vue-plugins/vike"


export default {
  server: true,
  extends: [vikeVue],
  onCreatePageContext: [
    "import:../auth.ts:default"
  ],
  passToClient: [
    VikePluginStoreKey
  ]
} satisfies Config;
