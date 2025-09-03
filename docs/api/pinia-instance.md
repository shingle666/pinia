---
title: Pinia Instance - Pinia API
description: Complete API reference for the Pinia instance. Learn about Pinia configuration, plugins, and global methods.
keywords: Pinia, Vue.js, Pinia instance, API reference, createPinia, plugins
author: Pinia Team
generator: VitePress
og:title: Pinia Instance - Pinia API
og:description: Complete API reference for the Pinia instance. Learn about Pinia configuration, plugins, and global methods.
og:image: /og-image.svg
og:url: https://allfun.net/api/pinia-instance
twitter:card: summary_large_image
twitter:title: Pinia Instance - Pinia API
twitter:description: Complete API reference for the Pinia instance. Learn about Pinia configuration, plugins, and global methods.
twitter:image: /og-image.svg
---

# Pinia Instance

The Pinia instance is the central hub that manages all stores in your application. It's created with `createPinia()` and installed as a Vue plugin.

## Creating a Pinia Instance

### `createPinia()`

Creates a new Pinia instance.

#### Signature

```ts
function createPinia(): Pinia
```

#### Example

```js
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const app = createApp({})
const pinia = createPinia()

app.use(pinia)
```

## Properties

### `install`

- **Type:** `(app: App, ...options: any[]) => any`

Vue plugin install function. Automatically called when using `app.use(pinia)`.

### `state`

- **Type:** `Ref<Record<string, StateTree>>`
- **Read only**

Reactive object containing the state of all stores. Mainly used internally and for devtools.

```js
const pinia = createPinia()
console.log(pinia.state.value) // { user: { ... }, cart: { ... } }
```

## Methods

### `use()`

Adds a plugin to the Pinia instance. Plugins are applied to all stores created after the plugin is added.

#### Signature

```ts
use(plugin: PiniaPlugin): Pinia
```

#### Parameters

- **plugin**: A function that receives a context object and optionally returns properties to add to stores

#### Example

```js
import { createPinia } from 'pinia'

const pinia = createPinia()

// Add a simple plugin
pinia.use(({ store }) => {
  store.hello = 'world'
})

// Add a plugin with options
function createLoggerPlugin(options = {}) {
  return ({ store }) => {
    if (options.enabled) {
      store.$onAction(({ name, args }) => {
        console.log(`Action ${name} called with:`, args)
      })
    }
  }
}

pinia.use(createLoggerPlugin({ enabled: true }))
```

### `_s` (Internal)

- **Type:** `Map<string, StoreGeneric>`
- **Internal use only**

Map containing all registered stores. Used internally by Pinia.

### `_e` (Internal)

- **Type:** `EffectScope`
- **Internal use only**

Effect scope for the Pinia instance. Used internally for cleanup.

## Plugin System

### Plugin Context

When creating a plugin, you receive a context object with the following properties:

```ts
interface PiniaPluginContext {
  pinia: Pinia
  app: App
  store: Store
  options: DefineStoreOptions
}
```

#### Properties

- **pinia**: The Pinia instance
- **app**: The Vue application instance (Vue 3 only)
- **store**: The store being augmented
- **options**: The options object passed to `defineStore()`

### Plugin Examples

#### Simple Property Plugin

```js
function addSecretPlugin() {
  return { secret: 'the cake is a lie' }
}

pinia.use(addSecretPlugin)
```

#### Router Plugin

```js
import { markRaw } from 'vue'
import { router } from './router'

function routerPlugin({ store }) {
  store.router = markRaw(router)
}

pinia.use(routerPlugin)
```

#### Persistence Plugin

```js
import { watch } from 'vue'

function persistencePlugin({ store }) {
  const storageKey = `pinia-${store.$id}`
  
  // Restore from localStorage
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }
  
  // Save to localStorage on changes
  watch(
    () => store.$state,
    (state) => {
      localStorage.setItem(storageKey, JSON.stringify(state))
    },
    { deep: true }
  )
}

pinia.use(persistencePlugin)
```

## TypeScript

### Typing Plugins

```ts
import type { PiniaPluginContext } from 'pinia'

function myPlugin(context: PiniaPluginContext) {
  // Plugin implementation
}
```

### Extending Store Properties

When adding properties to stores via plugins, extend the `PiniaCustomProperties` interface:

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    router: Router
    secret: string
  }
}
```

### Extending Store State

For state properties, extend `PiniaCustomStateProperties`:

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomStateProperties<S> {
    lastUpdated: Date
  }
}
```

## SSR Support

### Server-Side

```js
// server.js
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp({})
  const pinia = createPinia()
  
  app.use(pinia)
  
  return { app, pinia }
}
```

### Client-Side Hydration

```js
// client.js
import { createApp } from './main'

const { app, pinia } = createApp()

// Hydrate state from server
if (window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.mount('#app')
```

## Testing

### Creating Test Instances

```js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
})
```

### Mocking Plugins

```js
import { createPinia } from 'pinia'

const pinia = createPinia()

// Mock plugin for testing
pinia.use(() => ({
  $api: {
    get: vi.fn(),
    post: vi.fn()
  }
}))
```

## Best Practices

### Plugin Order

```js
const pinia = createPinia()

// Add plugins in order of dependency
pinia.use(routerPlugin) // Base functionality
pinia.use(persistencePlugin) // Depends on state
pinia.use(loggerPlugin) // Should be last for complete logging
```

### Conditional Plugins

```js
const pinia = createPinia()

// Development-only plugins
if (process.env.NODE_ENV === 'development') {
  pinia.use(loggerPlugin)
  pinia.use(devtoolsPlugin)
}

// Production-only plugins
if (process.env.NODE_ENV === 'production') {
  pinia.use(analyticsPlugin)
}
```

### Plugin Configuration

```js
// Create configurable plugins
function createApiPlugin(baseURL) {
  return ({ store }) => {
    store.$api = createApiClient(baseURL)
  }
}

const pinia = createPinia()
pinia.use(createApiPlugin('https://api.example.com'))
```

## Lifecycle

### Installation

1. `createPinia()` creates a new instance
2. `app.use(pinia)` installs the plugin
3. Pinia sets up global properties and provides the instance

### Store Creation

1. `defineStore()` registers store definition
2. First call to `useStore()` creates the store instance
3. Plugins are applied to the new store
4. Store is added to the Pinia instance

### Cleanup

1. When the app unmounts, Pinia cleans up all stores
2. Effect scopes are disposed
3. Subscriptions are removed

## See Also

- [createPinia()](./create-pinia) - Creating Pinia instances
- [Store Instance](./store-instance) - Store instance API
- [Utilities](./utilities) - Utility functions
- [Plugins Guide](../guide/plugins) - Plugin development guide