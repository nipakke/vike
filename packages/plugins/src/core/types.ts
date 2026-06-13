export type Enforcement = 'pre' | 'default' | 'post'

export type PluginContext = {
  isServer: boolean
}

export type VikePluginHook = (ctx: PluginContext) => void | Promise<void>

export type VikePluginOptions = {
  name?: string
  enforce?: Enforcement
  order?: number
  parallel?: boolean
  await?: boolean
  setup: VikePluginHook
}

export type VikePlugin = {
  name: string
  enforce: Enforcement
  order: number
  parallel: boolean
  await: boolean
  setup: VikePluginHook
}
