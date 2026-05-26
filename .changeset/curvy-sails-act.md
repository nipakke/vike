---
"@nipakke/vike-nuxt-ui": patch
---

fix: handle raw ComputedRef in useHead innerHTML for nuxt/ui 4.8 compatibility

nuxt/ui 4.8 changed colors.ts to pass a ComputedRef directly to useHead
instead of a getter function, breaking renderSSRHead in non-Nuxt SSR contexts.