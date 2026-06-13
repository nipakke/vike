import { definePlugin } from '../../../../../src/core/definePlugin.js'

export default definePlugin({
  name: 'testing',
  setup: async (ctx) => {
    // Plugin initializes on both server and client
    // ctx.isClientSide is false on server, true on client
  }
})
