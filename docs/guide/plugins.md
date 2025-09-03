---
title: Plugins - Pinia Guide
description: Learn how to extend Pinia stores with plugins. Understand plugin creation, store augmentation, and advanced plugin patterns for enhanced functionality.
keywords: Pinia, Vue.js, plugins, store extension, plugin development, store augmentation
author: Pinia Team
generator: VitePress
og:title: Plugins - Pinia Guide
og:description: Learn how to extend Pinia stores with plugins. Understand plugin creation, store augmentation, and advanced plugin patterns for enhanced functionality.
og:image: /og-image.svg
og:url: https://allfun.net/guide/plugins
twitter:card: summary_large_image
twitter:title: Plugins - Pinia Guide
twitter:description: Learn how to extend Pinia stores with plugins. Understand plugin creation, store augmentation, and advanced plugin patterns for enhanced functionality.
twitter:image: /og-image.svg
---

# Plugins

Pinia stores can be fully extended thanks to a low level API. Here is a list of things you can do:

- Add new properties to stores
- Add new options when defining stores
- Add new methods to stores
- Wrap existing methods
- Intercept actions and their outcome
- Implement side effects like [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- Apply **only** to specific stores

Plugins are added with `pinia.use()`. The simplest example is adding a static property to all stores by returning an object:

```js
import { createPinia } from 'pinia'

// add a property named `secret` to every store that is created
// after this plugin is installed
// this could be in a different file
function SecretPiniaPlugin() {
  return { secret: 'the cake is a lie' }
}

const pinia = createPinia()
// give the plugin to pinia
pinia.use(SecretPiniaPlugin)

// in another file
const store = useStore()
store.secret // 'the cake is a lie'
```

This is useful to add global objects like the router, modal, or toast managers.

## Introduction

A Pinia plugin is a function that optionally returns properties to be added to a store. It takes one optional argument, a *context*:

```js
export function myPiniaPlugin(context) {
  context.pinia // the pinia created with `createPinia()`
  context.app // the current app created with `createApp()` (Vue 3 only)
  context.store // the store the plugin is augmenting
  context.options // the options object defining the store passed to `defineStore()`
  // ...
}
```

This function is then passed to `pinia` with `pinia.use()`:

```js
pinia.use(myPiniaPlugin)
```

Plugins are only applied to stores created **after** `pinia.use()` is called. Otherwise, they won't be applied.

## Augmenting a Store

You can add properties to every store by simply returning an object of them in a plugin:

```js
pinia.use(() => ({ hello: 'world' }))
```

You can also set the property directly on the `store` but **if possible use the return version so they can be automatically tracked by devtools**:

```js
pinia.use(({ store }) => {
  store.hello = 'world'
})
```

Any property *returned* by a plugin will be automatically tracked by devtools so in order to make `hello` visible in devtools, make sure to add it to `store._customProperties` in dev mode only if you want to debug it in devtools:

```js
// from the example above
pinia.use(({ store }) => {
  store.hello = 'world'
  // make sure your bundler handle this. webpack and vite should do it by default
  if (process.env.NODE_ENV === 'development') {
    // add any keys you set on the store
    store._customProperties.add('hello')
  }
})
```

Note that every store is wrapped with [`reactive`](https://vuejs.org/api/reactivity-core.html#reactive), automatically unwrapping any Ref (`ref()`, `computed()`, etc) it contains:

```js
const sharedRef = ref('shared')
pinia.use(({ store }) => {
  // each store has its individual `hello` property
  store.hello = ref('secret')
  // it gets automatically unwrapped
  store.hello // 'secret'

  // all stores are sharing the value `shared` property
  store.shared = sharedRef
  store.shared // 'shared'
})
```

This is why you can access all computed properties without `.value` and why they are reactive.

### Adding new state

If you want to add new state properties to a store or properties that are meant to be used during hydration, **you have to add it in two places**:

- On the `store` so you can access it with `store.myState`
- On `store.$state` so it can be used in devtools and, **serialized during SSR**

On top of that, you will certainly have to use a `ref()` (or other reactive API) in order to share the value across different accesses:

```js
import { ref } from 'vue'

const globalSecret = ref('secret')
pinia.use(({ store }) => {
  // `secret` is shared among all stores
  store.$state.secret = globalSecret
  store.secret = globalSecret
  // it gets automatically unwrapped so you can access it directly
  store.secret // 'secret'

  const hasError = ref(false)
  // this is local to the store
  store.$state.hasError = hasError
  store.hasError = hasError

  // make sure your bundler handle this. webpack and vite should do it by default
  if (process.env.NODE_ENV === 'development') {
    // add any keys you set on the store
    store._customProperties.add('secret')
    store._customProperties.add('hasError')
  }
})
```

:::tip
Note that state changes or additions that happen in a plugin (including calling `store.$patch()`) happen before the store is active and therefore **do not trigger subscriptions**.
:::

### Adding new external properties

When adding external properties, class instances that come from other libraries, or simply things that are not reactive, you should wrap the object with `markRaw()` before passing it to pinia. Here is an example adding the router to every store:

```js
import { markRaw } from 'vue'
import { router } from './router'

pinia.use(({ store }) => {
  store.router = markRaw(router)
})
```

## Adding new options

It is possible to create new options when defining stores to later on consume them from plugins. For example, you could create a `debounce` option that allows you to debounce any action:

```js
defineStore('search', {
  actions: {
    searchContacts() {
      // ...
    },
  },

  // this will be read by a plugin later on
  debounce: {
    // debounce the action searchContacts by 300ms
    searchContacts: 300,
  },
})
```

The plugin can then read that option to wrap actions and replace the original ones:

```js
// use any debounce library
import { debounce } from 'lodash'

pinia.use(({ options, store }) => {
  if (options.debounce) {
    // we are overriding the actions with the debounced versions
    return Object.keys(options.debounce).reduce((debouncedActions, action) => {
      debouncedActions[action] = debounce(
        store[action],
        options.debounce[action]
      )
      return debouncedActions
    }, {})
  }
})
```

Note that custom options are passed as the 3rd argument when using the setup syntax:

```js
defineStore(
  'search',
  () => {
    // ...
  },
  {
    // this will be read by a plugin later on
    debounce: {
      // debounce the action searchContacts by 300ms
      searchContacts: 300,
    },
  }
)
```

## TypeScript

Everything shown above can be done with type support. If you are using TypeScript, you can use the `PiniaPluginContext` type. You can also type the plugin itself:

```ts
import { PiniaPluginContext } from 'pinia'

export function myPiniaPlugin(context: PiniaPluginContext) {
  // ...
}
```

### Typing new store properties

When adding new properties to stores, you should also extend the `PiniaCustomProperties` interface.

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    // by using a setter we can allow both strings and refs
    set hello(value: string | Ref<string>)
    get hello(): string

    // you can define simpler values too
    simpleNumber: number

    // type the router added by the plugin above (#adding-new-external-properties)
    router: Router
  }
}
```

It can then be written and read safely:

```ts
pinia.use(({ store }) => {
  store.hello = 'Hola'
  store.hello = ref('Hola')

  store.simpleNumber = Math.random()
  // @ts-expect-error: we haven't typed this correctly
  store.simpleNumber = ref(Math.random())
})
```

`PiniaCustomProperties` is a generic type that allows you to reference properties of a store. Imagine the following example where we copy over the initial options as `$options` (this would only work for option stores):

```ts
pinia.use(({ options }) => ({ $options: options }))
```

We can properly type this by using the 4 generic types of `PiniaCustomProperties`:

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties<Id, S, G, A> {
    $options: {
      id: Id
      state?: () => S
      getters?: G
      actions?: A
    }
  }
}
```

