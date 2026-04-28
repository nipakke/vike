// oxlint-disable-next-line no-unused-vars
import type _ from "vike-vue/config";
import type { Config } from "vike/types";

const config: Config = {
  name: "@nipakke/vike-vue-plugins",
  require: {
    vike: ">=0.4.249",
    "vike-vue": ">=0.8.3",
  },
  onCreateApp: "import:@nipakke/vike-vue-plugins/__internal/integration/onCreateApp:default",
  vite: {
    ssr: {
      noExternal: ["@nipakke/vike-vue-plugins"],
    },
  },
};

export default config;