import type { Config } from 'vike/types'
import { VikePluginStoreKey } from "../../../../../src/adapters/vike"

// https://vike.dev/config
export default {
  // https://vike.dev/clientRouting
  clientRouting: true,
  // https://vike.dev/meta
  meta: {
    // Define new setting 'title'
    title: {
      env: { server: true, client: true }
    },
    // Define new setting 'description'
    description: {
      env: { server: true }
    }
  },
  hydrationCanBeAborted: true,
  onCreatePageContext: [
    "import:../plugins/test-plugin:default"
  ],
  passToClient: [VikePluginStoreKey]
} satisfies Config
