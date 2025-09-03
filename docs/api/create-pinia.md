---
title: createPinia() - Pinia API
description: Complete API reference for createPinia function. Learn how to create and configure Pinia instances.
keywords: Pinia, Vue.js, createPinia, API reference, configuration
author: Pinia Team
generator: VitePress
og:title: createPinia() - Pinia API
og:description: Complete API reference for createPinia function. Learn how to create and configure Pinia instances.
og:image: /og-image.svg
og:url: https://allfun.net/api/create-pinia
twitter:card: summary_large_image
twitter:title: createPinia() - Pinia API
twitter:description: Complete API reference for createPinia function. Learn how to create and configure Pinia instances.
twitter:image: /og-image.svg
---

# createPinia()

Creates a new Pinia instance that can be used by the application.

## Signature

```ts
function createPinia(): Pinia
```

## Returns

A new Pinia instance with the following properties and methods:

- `install`: Vue plugin install function
- `use()`: Method to add plugins
- `state`: Reactive object containing all store states
- Internal properties for store management

## Basic Usage

### Vue 3

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### Vue 2

```js
import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import App from './App.vue'

Vue.use(PiniaVuePlugin)

const pinia = createPinia()

new Vue({
  el: '#app',
  pinia,
  render: h => h(App)
})
```

## Configuration

### Adding Plugins

Plugins can be added to customize Pinia behavior:

```js
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const pinia = createPinia()

// Add persistence plugin
pinia.use(createPersistedState({
  storage: sessionStorage,
  key: id => `pinia-${id}`
}))

// Add custom plugin
pinia.use(({ store }) => {
  store.$router = router
  store.$api = api
})
```

### Development Tools

```js
import { createPinia } from 'pinia'

const pinia = createPinia()

// Enable devtools in development
if (process.env.NODE_ENV === 'development') {
  pinia.use(({ store }) => {
    store._customProperties = new Set(['$router', '$api'])
  })
}
```

## Multiple Instances

You can create multiple Pinia instances for different parts of your application:

```js
import { createPinia } from 'pinia'

// Main application pinia
const mainPinia = createPinia()

// Admin panel pinia with different plugins
const adminPinia = createPinia()
adminPinia.use(adminPlugin)

// Use different instances
app.use(mainPinia)
adminApp.use(adminPinia)
```

## SSR (Server-Side Rendering)

### Creating SSR-Compatible Instance

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

### State Serialization

```js
// server.js
import { renderToString } from '@vue/server-renderer'

const { app, pinia } = createApp()

// Render app
const html = await renderToString(app)

// Serialize state
const state = JSON.stringify(pinia.state.value)

// Send to client
const fullHtml = `
  <div id="app">${html}</div>
  <script>
    window.__PINIA_STATE__ = ${state}
  </script>
`
```

### Client Hydration

```js
// client.js
import { createApp } from './main'

const { app, pinia } = createApp()

// Hydrate from server state
if (typeof window !== 'undefined' && window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.mount('#app')
```

## Testing

### Test Setup

```js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it } from 'vitest'

describe('Store Tests', () => {
  beforeEach(() => {
    // Create fresh pinia instance for each test
    const pinia = createPinia()
    setActivePinia(pinia)
  })
  
  it('should work', () => {
    const store = useMyStore()
    expect(store.count).toBe(0)
  })
})
```

### Mocking Plugins

```js
import { createPinia } from 'pinia'
import { vi } from 'vitest'

function createTestPinia() {
  const pinia = createPinia()
  
  // Mock external dependencies
  pinia.use(() => ({
    $api: {
      get: vi.fn(),
      post: vi.fn()
    },
    $router: {
      push: vi.fn(),
      replace: vi.fn()
    }
  }))
  
  return pinia
}
```

## Advanced Configuration

### Custom State Serialization

```js
import { createPinia } from 'pinia'
import { ref } from 'vue'

function createCustomPinia() {
  const pinia = createPinia()
  
  // Custom serialization for complex types
  pinia.use(({ store }) => {
    store.$serialize = () => {
      const state = { ...store.$state }
      // Custom serialization logic
      if (state.date instanceof Date) {
        state.date = state.date.toISOString()
      }
      return state
    }
    
    store.$deserialize = (data) => {
      // Custom deserialization logic
      if (typeof data.date === 'string') {
        data.date = new Date(data.date)
      }
      store.$patch(data)
    }
  })
  
  return pinia
}
```

### Performance Monitoring

