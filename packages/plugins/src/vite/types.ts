export interface VikePluginsOptions {
  /** Directory to scan for plugin files. Defaults to 'plugins/'. */
  dir?: string
  /** Directory for generated type declarations. Defaults to '.vike'. */
  dtsDir?: string
  /** Suppress the experimental-package warning. Defaults to false. */
  disableExperimentalWarning?: boolean
}

/** File mode: which environment(s) the plugin loads in. */
export type PluginFileMode = 'server' | 'client' | 'universal'

export interface PluginFileInfo {
  filename: string
  mode: PluginFileMode
  baseName: string
  /** Normalized name derived from baseName (trimmed, lowercase, special chars → _).
   *  Used as fallback when a plugin does not have an explicit name. */
  suggestedName: string
}
