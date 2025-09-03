---
title: Pinia Installation Guide | Complete Setup Tutorial
description: Learn how to install and configure Pinia in your Vue.js project. Supports npm, yarn, pnpm installation methods, including TypeScript and Nuxt.js configuration.
keywords: Pinia installation, Vue.js state management, npm install, TypeScript configuration, Nuxt.js integration
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "Pinia Installation Guide | Complete Setup Tutorial" }]
  - ["meta", { property: "og:description", content: "Learn how to install and configure Pinia in your Vue.js project. Supports npm, yarn, pnpm installation methods, including TypeScript and Nuxt.js configuration." }]
  - ["meta", { property: "og:url", content: "https://allfun.net/guide/installation" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Pinia Installation Guide | Complete Setup Tutorial" }]
  - ["meta", { property: "twitter:description", content: "Learn how to install and configure Pinia in your Vue.js project. Supports npm, yarn, pnpm installation methods, including TypeScript and Nuxt.js configuration." }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/guide/installation" }]
---

# Installation

This page covers different ways to install and set up Pinia in your Vue.js project.

## Package Managers

### npm

```bash
npm install pinia
```

### Yarn

```bash
yarn add pinia
```

### pnpm

```bash
pnpm add pinia
```

## CDN

You can use Pinia directly in the browser via CDN:

### Latest Version

```html
<script src="https://unpkg.com/pinia@latest/dist/pinia.iife.js"></script>
```

### Specific Version

```html
<script src="https://unpkg.com/pinia@2.1.7/dist/pinia.iife.js"></script>
```

### With Vue 3

```html
<!DOCTYPE html>
<html>
<head>
  <title>Pinia Example</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://unpkg.com/pinia@latest/dist/pinia.iife.js"></script>
</head>
<body>
  <div id="app">
    <p>Count: {{ counter.count }}</p>
    <button @click="counter.increment()">+</button>
  </div>

  <script>
    const { createApp } = Vue
    const { createPinia, defineStore } = Pinia

    const useCounterStore = defineStore('counter', {
      state: () => ({ count: 0 }),
      actions: {
        increment() {
          this.count++
        }
      }
    })

    const app = createApp({
      setup() {
        const counter = useCounterStore()
        return { counter }
      }
    })

    app.use(createPinia())
    app.mount('#app')
  </script>
</body>
</html>
```

## Vue CLI

If you're using Vue CLI, you can add Pinia to your project:

```bash
vue add pinia
```

This will:
- Install the Pinia package
- Set up the basic configuration
- Create an example store

## Vite

Pinia works seamlessly with Vite. Just install it and set it up:

```bash
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm install pinia
```

Then set up Pinia in your `main.js`:

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

## Nuxt 3

For Nuxt 3, install the Pinia module:

```bash
npm install @pinia/nuxt
```

Add it to your `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})
```

That's it! Pinia will be automatically configured for you.

### Manual Setup (Nuxt 3)

If you prefer manual setup:

```bash
npm install pinia
```

```js
// plugins/pinia.js
import { createPinia } from 'pinia'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(createPinia())
})
```

## TypeScript Support

Pinia has excellent TypeScript support out of the box. No additional packages are needed.

### Type Definitions

If you're using TypeScript, you might want to add type definitions for better IDE support:

```bash
npm install --save-dev @types/node
```

### Volar Support

For Vue 3 + TypeScript + Volar, add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

## Version Compatibility

| Pinia Version | Vue Version | Notes |
|---------------|-------------|---------|
| 2.x | 3.x | Recommended |
| 2.x | 2.7 | Limited support |
| 1.x | 2.x | Legacy (not recommended) |

## Browser Support

Pinia supports all browsers that Vue 3 supports:

- Chrome ≥ 87
- Firefox ≥ 78
- Safari ≥ 14
- Edge ≥ 88

## Development vs Production

### Development

In development, Pinia includes:
- DevTools integration
- Hot Module Replacement (HMR)
- Detailed error messages
- Time-travel debugging

### Production

In production builds:
- DevTools code is automatically stripped
- Smaller bundle size
- Optimized performance

## Bundle Size

Pinia is extremely lightweight:

- **Minified**: ~4.5kb
- **Minified + Gzipped**: ~1.5kb
- **Tree-shakable**: Only import what you use

## ESM vs CommonJS

Pinia supports both module systems:

### ESM (Recommended)

```js
import { createPinia, defineStore } from 'pinia'
```

### CommonJS

```js
const { createPinia, defineStore } = require('pinia')
```

## Verification

To verify your installation is working:

1. Create a simple store:

```js
// stores/test.js
import { defineStore } from 'pinia'

export const useTestStore = defineStore('test', {
  state: () => ({ message: 'Pinia is working!' })
})
```

2. Use it in a component:

```vue
<template>
  <div>{{ test.message }}</div>
</template>

<script setup>
import { useTestStore } from '@/stores/test'
const test = useTestStore()
</script>
```

3. If you see "Pinia is working!", your installation is successful!

## Troubleshooting

### Common Issues

**Error: "Cannot resolve 'pinia'"**
- Make sure you've installed Pinia: `npm install pinia`
- Check your `package.json` to confirm it's listed in dependencies

**Error: "createPinia is not a function"**
- Check your import statement: `import { createPinia } from 'pinia'`
- Make sure you're using a compatible Vue version

**DevTools not working**
- Make sure you're in development mode
- Install Vue DevTools browser extension
- Check that Pinia is properly registered with `app.use(createPinia())`

**TypeScript errors**
- Make sure you have the latest version of Pinia
- Check your `tsconfig.json` configuration
- Restart your TypeScript language server

### Getting Help

If you're still having issues:

1. Check the [GitHub Issues](https://github.com/vuejs/pinia/issues)
2. Ask on [Discord](https://discord.gg/HBherRA)
3. Post on [Stack Overflow](https://stackoverflow.com/questions/tagged/pinia)

Next: [Getting Started](./getting-started)