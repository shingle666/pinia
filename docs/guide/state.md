---
title: State Management - Pinia Guide
description: Learn how to manage state in Pinia stores. Understand how to access, mutate, and reset state in both Options API and Composition API syntax.
keywords: Pinia, Vue.js, state management, store state, reactive state, state mutation, state reset
author: Pinia Team
generator: VitePress
og:title: State Management - Pinia Guide
og:description: Learn how to manage state in Pinia stores. Understand how to access, mutate, and reset state in both Options API and Composition API syntax.
og:image: /og-image.svg
og:url: https://allfun.net/guide/state
twitter:card: summary_large_image
twitter:title: State Management - Pinia Guide
twitter:description: Learn how to manage state in Pinia stores. Understand how to access, mutate, and reset state in both Options API and Composition API syntax.
twitter:image: /og-image.svg
---

# State

The state is, most of the time, the central part of your store. People often start by defining the state that represents their app. In Pinia the state is defined as a function that returns the initial state. This allows Pinia to work in both Server and Client Side.

```js
import { defineStore } from 'pinia'

const useStore = defineStore('storeId', {
  // arrow function recommended for full type inference
  state: () => {
    return {
      // all these properties will become reactive
      count: 0,
      name: 'Eduardo',
      isAdmin: true,
      items: [],
      hasChanged: true,
    }
  },
})
```

::: tip
If you are using Vue 2, the data you create in `state` follows the same rules as the `data` in a Vue instance, i.e. the state object must be plain and you need to call `Vue.set()` when **adding new** properties to it. **See also: [Vue#data](https://vuejs.org/v2/api/#data)**.
:::

## Accessing the state

By default, you can directly read and write to the state by accessing it through the `store` instance:

```js
const store = useStore()

store.count++
```

Note that you cannot add a new state property **if it wasn't defined in `state()`**, it must contain the initial state.

## Resetting the state

In [Option Stores](./defining-stores#option-stores), you can *reset* the state to its initial value by calling the `$reset()` method on the store:

```js
const store = useStore()

store.$reset()
```

Internally, this calls the `state()` function to create a new state object and replaces the current state with it.

In [Setup Stores](./defining-stores#setup-stores), you need to create your own `$reset()` method:

```js
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  function $reset() {
    count.value = 0
  }

  return { count, $reset }
})
```

### Usage with the Options API

<VueSchoolLink
  href="https://vueschool.io/lessons/access-pinia-state-in-the-options-api"
  title="Access Pinia State in the Options API"
/>

For the following examples, you can assume the following store was created:

```js
// Example File Path:
// ./src/stores/counter.js

import { defineStore } from 'pinia'

const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
})
```

If you are not using the Composition API, and you are using `computed`, `methods`, ..., you can use the `mapState()` helper to map state properties as readonly computed properties:

```js
import { mapState } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default {
  computed: {
    // gives access to this.count inside the component
    // same as reading from store.count
    ...mapState(useCounterStore, ['count'])
    // same as above but registers it as this.myOwnName
    ...mapState(useCounterStore, {
      myOwnName: 'count',
      // you can also write a function that gets access to the store
      double: store => store.count * 2,
      // it can have access to `this` but it won't be typed correctly...
      magicValue(store) {
        return store.someGetter + this.count + this.double
      },
    }),
  },
}
```

#### Modifiable state

If you want to be able to write to these state properties (e.g. if you have a form), you can use `mapWritableState()` instead. Note you cannot pass a function like with `mapState()`:

```js
import { mapWritableState } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default {
  computed: {
    // gives access to this.count inside the component and allows setting it
    // this.count++
    // same as reading from store.count
    ...mapWritableState(useCounterStore, ['count'])
    // same as above but registers it as this.myOwnName
    ...mapWritableState(useCounterStore, {
      myOwnName: 'count',
    }),
  },
}
```

::: tip
You don't need `mapWritableState()` for collections like arrays unless you are replacing the whole array with `cartItems = []`, `mapState()` still allows you to call methods on your collections.
:::

## Mutating the state

Apart from directly mutating the store with `store.count++`, you can also call the `$patch` method. It allows you to apply multiple changes at the same time with a partial `state` object:

```js
store.$patch({
  count: store.count + 1,
  age: 120,
  name: 'DIO',
})
```

However, some mutations are really hard to apply with this syntax: any array modification, for example, would require you to create a new array. Because of this, the `$patch` method also accepts a function to group this kind of mutations:

```js
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})
```

The main difference here is that `$patch()` allows you to group multiple changes into one single entry in the devtools. Note that **both, direct changes to `state` and `$patch()` appear in the devtools** and can be time traveled (not yet in Vue 2).

## Replacing the state

You **cannot exactly replace** the state of a store as that would break reactivity. You can however *patch it*:

```js
// this will actually replace the `$state`
store.$patch({ $state: newState })

// it also allows you to set it directly but you must replace it completely:
store.$state = newState
```

You can also **replace the state of your whole application** by changing the `state` of the `pinia` instance. This is used during [SSR for hydration](../ssr/nuxt.md#state-hydration).

```js
pinia.state.value = {}
```

## Subscribing to the state

You can watch the state and its changes through the `$subscribe()` method of a store, similar to Vuex's [subscribe method](https://vuex.vuejs.org/api/#subscribe). The advantage of using `$subscribe()` over a regular `watch()` is that *subscriptions* will trigger only once after *patches* (e.g. when using the function version from above).

```js
cartStore.$subscribe((mutation, state) => {
  // import { MutationType } from 'pinia'
  // mutation.type // 'direct' | 'patch object' | 'patch function'
  // same as cartStore.$id
  mutation.storeId // 'cart'
  // only available with mutation.type === 'patch object'
  mutation.payload // patch object passed to cartStore.$patch()

  // persist the whole state to the local storage whenever it changes
  localStorage.setItem('cart', JSON.stringify(state))
})
```

By default, *state subscriptions* are bound to the component where they are added (if the store is inside a component's `setup()`). Meaning, they will be automatically removed when the component is unmounted. If you want to keep them after the component is unmounted, pass `{ detached: true }` as the second argument to *detach* the *state subscription* from the current component:

```vue
<script setup>
const someStore = useSomeStore()

// this subscription will be kept after the component is unmounted
someStore.$subscribe(callback, { detached: true })
</script>
```

::: tip
You can *watch* the whole state on the `pinia` instance with a single `watch()`:

```js
watch(
  pinia.state,
  (state) => {
    // persist the whole state to the local storage whenever it changes
    localStorage.setItem('piniaState', JSON.stringify(state))
  },
  { deep: true }
)
```
:::

## Next Steps

Now that you understand state management, learn about:

- [Getters](./getters) - Computing derived values from state
- [Actions](./actions) - Modifying state and handling side effects
- [Plugins](./plugins) - Extending store functionality