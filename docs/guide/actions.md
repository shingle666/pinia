---
title: Actions - Pinia Guide
description: Learn how to use actions in Pinia stores to modify state and handle side effects. Understand synchronous and asynchronous actions, accessing other stores, and error handling.
keywords: Pinia, Vue.js, actions, state mutations, async actions, side effects, store actions
author: Pinia Team
generator: VitePress
og:title: Actions - Pinia Guide
og:description: Learn how to use actions in Pinia stores to modify state and handle side effects. Understand synchronous and asynchronous actions, accessing other stores, and error handling.
og:image: /og-image.svg
og:url: https://allfun.net/guide/actions
twitter:card: summary_large_image
twitter:title: Actions - Pinia Guide
twitter:description: Learn how to use actions in Pinia stores to modify state and handle side effects. Understand synchronous and asynchronous actions, accessing other stores, and error handling.
twitter:image: /og-image.svg
---

# Actions

Actions are the equivalent of [methods](https://vuejs.org/guide/essentials/methods.html) in components. They can be defined with the `actions` property in `defineStore()` and **they are perfect to define business logic**:

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++
    },
    randomizeCounter() {
      this.count = Math.round(100 * Math.random())
    },
  },
})
```

Like [getters](./getters.md), actions get access to the *whole store instance* through `this` with **full typing (and autocompletion ✨) support**. **Unlike getters, `actions` can be asynchronous**, you can `await` for any API call or even other actions inside of them! Here's an example using [Mande](https://github.com/posva/mande). Note that the library you use doesn't matter, as long as you get a `Promise`, you can even use the native `fetch` function (browser only):

```js
import { mande } from 'mande'

const api = mande('/api/users')

export const useUsers = defineStore('users', {
  state: () => ({
    userData: {},
    // ...
  }),

  actions: {
    async registerUser(login, password) {
      try {
        this.userData = await api.post({ login, password })
        showTooltip(`Welcome back ${this.userData.name}!`)
      } catch (error) {
        showTooltip(error)
        // let the form component display the error
        return error
      }
    },
  },
})
```

You are also completely free to set whatever arguments you want and return anything. When calling actions, everything will be automatically inferred!

Actions are invoked like methods:

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
// call the action as a method of the store
store.randomizeCounter()
</script>
```

## Accessing other stores

To use another store, you can directly *use it* inside of the *action*:

```js
import { useAuthStore } from './auth-store'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    preferences: {},
    // ...
  }),
  actions: {
    async fetchUserPreferences() {
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        this.preferences = await fetchPreferences()
      } else {
        throw new Error('User must be authenticated')
      }
    },
  },
})
```

## Usage with `setup()`

You can directly call any action as a method of the store:

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

store.randomizeCounter()
</script>
```

## Usage with the Options API

<VueSchoolLink
  href="https://vueschool.io/lessons/access-pinia-actions-in-the-options-api"
  title="Access Pinia Actions in the Options API"
/>

For the following examples, you can assume the following store was created:

```js
// Example File Path:
// ./src/stores/counter.js

import { defineStore } from 'pinia'

const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    }
  }
})
```

### With `mapActions()`

Actions can be mapped with the `mapActions()` helper:

```js
import { mapActions } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default {
  methods: {
    // gives access to this.increment() inside the component
    // same as calling from store.increment()
    ...mapActions(useCounterStore, ['increment'])
    // same as above but registers it as this.myOwnName()
    ...mapActions(useCounterStore, { myOwnName: 'increment' }),
  },
}
```

## Subscribing to actions

It is possible to observe actions and their outcome with `store.$onAction()`. The callback passed to it is executed before the action itself. `after` handles promises and allows you to execute a function after the action resolves. In a similar way, `onError` allows you to execute a function if the action throws or rejects. These are useful for tracking errors at runtime, similar to [this tip in the Vue docs](https://vuejs.org/guide/essentials/errorhandling.html#error-handling).

Here is an example that logs before running actions and after they resolve/reject.

```js
const unsubscribe = someStore.$onAction(
  ({
    name, // name of the action
    store, // store instance, same as `someStore`
    args, // array of parameters passed to the action
    after, // hook after the action returns or resolves
    onError, // hook if the action throws or rejects
  }) => {
    // a shared variable for this specific action call
    const startTime = Date.now()
    // this will trigger before an action on `store` is executed
    console.log(`Start "${name}" with params [${args.join(', ')}].`)

    // this will trigger if the action succeeds and after it has fully run.
    // it waits for any returned promised
    after((result) => {
      console.log(
        `Finished "${name}" after ${Date.now() - startTime}ms.\nResult: ${result}.`
      )
    })

    // this will trigger if the action throws or returns a promise that rejects
    onError((error) => {
      console.warn(
        `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
      )
    })
  }
)

// manually remove the listener
unsubscribe()
```

By default, *action subscriptions* are bound to the component where they are added (if the store is inside a component's `setup()`). Meaning, they will be automatically removed when the component is unmounted. If you want to keep them after the component is unmounted, pass `{ detached: true }` as the second argument to *detach* the *action subscription* from the current component:

```vue
<script setup>
const someStore = useSomeStore()

// this subscription will be kept after the component is unmounted
someStore.$onAction(callback, { detached: true })
</script>
```

## Error Handling

Actions can handle errors in multiple ways:

### Try/Catch in Actions

```js
export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials) {
      try {
        const response = await api.login(credentials)
        this.user = response.user
        this.token = response.token
        return { success: true }
      } catch (error) {
        console.error('Login failed:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
```

### Component-level Error Handling

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const handleLogin = async () => {
  try {
    await authStore.login(credentials)
    // handle success
  } catch (error) {
    // handle error
    console.error('Login error:', error)
  }
}
</script>
```

## Best Practices

### Keep Actions Pure When Possible

While actions can have side effects, try to keep them predictable:

```js
// ✅ Good: Clear, predictable action
actions: {
  updateUser(userData) {
    this.user = { ...this.user, ...userData }
  },
}

// ❌ Avoid: Hidden side effects
actions: {
  updateUser(userData) {
    this.user = { ...this.user, ...userData }
    // Hidden side effect - hard to test and debug
    localStorage.setItem('user', JSON.stringify(this.user))
    analytics.track('user_updated')
  },
}
```

### Use Descriptive Action Names

```js
// ✅ Good: Descriptive names
actions: {
  fetchUserProfile() { /* ... */ },
  updateUserEmail(email) { /* ... */ },
  deleteUserAccount() { /* ... */ },
}

// ❌ Avoid: Generic names
actions: {
  get() { /* ... */ },
  update(data) { /* ... */ },
  remove() { /* ... */ },
}
```

### Handle Loading States

```js
export const useDataStore = defineStore('data', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchItems() {
      this.loading = true
      this.error = null
      
      try {
        this.items = await api.getItems()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})
```

## Next Steps

Now that you understand actions, learn about:

- [Plugins](./plugins) - Extending store functionality
- [Testing](./testing) - Testing your stores and actions
- [Server-Side Rendering](./ssr) - Using Pinia in SSR environments