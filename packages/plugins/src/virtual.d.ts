
declare module 'virtual:vike-plugins' {
  const rawPlugins: Record<string, import('./core/types').VikePlugin | null>
  export { rawPlugins }
}
