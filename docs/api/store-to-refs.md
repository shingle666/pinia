---
title: storeToRefs() - Pinia API
description: Complete API reference for storeToRefs function. Learn how to extract reactive refs from Pinia stores.
keywords: Pinia, Vue.js, storeToRefs, reactive refs, API reference, destructuring
author: Pinia Team
generator: VitePress
og:title: storeToRefs() - Pinia API
og:description: Complete API reference for storeToRefs function. Learn how to extract reactive refs from Pinia stores.
og:image: /og-image.svg
og:url: https://allfun.net/api/store-to-refs
twitter:card: summary_large_image
twitter:title: storeToRefs() - Pinia API
twitter:description: Complete API reference for storeToRefs function. Learn how to extract reactive refs from Pinia stores.
twitter:image: /og-image.svg
---

# storeToRefs()

Extracts refs from a store, making state and getters reactive while preserving their reactivity when destructured.

## Signature

```ts
function storeToRefs<T extends StoreGeneric>(
  store: T
): StoreToRefs<T>
```

## Parameters

- **store**: The store instance to extract refs from

## Returns

An object containing reactive refs for all state properties and getters. Actions are excluded since they don't need to be reactive.

## Why storeToRefs?

When you destructure a store directly, you lose reactivity:

```js
// ❌ This breaks reactivity
const { count, doubleCount } = store

// ✅ This preserves reactivity
const { count, doubleCount } = storeToRefs(store)
```

## Basic Usage

### Composition API

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// Extract reactive refs for state and getters
const { count, doubleCount } = storeToRefs(store)

// Actions can be destructured directly (they don't need reactivity)
const { increment, decrement } = store
</script>
```

### Options API

```js
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  setup() {
    const store = useCounterStore()
    const { count, doubleCount } = storeToRefs(store)
    
    return {
      count,
      doubleCount,
      increment: store.increment,
      decrement: store.decrement
    }
  }
}
```

## What Gets Extracted

### State Properties

All state properties become reactive refs:

```js
const store = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter',
    items: []
  })
})

const { count, name, items } = storeToRefs(useCounterStore())
// count: Ref<number>
// name: Ref<string>
// items: Ref<any[]>
```

### Getters

All getters become computed refs:

```js
const store = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  }
})

const { doubleCount, isEven } = storeToRefs(useCounterStore())
// doubleCount: ComputedRef<number>
// isEven: ComputedRef<boolean>
```

### Actions Are Excluded

Actions are not included in the returned object since they don't need reactivity:

```js
const store = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  }
})

const refs = storeToRefs(useCounterStore())
// refs.increment is undefined

// Get actions directly from store
const { increment } = useCounterStore()
```

## Advanced Usage

### Selective Extraction

```js
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()

// Extract only what you need
const { name, email } = storeToRefs(store)
const { updateProfile, logout } = store
```

### Renaming During Extraction

```js
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const storeRefs = storeToRefs(store)

// Rename during destructuring
const {
  name: userName,
  email: userEmail
} = storeRefs
```

### Multiple Stores

```js
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const userStore = useUserStore()
const cartStore = useCartStore()

// Extract from multiple stores
const { name, email } = storeToRefs(userStore)
const { items, total } = storeToRefs(cartStore)

// Get actions
const { login, logout } = userStore
const { addItem, removeItem } = cartStore
```

### Computed Properties

```js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, email } = storeToRefs(store)

// Create computed based on store refs
const displayName = computed(() => {
  return name.value || email.value || 'Anonymous'
})

const isLoggedIn = computed(() => {
  return !!name.value && !!email.value
})
```

### Watchers

```js
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, email } = storeToRefs(store)

// Watch individual refs
watch(name, (newName, oldName) => {
  console.log(`Name changed from ${oldName} to ${newName}`)
})

// Watch multiple refs
watch([name, email], ([newName, newEmail], [oldName, oldEmail]) => {
  console.log('User info changed:', { newName, newEmail })
})
```

## TypeScript

### Type Inference

```ts
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
const { count, doubleCount } = storeToRefs(store)

// TypeScript automatically infers:
// count: Ref<number>
// doubleCount: ComputedRef<number>
```

### Explicit Typing

```ts
import type { Ref, ComputedRef } from 'vue'
import type { StoreToRefs } from 'pinia'
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

type CounterStore = ReturnType<typeof useCounterStore>
type CounterRefs = StoreToRefs<CounterStore>

const store = useCounterStore()
const refs: CounterRefs = storeToRefs(store)

