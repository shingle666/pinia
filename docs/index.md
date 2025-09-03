---
layout: home
title: Pinia | The Vue Store that you will enjoy using
description: Pinia is the official state management library for Vue.js. Type safe, extensible, and modular by design. The perfect Vuex replacement with excellent TypeScript support.
keywords: Pinia, Vue.js, state management, Vuex replacement, TypeScript, Vue store, reactive state
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "website" }]
  - ["meta", { property: "og:title", content: "Pinia | The Vue Store that you will enjoy using" }]
  - ["meta", { property: "og:description", content: "Pinia is the official state management library for Vue.js. Type safe, extensible, and modular by design. The perfect Vuex replacement with excellent TypeScript support." }]
  - ["meta", { property: "og:url", content: "https://allfun.net/" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Pinia | The Vue Store that you will enjoy using" }]
  - ["meta", { property: "twitter:description", content: "Pinia is the official state management library for Vue.js. Type safe, extensible, and modular by design. The perfect Vuex replacement with excellent TypeScript support." }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/" }]

hero:
  name: "Pinia"
  text: "The Vue Store that you will enjoy using"
  tagline: "Type Safe, Extensible, and Modular by design. Forget you are even using a store."
  image:
    src: /logo.svg
    alt: Pinia
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: What is Pinia?
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/shingle666

features:
  - icon: 🍍
    title: Intuitive
    details: Intuitive API that makes state management simple and clear. No complex boilerplate code, focus on business logic.
  - icon: 🔒
    title: Type Safe
    details: Complete TypeScript support with excellent type inference and autocompletion experience.
  - icon: ⚡
    title: Devtools Support
    details: Powerful Vue DevTools support with time-travel debugging and hot reload capabilities.
  - icon: 🔧
    title: Extensible
    details: Extend Pinia functionality through the plugin system to meet various complex requirements.
  - icon: 📦
    title: Modular by Design
    details: Each store is an independent module, supporting code splitting and lazy loading.
  - icon: 🪶
    title: Extremely Light
    details: Only ~1.5KB compressed, minimal impact on application performance.
---

## Quick Start

### Installation

::: code-group

```bash [npm]
npm install pinia
```

```bash [yarn]
yarn add pinia
```

```bash [pnpm]
pnpm add pinia
```

:::

### Basic Usage

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

```vue
<!-- Use in component -->
<template>
  <div>
    <p>Count: {{ counter.count }}</p>
    <p>Double Count: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">Increment</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>
```

## Why Choose Pinia?

Pinia is the official state management library for Vue.js, providing a simpler and more intuitive API while maintaining powerful functionality:

- **🎯 Simple and Intuitive**: Clean API design with low learning curve
- **🔄 Composition API Friendly**: Perfect support for Vue 3's Composition API
- **📱 SSR Support**: Server-side rendering works out of the box
- **🧪 Easy to Test**: Each store can be tested independently
- **🔌 Rich Plugin Ecosystem**: Extensive plugin ecosystem for various needs

Ready to get started? Check out our [Getting Started Guide](/guide/getting-started) or learn about [Pinia's Core Concepts](/guide/introduction).