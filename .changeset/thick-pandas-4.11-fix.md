---
"@nipakke/vike-nuxt-ui": patch
---

fix: require Nuxt UI 4.11 and fix SSR head rendering

Nuxt UI 4.11 is now required (was 4.x). This fixes broken server-side head rendering that stopped critical styles (color mode, CSS variables) from being injected after upgrading to Nuxt UI 4.11.