```js
import { createPinia } from 'pinia'

function createMonitoredPinia() {
  const pinia = createPinia()
  
  pinia.use(({ store }) => {
    // Monitor action performance
    store.$onAction(({ name, after, onError }) => {
      const start = Date.now()
      
      after(() => {
        const duration = Date.now() - start
        console.log(`Action ${name} took ${duration}ms`)
      })
      
      onError((error) => {
        console.error(`Action ${name} failed:`, error)
      })
    })
    
    // Monitor state changes
    store.$subscribe((mutation, state) => {
      console.log('State changed:', mutation.type, mutation.payload)
    })
  })
  
  return pinia
}
```

## TypeScript

### Typing Custom Properties

```ts
import 'pinia'
import type { Router } from 'vue-router'
import type { AxiosInstance } from 'axios'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    $router: Router
    $api: AxiosInstance
  }
}

// Now TypeScript knows about custom properties
const pinia = createPinia()
pinia.use(({ store }) => {
  store.$router = router // ✅ Typed
  store.$api = api       // ✅ Typed
})
```

### Generic Pinia Factory

```ts
interface PiniaConfig {
  plugins?: PiniaPlugin[]
  devtools?: boolean
}

function createConfiguredPinia(config: PiniaConfig = {}): Pinia {
  const pinia = createPinia()
  
  // Add plugins
  config.plugins?.forEach(plugin => {
    pinia.use(plugin)
  })
  
  // Configure devtools
  if (config.devtools && process.env.NODE_ENV === 'development') {
    pinia.use(devtoolsPlugin)
  }
  
  return pinia
}
```

## Error Handling

### Global Error Handler

```js
import { createPinia } from 'pinia'

function createRobustPinia() {
  const pinia = createPinia()
  
  pinia.use(({ store }) => {
    // Global error handling
    store.$onAction(({ name, onError }) => {
      onError((error) => {
        console.error(`Store action ${name} failed:`, error)
        
        // Report to error tracking service
        errorTracker.captureException(error, {
          tags: {
            store: store.$id,
            action: name
          }
        })
      })
    })
  })
  
  return pinia
}
```

### Fallback State

```js
import { createPinia } from 'pinia'

function createFallbackPinia() {
  const pinia = createPinia()
  
  pinia.use(({ store, options }) => {
    // Add fallback state
    store.$fallback = () => {
      if (typeof options.state === 'function') {
        store.$patch(options.state())
      }
    }
    
    // Auto-fallback on critical errors
    store.$onAction(({ name, onError }) => {
      onError((error) => {
        if (error.critical) {
          store.$fallback()
        }
      })
    })
  })
  
  return pinia
}
```

## Best Practices

### 1. Single Instance per App

```js
// ✅ Good - One instance per app
const pinia = createPinia()
app.use(pinia)

// ❌ Avoid - Multiple instances without reason
const pinia1 = createPinia()
const pinia2 = createPinia()
```

### 2. Configure Before Use

```js
// ✅ Good - Configure before using
const pinia = createPinia()
pinia.use(persistencePlugin)
pinia.use(routerPlugin)
app.use(pinia)

// ❌ Avoid - Adding plugins after installation
app.use(pinia)
pinia.use(latePlugin) // May not affect existing stores
```

### 3. Environment-Specific Configuration

```js
// ✅ Good - Environment-aware setup
const pinia = createPinia()

if (process.env.NODE_ENV === 'development') {
  pinia.use(loggerPlugin)
  pinia.use(devtoolsPlugin)
}

if (process.env.NODE_ENV === 'production') {
  pinia.use(analyticsPlugin)
  pinia.use(errorReportingPlugin)
}
```

### 4. Plugin Order Matters

```js
// ✅ Good - Logical plugin order
const pinia = createPinia()
pinia.use(routerPlugin)      // Base functionality
pinia.use(persistencePlugin) // Depends on state
pinia.use(loggerPlugin)      // Should log everything
```

## Common Patterns

### Factory Pattern

```js
function createAppPinia() {
  const pinia = createPinia()
  
  // Standard plugins
  pinia.use(routerPlugin)
  pinia.use(persistencePlugin)
  
  // Environment-specific
  if (import.meta.env.DEV) {
    pinia.use(loggerPlugin)
  }
  
  return pinia
}

// Usage
const pinia = createAppPinia()
app.use(pinia)
```

### Lazy Plugin Loading

```js
async function createAsyncPinia() {
  const pinia = createPinia()
  
  // Load plugins dynamically
  if (shouldUsePersistence) {
    const { createPersistedState } = await import('pinia-plugin-persistedstate')
    pinia.use(createPersistedState())
  }
  
  return pinia
}
```

## See Also

- [Pinia Instance](./pinia-instance) - Pinia instance API
- [Plugins Guide](../guide/plugins) - Creating plugins
- [SSR Guide](../guide/ssr) - Server-side rendering
- [Testing Guide](../guide/testing) - Testing with Pinia