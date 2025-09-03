---
title: Utilities - Pinia API
description: Complete API reference for Pinia utility functions. Learn about storeToRefs, mapStores, and other helper functions.
keywords: Pinia, Vue.js, utilities, storeToRefs, mapStores, API reference
author: Pinia Team
generator: VitePress
og:title: Utilities - Pinia API
og:description: Complete API reference for Pinia utility functions. Learn about storeToRefs, mapStores, and other helper functions.
og:image: /og-image.svg
og:url: https://allfun.net/api/utilities
twitter:card: summary_large_image
twitter:title: Utilities - Pinia API
twitter:description: Complete API reference for Pinia utility functions. Learn about storeToRefs, mapStores, and other helper functions.
twitter:image: /og-image.svg
---

# Utilities

Pinia provides several utility functions to help you work with stores more effectively in different scenarios.

## `storeToRefs()`

Extracts refs from a store, making state and getters reactive while preserving their reactivity.

### Signature

```ts
function storeToRefs<T extends StoreGeneric>(
  store: T
): StoreToRefs<T>
```

### Parameters

- **store**: The store instance to extract refs from

### Returns

An object containing reactive refs for all state properties and getters.

### Example

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+</button>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// Extract reactive refs
const { count, doubleCount } = storeToRefs(store)

// Actions can be destructured directly
const { increment } = store
</script>
```

### Why Use storeToRefs?

Without `storeToRefs`, destructured properties lose reactivity:

```js
// ❌ This breaks reactivity
const { count, doubleCount } = store

// ✅ This preserves reactivity
const { count, doubleCount } = storeToRefs(store)
```

### TypeScript

```ts
import type { StoreToRefs } from 'pinia'

type CounterRefs = StoreToRefs<ReturnType<typeof useCounterStore>>
// CounterRefs = {
//   count: Ref<number>
//   doubleCount: ComputedRef<number>
// }
```

## `mapStores()`

Maps multiple stores to computed properties for use in Options API components.

### Signature

```ts
function mapStores<T extends Record<string, StoreDefinition>>(
  ...stores: [...StoreDefinitions<T>]
): ComputedOptions
```

### Parameters

- **stores**: Store definitions to map

### Returns

Computed properties object for Options API.

### Example

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    // Maps to this.userStore and this.cartStore
    ...mapStores(useUserStore, useCartStore)
  },
  
  methods: {
    async login() {
      await this.userStore.login()
      this.cartStore.loadUserCart()
    }
  }
}
```

### Custom Names

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    // Maps to this.user instead of this.userStore
    ...mapStores({ user: useUserStore })
  }
}
```

## `setActivePinia()`

Sets the active Pinia instance. Useful for testing and SSR.

### Signature

```ts
function setActivePinia(pinia: Pinia | undefined): Pinia | undefined
```

### Parameters

- **pinia**: The Pinia instance to set as active

### Returns

The previously active Pinia instance.

### Example

```js
import { createPinia, setActivePinia } from 'pinia'

// Testing setup
const pinia = createPinia()
setActivePinia(pinia)

// Now stores can be used without app context
const store = useMyStore()
```

### Testing Usage

```js
import { beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

test('store works', () => {
  const store = useMyStore()
  expect(store.count).toBe(0)
})
```

## `getActivePinia()`

Gets the currently active Pinia instance.

### Signature

```ts
function getActivePinia(): Pinia | undefined
```

### Returns

The currently active Pinia instance, or `undefined` if none is set.

### Example

```js
import { getActivePinia } from 'pinia'

function myPlugin() {
  const pinia = getActivePinia()
  if (pinia) {
    // Use pinia instance
  }
}
```

## `acceptHMRUpdate()`

Enables Hot Module Replacement (HMR) for stores during development.

### Signature

```ts
function acceptHMRUpdate<T>(
  initialUseStore: () => T,
  hot: any
): (newModule: any) => any
```

### Parameters

- **initialUseStore**: The store composable function
- **hot**: The HMR context (usually `import.meta.hot`)

### Example

```js
// stores/counter.js
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  }
})

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```

### Vite Configuration

```js
// vite.config.js
export default {
  define: {
    __VUE_PROD_DEVTOOLS__: true
  }
}
```

## `skipHydration()`

Marks a ref to be skipped during SSR hydration.

### Signature

```ts
function skipHydration<T>(obj: T): T
```

### Parameters

- **obj**: The ref or reactive object to skip hydration for

### Example

```js
import { defineStore, skipHydration } from 'pinia'
import { ref } from 'vue'

