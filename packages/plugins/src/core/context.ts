import type { UseState } from './useState.js'

export type PluginContext = {
  isServer: boolean
  useState: UseState
}