:::tip
When extending types in generics, they must be named **exactly as in the source code**. `Id` cannot be named `id` or `I`, and `S` cannot be named `State`. Here is what each letter stands for:

- S: State
- G: Getters
- A: Actions
- SS: Setup Store / Store
:::

### Typing new state

When adding new state properties (to both, the `store` and `store.$state`), you need to add the type to `PiniaCustomStateProperties` instead. Differently from `PiniaCustomProperties`, it only receives the State generic:

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomStateProperties<S> {
    hello: string
  }
}
```

### Typing new creation options

When creating new options for `defineStore()`, you should extend `DefineStoreOptionsBase`. Differently from `PiniaCustomProperties`, it only exposes two generics: the State and the Store type, allowing you to limit what can be defined. For example, the names of the actions:

```ts
import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    // allow defining a number of ms for any of the actions
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>
  }
}
```

:::tip
There is also a `StoreGetters` type to extract the getters from a Store type. You can also extend the options of _setup stores_ or _option stores_ **only** by extending the types `DefineStoreOptions` and `DefineSetupStoreOptions` respectively.
:::

## Common Plugin Patterns

### Local Storage Plugin

A common use case is persisting store state to localStorage:

```js
import { watch } from 'vue'

function createPersistedStatePlugin(options = {}) {
  return (context) => {
    const { store } = context
    const { persist = true } = options
    
    if (!persist) return
    
    const storageKey = `pinia-${store.$id}`
    
    // Restore state from localStorage
    const savedState = localStorage.getItem(storageKey)
    if (savedState) {
      store.$patch(JSON.parse(savedState))
    }
    
    // Watch for state changes and save to localStorage
    watch(
      () => store.$state,
      (state) => {
        localStorage.setItem(storageKey, JSON.stringify(state))
      },
      { deep: true }
    )
  }
}

