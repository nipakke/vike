import { definePlugin } from '../../../../../src/core/definePlugin.js'

export default definePlugin({
  name: 'testing',
  setup: async (ctx) => {
    // Plugin initializes on both server and client
    // ctx.isServer is true on server, false on client
  }
})
