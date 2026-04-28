import { defineVikeShared } from "../../../../../src/adapters/vike"

const { hook, use } = defineVikeShared("testing", async (ctx) => {
  const isServer = ctx.useState("isServer", () => ctx.isServer)

  return {
    msg: `hello from ${isServer ? 'server' : 'client'}`
  }
})

export const useTestPlugin = use
export default hook;