// Usage
pinia.use(createPersistedStatePlugin())
```

### Logger Plugin

A plugin that logs all actions and state changes:

```js
function createLoggerPlugin() {
  return ({ store }) => {
    store.$onAction(({ name, args, after, onError }) => {
      console.log(`🚀 Action "${name}" called with:`, args)
      
      after((result) => {
        console.log(`✅ Action "${name}" finished with:`, result)
      })
      
      onError((error) => {
        console.error(`❌ Action "${name}" failed with:`, error)
      })
    })
    
    store.$subscribe((mutation, state) => {
      console.log(`📝 State changed:`, mutation)
    })
  }
}

// Usage
if (process.env.NODE_ENV === 'development') {
  pinia.use(createLoggerPlugin())
}
```

### Reset Plugin

A plugin that adds a `$reset` method to all stores:

```js
function createResetPlugin() {
  return ({ store }) => {
    const initialState = JSON.parse(JSON.stringify(store.$state))
    
    store.$reset = () => {
      store.$patch(initialState)
    }
  }
}

// Usage
pinia.use(createResetPlugin())
```

## Best Practices

### Plugin Organization

```js
// plugins/index.js
export { createPersistedStatePlugin } from './persisted-state'
export { createLoggerPlugin } from './logger'
export { createResetPlugin } from './reset'

// main.js
import { createPinia } from 'pinia'
import { 
  createPersistedStatePlugin, 
  createLoggerPlugin, 
  createResetPlugin 
} from './plugins'

const pinia = createPinia()

pinia.use(createPersistedStatePlugin())
pinia.use(createResetPlugin())

if (process.env.NODE_ENV === 'development') {
  pinia.use(createLoggerPlugin())
}
```

### Conditional Plugin Application

```js
function createConditionalPlugin(condition, plugin) {
  return (context) => {
    if (condition(context)) {
      return plugin(context)
    }
  }
}

// Apply plugin only to specific stores
pinia.use(
  createConditionalPlugin(
    ({ store }) => store.$id === 'user',
    createPersistedStatePlugin()
  )
)
```

### Plugin Composition

```js
function composePlugins(...plugins) {
  return (context) => {
    const results = plugins.map(plugin => plugin(context))
    return Object.assign({}, ...results.filter(Boolean))
  }
}

// Combine multiple plugins
pinia.use(
  composePlugins(
    createResetPlugin(),
    createLoggerPlugin(),
    createPersistedStatePlugin()
  )
)
```

## Next Steps

Now that you understand plugins, learn about:

- [Testing](./testing) - Testing your stores and plugins
- [Server-Side Rendering](./ssr) - Using Pinia with SSR
- [Migration Guide](./migration) - Migrating from Vuex to Pinia