export const useStore = defineStore('main', () => {
  // This will not be hydrated from server state
  const clientOnlyData = skipHydration(ref('client-only'))
  
  return { clientOnlyData }
})
```

### Use Cases

- Client-specific data (user preferences, device info)
- Data that should always be fresh on client
- Avoiding hydration mismatches

## Helper Functions

### `isRef()`

Checks if a value is a ref.

```js
import { isRef } from 'vue'
import { storeToRefs } from 'pinia'

const store = useMyStore()
const { count } = storeToRefs(store)

console.log(isRef(count)) // true
console.log(isRef(store.count)) // false
```

### `unref()`

Gets the value of a ref or returns the value if it's not a ref.

```js
import { unref } from 'vue'
import { storeToRefs } from 'pinia'

const store = useMyStore()
const { count } = storeToRefs(store)

console.log(unref(count)) // actual number value
```

### `toRef()`

Creates a ref for a property on a reactive object.

```js
import { toRef } from 'vue'

const store = useMyStore()
const countRef = toRef(store, 'count')

// countRef is reactive and linked to store.count
```

## Advanced Patterns

### Conditional Store Access

```js
import { getActivePinia } from 'pinia'

function useStoreIfAvailable() {
  const pinia = getActivePinia()
  if (pinia) {
    return useMyStore()
  }
  return null
}
```

### Store Factory

```js
import { setActivePinia, createPinia } from 'pinia'

function createStoreInstance() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return useMyStore()
}
```

### Reactive Store List

```js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

function useMultipleStores(storeList) {
  return computed(() => {
    return storeList.map(useStore => {
      const store = useStore()
      return storeToRefs(store)
    })
  })
}
```

## TypeScript Utilities

### Store Type Extraction

```ts
import type { Store } from 'pinia'

type MyStore = ReturnType<typeof useMyStore>
type MyStoreState = MyStore['$state']
type MyStoreGetters = Pick<MyStore, 'doubleCount' | 'isEven'>
```

### Generic Store Helper

```ts
function createStoreHelper<T extends StoreGeneric>(useStore: () => T) {
  return {
    getRefs: () => storeToRefs(useStore()),
    getInstance: () => useStore(),
    reset: () => useStore().$reset()
  }
}

const counterHelper = createStoreHelper(useCounterStore)
```

## Best Practices

### 1. Always Use storeToRefs for Destructuring

```js
// ✅ Good
const { count, name } = storeToRefs(store)
const { increment, updateName } = store

// ❌ Bad - loses reactivity
const { count, name, increment } = store
```

### 2. Prefer Composition API

```js
// ✅ Preferred
const store = useMyStore()
const { count } = storeToRefs(store)

// ⚠️ Options API when necessary
computed: {
  ...mapStores(useMyStore)
}
```

### 3. Use setActivePinia in Tests

```js
// ✅ Good test setup
beforeEach(() => {
  setActivePinia(createPinia())
})

// ❌ Don't forget to set active pinia
test('store test', () => {
  const store = useMyStore() // May fail without active pinia
})
```

### 4. Enable HMR in Development

```js
// ✅ Always add HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyStore, import.meta.hot))
}
```

## See Also

- [Store Instance](./store-instance) - Store instance API
- [storeToRefs](./store-to-refs) - Detailed storeToRefs guide
- [Map Helpers](./map-stores) - Mapping utilities
- [Testing Guide](../guide/testing) - Testing with Pinia