import { definePlugin } from "@nipakke/vike-plugins/vike"

export default definePlugin({
  name: 'auth',
  setup: async (ctx) => {
    // Plugin runs on both server and client per-request
    if (ctx.isServer) {
      // Server-side only setup (e.g., read cookies, validate session)
      console.log('[auth] running on server')
    } else {
      // Client-side only setup (e.g., restore session from localStorage)
      console.log('[auth] running on client')
    }
  }
})