// Or extract specific types
const count: Ref<number> = refs.count
const doubleCount: ComputedRef<number> = refs.doubleCount
```

### Generic Helper

```ts
function useStoreRefs<T extends StoreGeneric>(useStore: () => T) {
  const store = useStore()
  const refs = storeToRefs(store)
  
  return {
    store,
    refs,
    ...refs
  }
}

// Usage
const { store, refs, count, doubleCount } = useStoreRefs(useCounterStore)
```

## Common Patterns

### Form Binding

```vue
<template>
  <form @submit.prevent="saveUser">
    <input v-model="name" placeholder="Name" />
    <input v-model="email" placeholder="Email" />
    <button type="submit">Save</button>
  </form>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, email } = storeToRefs(store)
const { saveUser } = store
</script>
```

### Conditional Rendering

```vue
<template>
  <div>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <h1>{{ title }}</h1>
      <p>{{ content }}</p>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useContentStore } from '@/stores/content'

const store = useContentStore()
const { isLoading, error, title, content } = storeToRefs(store)
</script>
```

### List Rendering

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }} - {{ item.price }}
      <button @click="removeItem(item.id)">Remove</button>
    </li>
  </ul>
  <p>Total: {{ total }}</p>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const store = useCartStore()
const { items, total } = storeToRefs(store)
const { removeItem } = store
</script>
```

## Performance Considerations

### Lazy Extraction

```js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useExpensiveStore } from '@/stores/expensive'

// Only extract when needed
const expensiveRefs = computed(() => {
  const store = useExpensiveStore()
  return storeToRefs(store)
})

// Access when needed
const expensiveData = computed(() => expensiveRefs.value.data)
```

### Selective Extraction

```js
import { storeToRefs } from 'pinia'
import { useLargeStore } from '@/stores/large'

// Don't extract everything if you only need a few properties
const store = useLargeStore()
const allRefs = storeToRefs(store) // ❌ Extracts everything

// Better: extract only what you need
const { specificProp } = storeToRefs(store) // ✅ More efficient
```

## Best Practices

### 1. Extract State and Getters, Not Actions

```js
// ✅ Good
const { count, doubleCount } = storeToRefs(store)
const { increment, decrement } = store

// ❌ Avoid - actions don't need reactivity
const { count, doubleCount, increment } = storeToRefs(store) // increment is undefined
```

### 2. Use Descriptive Names

```js
// ✅ Good - clear what store the data comes from
const { name: userName, email: userEmail } = storeToRefs(userStore)
const { items: cartItems, total: cartTotal } = storeToRefs(cartStore)

// ❌ Confusing - unclear source
const { name, email } = storeToRefs(userStore)
const { name: itemName } = storeToRefs(productStore) // name conflict
```

### 3. Extract Early in Setup

```js
// ✅ Good - extract at the top of setup
const store = useMyStore()
const { data, isLoading } = storeToRefs(store)
const { fetchData } = store

// Then use in computed, watchers, etc.
const processedData = computed(() => {
  return data.value?.map(item => ({ ...item, processed: true }))
})
```

### 4. Combine with Other Composables

```js
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

function useUserProfile() {
  const router = useRouter()
  const store = useUserStore()
  const { user, isLoading } = storeToRefs(store)
  const { fetchUser, updateUser } = store
  
  const navigateToProfile = () => {
    router.push('/profile')
  }
  
  return {
    user,
    isLoading,
    fetchUser,
    updateUser,
    navigateToProfile
  }
}
```

## Troubleshooting

### Lost Reactivity

```js
// ❌ Problem: Direct destructuring loses reactivity
const { count } = useCounterStore()

// ✅ Solution: Use storeToRefs
const { count } = storeToRefs(useCounterStore())
```

### Undefined Actions

```js
// ❌ Problem: Actions are not in storeToRefs result
const { increment } = storeToRefs(store) // increment is undefined

// ✅ Solution: Get actions from store directly
const { increment } = store
```

### TypeScript Errors

```ts
// ❌ Problem: Type errors with wrong extraction
const store = useMyStore()
const { nonExistentProp } = storeToRefs(store) // TypeScript error

// ✅ Solution: Only extract existing properties
const { existingProp } = storeToRefs(store)
```

## See Also

- [Store Instance](./store-instance) - Store instance API
- [Utilities](./utilities) - Other utility functions
- [Composition API Guide](../guide/composition-stores) - Using stores in Composition API
- [State Guide](../guide/state) - Working with state