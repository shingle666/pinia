---
title: What is Pinia? | Pinia Study Guide
description: Learn about Pinia, the official state management library for Vue.js. Discover its key features, benefits, and why it's the perfect replacement for Vuex.
keywords: Pinia, Vue.js, state management, Vuex replacement, TypeScript, devtools
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "What is Pinia? | Pinia Study Guide" }]
  - ["meta", { property: "og:description", content: "Learn about Pinia, the official state management library for Vue.js. Discover its key features, benefits, and why it's the perfect replacement for Vuex." }]
  - ["meta", { property: "og:url", content: "https://allfun.net/guide/introduction" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "What is Pinia? | Pinia Study Guide" }]
  - ["meta", { property: "twitter:description", content: "Learn about Pinia, the official state management library for Vue.js. Discover its key features, benefits, and why it's the perfect replacement for Vuex." }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/guide/introduction" }]
---

# What is Pinia?

Pinia is a store library for Vue.js that allows you to share state across components and pages. It's the official state management solution for Vue.js and serves as a replacement for Vuex.

## Key Features

### 💡 Intuitive
Stores are as familiar as components. The API is designed to let you write well-organized stores with minimal boilerplate.

### 🔑 Type Safe
Types are inferred automatically, which means stores provide you with autocompletion even in JavaScript! Full TypeScript support out of the box.

### ⚙️ Devtools Support
Pinia hooks into Vue devtools to give you an enhanced development experience with:
- Timeline to track actions and mutations
- Stores appear in components where they are used
- Time travel debugging

### 🔌 Extensible
React to store changes and actions to extend Pinia with:
- Transactions
- Local storage synchronization
- Custom plugins

### 🏗 Modular by Design
Build multiple stores and let your bundler code split them automatically. Each store is independent and can be imported only when needed.

### 📦 Extremely Light
Pinia weighs around **1.5kb** (min+gzip), making it one of the lightest state management solutions available.

## Comparison with Vuex

Pinia offers several advantages over Vuex:

| Feature | Pinia | Vuex |
|---------|-------|------|
| TypeScript Support | ✅ Excellent | ⚠️ Requires complex setup |
| Devtools | ✅ Built-in | ✅ Built-in |
| Mutations | ❌ Not needed | ✅ Required |
| Actions | ✅ Sync & Async | ✅ Async only |
| Modules | ✅ Multiple stores | ✅ Nested modules |
| Bundle Size | 📦 ~1.5kb | 📦 ~2.5kb |
| Learning Curve | 📈 Gentle | 📈 Steep |

## When to Use Pinia

Pinia is perfect when you need to:

- **Share state** between multiple components
- **Manage complex application state** that goes beyond simple prop passing
- **Implement global state** that persists across route changes
- **Handle server-side rendering** with proper state hydration
- **Debug state changes** with time-travel debugging
- **Extend functionality** with plugins

## Basic Concepts

Pinia is built around three main concepts:

### Store
A store is a container that holds your application state, getters, and actions. Think of it as a component that you can use anywhere in your app.

### State
The data of your store. It's reactive and can be accessed from any component.

### Getters
Computed values based on the store state. They're cached and only re-evaluate when their dependencies change.

### Actions
Functions that can modify the state. They can be synchronous or asynchronous.

## Example

Here's a simple counter store to give you a taste of Pinia:

```js
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
    },
    
    async fetchCount() {
      const response = await fetch('/api/count')
      this.count = await response.json()
    }
  }
})
```

```vue
<!-- Component.vue -->
<template>
  <div>
    <p>Count: {{ counter.count }}</p>
    <p>Double: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">+1</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>
```

Ready to get started? Let's move on to [Getting Started](./getting-started)!