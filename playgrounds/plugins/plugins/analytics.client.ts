import { definePlugin } from "@nipakke/vike-plugins/vike"

export default definePlugin({
  name: 'analytics',
  setup: async (ctx) => {
    console.log('[analytics.client] running — isServer:', ctx.isServer)
    return {
      provide: {
        pageViewCount: 0,
        trackerId: 'UA-CLIENT-001',
      }
    }
  }
})
