# @nipakke/vike-nuxt-ui

## 0.1.6

### Patch Changes

- 360208f: fix: require Nuxt UI 4.11 and fix SSR head rendering

  Nuxt UI 4.11 is now required (was 4.x). This fixes broken server-side head rendering that stopped critical styles (color mode, CSS variables) from being injected after upgrading to Nuxt UI 4.11.

## 0.1.5

### Patch Changes

- badaf3f: fix: handle raw ComputedRef in useHead innerHTML for nuxt/ui 4.8 compatibility

  nuxt/ui 4.8 changed colors.ts to pass a ComputedRef directly to useHead
  instead of a getter function, breaking renderSSRHead in non-Nuxt SSR contexts.

## 0.1.4

### Patch Changes

- a2f4f0e: remove leftover config oopsie

## 0.1.3

### Patch Changes

- 8cc10ce: Fixed SSR compatibility with `@nuxt/ui/vue-plugin`

## 0.1.2

### Patch Changes

- 25bac36: fix vite plugin config

## 0.1.1

### Patch Changes

- 4158fc1: add meta and remove npm token

## 0.1.0

### Minor Changes

- bfbe127: initial release
