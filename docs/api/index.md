---
title: Pinia API Reference | Complete Documentation
description: Complete API documentation for Pinia. Explore all functions, types, and utilities for Vue.js state management with detailed examples and usage guides.
keywords: Pinia API, Vue state management API, defineStore, createPinia, Pinia documentation, Vue.js API reference
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "website" }]
  - ["meta", { property: "og:title", content: "Pinia API Reference | Complete Documentation" }]
  - ["meta", { property: "og:description", content: "Complete API documentation for Pinia. Explore all functions, types, and utilities for Vue.js state management with detailed examples and usage guides." }]
  - ["meta", { property: "og:url", content: "https://allfun.net/api/" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Pinia API Reference | Complete Documentation" }]
  - ["meta", { property: "twitter:description", content: "Complete API documentation for Pinia. Explore all functions, types, and utilities for Vue.js state management with detailed examples and usage guides." }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/api/" }]
---

# API Reference

This section provides detailed documentation for all Pinia APIs.

## Core APIs

### Store Definition
- [defineStore](./define-store) - Define a new store
- [Store Instance](./store-instance) - Store instance methods and properties

### Pinia Instance
- [createPinia](./pinia-instance) - Create a Pinia instance
- [Pinia Instance](./pinia-instance) - Pinia instance methods

### Utilities
- [storeToRefs](./utilities#storetorefs) - Extract refs from store
- [mapStores](./utilities#mapstores) - Map stores for Options API
- [mapState](./utilities#mapstate) - Map state for Options API
- [mapActions](./utilities#mapactions) - Map actions for Options API

## Quick Reference

### Basic Store

```js
import { defineStore } from 'pinia'

export const useStore = defineStore('main', {
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

### Composition API Store

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStore = defineStore('main', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, doubleCount, increment }
})
```

### Using Stores

```js
import { useStore } from '@/stores/main'
import { storeToRefs } from 'pinia'

// In setup()
const store = useStore()

// Destructure with reactivity
const { count, doubleCount } = storeToRefs(store)
const { increment } = store
```

## Type Definitions

### Store

```ts
interface Store<Id, S, G, A> {
  $id: Id
  $state: S
  $patch(partialState: Partial<S>): void
  $patch(stateMutator: (state: S) => void): void
  $reset(): void
  $subscribe(callback: SubscriptionCallback<S>): () => void
  $onAction(callback: ActionSubscriptionCallback<A>): () => void
  $dispose(): void
}
```

### DefineStoreOptions

```ts
interface DefineStoreOptions<Id, S, G, A> {
  id?: Id
  state?: () => S
  getters?: G
  actions?: A
  hydrate?(storeState: S, initialState: S): void
}
```

Explore the detailed API documentation in the following sections.