import { definePlugin } from "@nipakke/vike-plugins/vike"
import { usePageContext } from "vike-vue/usePageContext"
import { getPageContext } from "vike/getPageContext"


export default definePlugin({
  name: 'auth',
  setup: async (ctx) => {
    console.log('[auth.server] running — isServer:', !ctx.isClientSide)

    type Hook = Parameters<Extract<Config['onHookCall'], Function>>[0]

    const t: Hook = {}



    console.log()

    return {
      provide: {
        user: { name: 'John (server-resolved)' },
        sessionId: 'srv-abc123',
      }
    }
  }
})
