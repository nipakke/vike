import type { Config } from 'vike/types'

export default {
  clientRouting: true,
  meta: {
    title: {
      env: { server: true, client: true }
    },
    description: {
      env: { server: true }
    }
  },
  hydrationCanBeAborted: true,
  // onCreatePageContext is now handled by the Vite plugin auto-injection
  // No passToClient needed — no store
} satisfies Config
