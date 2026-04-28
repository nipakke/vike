import { describe, test } from "vite-plus/test"
import { buildSerializer } from "../../src/core/serializer"
import { vueCodecRegistry } from "../../src/adapters/vue/serializer"
import { defineVikeShared } from "../../src/adapters/vike"
const { serialize, deserialize } = buildSerializer([vueCodecRegistry])




describe("vike", () => {
  test("runs", async () => {
    const plugin = defineVikeShared("test", async () => {
      const dimi = true;

      return {
        dimi
      }
    })


    await plugin.hook({})

    plugin.use()
  })


})