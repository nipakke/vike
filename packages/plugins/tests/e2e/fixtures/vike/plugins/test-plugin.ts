import { definePlugin } from '../../../../../src/core/definePlugin.js'

export default definePlugin(async (ctx) => {
  // Plugin initializes on both server and client
  // ctx.isClientSide is false on server, true on client
}, { name: 'testing' })
