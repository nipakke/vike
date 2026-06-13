import { definePlugin } from "@nipakke/vike-plugins/vike"

export default definePlugin({
  name: 'theme',
  setup: async (ctx) => {
    console.log('[theme] running — isServer:', ctx.isServer)
    return {
      provide: {
        mode: 'dark' as const,
        primaryColor: '#4f46e5',
      }
    }
  }
})
