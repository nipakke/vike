import { definePlugin } from "@nipakke/vike-plugins/vike"

export default definePlugin({
  name: 'dimi',
  enforce: 'post',
  setup: async (ctx) => {
    console.log(`[dimi] plugin running, isServer = ${ctx.isServer}`)
  }
})
