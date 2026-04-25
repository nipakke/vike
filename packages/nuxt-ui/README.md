![NPM Version](https://img.shields.io/npm/v/%40nipakke%2Fvike-nuxt-ui)
![NPM Downloads](https://img.shields.io/npm/dw/%40nipakke%2Fvike-nuxt-ui)
![License](https://img.shields.io/npm/l/%40nipakke%2Fvike-nuxt-ui)

# @nipakke/vike-nuxt-ui

A reusable [Vike](https://vike.dev) extension that provides a clean, **SSR-safe** integration of [Nuxt UI](https://ui.nuxt.com/) for Vike + Vue projects.

This package removes the need for manual Nuxt UI setup, auto-import wiring, Tailwind configuration, and SSR boilerplate by centralizing everything into a single Vike extension.

---

## Features

- [Nuxt UI](https://ui.nuxt.com/) integration for **Vike + Vue**
- Full **SSR support** out of the box
- Automatic component auto-imports & registration via Vite plugin
- Centralized configuration, no manual setup boilerplate

---

## Installation

```bash
npm install @nipakke/vike-nuxt-ui @nuxt/ui tailwindcss
```

---

## Getting Started

### 1. Extend your Vike config

In your project's `pages/+config.ts` (or equivalent):

```typescript
import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";
import ui from "@nipakke/vike-nuxt-ui/config";

export default {
  extends: [vikeVue, ui],
} satisfies Config;
```

### 2. Add the Vite plugin

In your `vite.config.ts`:

```typescript
import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import ui from "@nipakke/vike-nuxt-ui/vite";

export default defineConfig({
  plugins: [
    vike(),
    vue(),
    ui({
      autoImport: {
        imports: ["vue"],
        dts: ".vike/auto-imports.d.ts",
      },
      components: {
        dts: ".vike/components.d.ts",
      },
    }),
  ],
});
```

This extension wraps [Nuxt UI's Vite plugin](https://ui.nuxt.com/docs/getting-started/installation/vue), which registers [`unplugin-auto-import`](https://github.com/unplugin/unplugin-auto-import) and [`unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) under the hood. You can customize these via the `autoImport` and `components` options.

> The plugin automatically disables `vue-router` integration since Vike manages its own routing.

The `dts` options above write the generated type declarations to `.vike/`, which is also the folder we recommend gitignoring.

### 3. Add CSS

The CSS must be imported into a Vue component (e.g. `+Layout.vue` or `+Head.vue`) to be included in the bundle.

**Option A - Import the package styles directly in a Vue component:**

```vue
<!-- pages/+Layout.vue -->
<script lang="ts" setup>
import "@nipakke/vike-nuxt-ui/styles";
</script>
```

**Option B - Create a CSS file and import it in a Vue component:**

```css
/* e.g. styles/main.css */
@import "@nipakke/vike-nuxt-ui/styles";
```

```vue
<!-- pages/+Layout.vue -->
<script lang="ts" setup>
import "../styles/main.css";
</script>
```

**Option C - Manually include Tailwind and Nuxt UI in a CSS file:**

```css
/* e.g. styles/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

```vue
<!-- pages/+Layout.vue -->
<script lang="ts" setup>
import "../styles/main.css";
</script>
```

### 4. Wrap your app in `<UApp>`

In your root `pages/+Layout.vue`:

```vue
<template>
  <UApp>
    <slot />
  </UApp>
</template>
```

That's it. No manual Nuxt UI wiring required.

---

## TypeScript Configuration

Nuxt UI generates `auto-imports.d.ts` and `components.d.ts` type declaration files. Add them to your `tsconfig.json`:

```json
{
  "include": ["**/*.ts", "**/*.vue", ".vike/auto-imports.d.ts", ".vike/components.d.ts"]
}
```

You can put them wherever you want; `.vike/` is just a recommendation. Ignore them in Git:

```bash
# .gitignore
# Auto-generated type declarations
.vike/
```

Nuxt UI also relies on internal aliases to resolve theme types. Add this `paths` mapping for auto-completion in your IDE:

```json
{
  "compilerOptions": {
    "paths": {
      "#build/ui": ["./node_modules/.nuxt-ui/ui"],
      "#build/ui/*": ["./node_modules/.nuxt-ui/ui/*"]
    }
  }
}
```

---

## VS Code

It's recommended to install the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) extension and add the following workspace settings:

```json
// .vscode/settings.json
{
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": "on"
  },
  "tailwindCSS.classAttributes": ["class", "ui"],
  "tailwindCSS.classFunctions": ["defineAppConfig"]
}
```

---

## Customization

For theming and component configuration, check the [Nuxt UI docs](https://ui.nuxt.com/). You can customize colors, default variants, and more through the `ui` option in the Vite plugin:

```typescript
ui({
  ui: {
    colors: {
      primary: "green",
      neutral: "slate",
    },
  },
});
```

See [Runtime Configuration](https://ui.nuxt.com/docs/getting-started/theme/design-system#runtime-configuration) in the Nuxt UI docs for all available options.

---

## Examples

See the [minimal playground](./playgrounds/nuxt-ui) for a working project with the bare essentials:

- [`pages/+config.ts`](./playgrounds/nuxt-ui/pages/+config.ts) - Vike config with `server: true`
- [`vite.config.ts`](./playgrounds/nuxt-ui/vite.config.ts) - Vite plugin configuration
- [`pages/+Layout.vue`](./playgrounds/nuxt-ui/pages/+Layout.vue) - `<UApp>` wrapper & CSS import
- [`pages/index/+Page.vue`](./playgrounds/nuxt-ui/pages/index/+Page.vue) - basic page using Nuxt UI components
- [`tsconfig.json`](./playgrounds/nuxt-ui/tsconfig.json) - TypeScript config with generated declarations

---

## Contributing

Contributions are welcome! Feel free to open issues or pull requests.