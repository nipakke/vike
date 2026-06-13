import { definePlugin } from "@nipakke/vike-plugins/vike"
import { usePageContext } from "vike-vue/usePageContext"

export default definePlugin({
  name: 'test',
  setup: async (ctx) => {
    console.log(`[test] plugin running, isServer = ${!ctx.isClientSide}`)


    ctx.globalContext.config.onCreateApp ||= []
    ctx.globalContext.config.onCreateApp.push(ctx => {
      console.log("Fus")
    })



    return {
      provide: {
        dimi: true
      }
    }
  }
})
