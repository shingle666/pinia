---
title: Defining Stores - Pinia Guide
description: Learn how to define stores in Pinia using both Options API and Composition API syntax. Master the fundamentals of store creation and organization.
keywords: Pinia, Vue.js, state management, defineStore, store definition, Options API, Composition API
author: Pinia Team
generator: VitePress
og:title: Defining Stores - Pinia Guide
og:description: Learn how to define stores in Pinia using both Options API and Composition API syntax. Master the fundamentals of store creation and organization.
og:image: /og-image.svg
og:url: https://allfun.net/guide/defining-stores
twitter:card: summary_large_image
twitter:title: Defining Stores - Pinia Guide
twitter:description: Learn how to define stores in Pinia using both Options API and Composition API syntax. Master the fundamentals of store creation and organization.
twitter:image: /og-image.svg
---

# Defining Stores

Before diving into core concepts, we need to know that a Store is defined using `defineStore()` and that it requires a **unique** name, passed as the first argument:

```js
import { defineStore } from 'pinia'

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useAlertsStore = defineStore('alerts', {
  // other options...
})
```

This **name**, also referred to as _id_, is necessary and is used by Pinia to connect the store to the devtools. Naming the returned function **use...** is a convention across composables to make its usage idiomatic.

`defineStore()` accepts two distinct values for its second argument: a Setup function or an Options object.

## Option Stores

Similar to Vue's Options API, we can also pass an Options Object with `state`, `getters`, and `actions` properties.

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, name: 'Eduardo' }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})
```

You can think of `state` as the `data` of the store, `getters` as the `computed` properties of the store, and `actions` as the `methods`.

Option stores should feel intuitive and simple to get started with.

## Setup Stores

There is also another possible syntax to define stores. Similar to the Vue Composition API's [setup function](https://vuejs.org/api/composition-api-setup.html), we can pass a function that defines reactive properties and methods and returns an object with the properties and methods we want to expose.

```js
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('Eduardo')
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, name, doubleCount, increment }
})
```

In Setup Stores:

- `ref()`s become `state` properties
- `computed()`s become `getters`
- `function()`s become `actions`

Note that you must return all state properties in setup stores for pinia to pick them up as state. In other words, you cannot have private state properties in stores. Not returning state properties will break SSR, devtools, and other plugins.

Setup stores bring a lot more flexibility than Option Stores as you can create watchers within a store and freely use any [composable](https://vuejs.org/guide/reusability/composables.html). However, keep in mind that using composables will make SSR more complex.

Setup stores can also rely on globally provided properties like the Router. Any property provided at the App level can be accessed from the store using `inject()`, just like in components:

```ts
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { defineStore } from 'pinia'

export const useSearchFilters = defineStore('search-filters', () => {
  const route = useRoute()
  // this assumes `app.provide('appProvided', 'value')` was called
  const appProvided = inject('appProvided')

  // ...

  return {
    // ...
  }
})
```

::: warning
Do not return properties like `route` or `appProvided` (the ones above) as they don't belong to the store and you can directly access them in components with `useRoute()` and `inject('appProvided')`.
:::

## What syntax should I pick?

As with Vue, pick the one that you feel the most comfortable with. If you're not sure, try [Option Stores](#option-stores) first.

## Using the store

We are _defining_ a store because the store won't be created until `useStore()` is called within a component `<script setup>` (or within `setup()` like all composables):

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
// access the `store` variable anywhere in the component ✨
const store = useCounterStore()
</script>
```

You can define as many stores as you want and **you should define each store in a different file** to get the most out of pinia (like automatically allow your bundle to be code split and provide TypeScript inference).

Once the store is instantiated, you can access any property defined in `state`, `getters`, and `actions` directly on the store. We will see these in detail in the next pages but auto completion will help you.

Note that `store` is an object wrapped with `reactive`, meaning there is no need to write `.value` after getters but, like `props` in `setup`, **we cannot destructure it**:

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
import { computed } from 'vue'

const store = useCounterStore()
// ❌ This won't work because it breaks reactivity
// it's the same as destructuring from `props`
const { name, doubleCount } = store
name // will always be "Eduardo" 
doubleCount // will always be 0 

setTimeout(() => {
  store.increment()
}, 1000)

// ✅ this one will be reactive
// 💡 but you could also just use `store.doubleCount` directly
const doubleValue = computed(() => store.doubleCount)
</script>
```

In order to extract properties from the store while keeping its reactivity, you need to use `storeToRefs()`. It will create refs for every reactive property. This is useful when you are only using state from the store but not calling any action. Note you can destructure actions directly from the store as they are bound to the store itself too:

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
// `name` and `doubleCount` are reactive refs
// This will also extract refs for properties added by plugins
// but skip any action or non reactive property
const { name, doubleCount } = storeToRefs(store)
// the increment action can be just extracted
const { increment } = store
</script>
```

## Next Steps

Now that you know how to define stores, it's time to learn about:

- [State Management](./state) - Managing your application state
- [Getters](./getters) - Computing derived values
- [Actions](./actions) - Modifying state and handling side effects