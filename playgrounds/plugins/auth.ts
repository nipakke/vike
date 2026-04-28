import { defineVikeShared } from "@nipakke/vike-vue-plugins/vike"
import { vueSerializer } from "@nipakke/vike-vue-plugins/vue"
import { isReactive, reactive, ref } from "vue"


export const { hook, use: useAuth } = defineVikeShared("somekey", (ctx) => {
  const server = ctx.useState("server", () => ctx.isServer)

  return {
    server,
  }
})

export default hook