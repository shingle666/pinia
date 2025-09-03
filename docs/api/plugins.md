---
title: Plugins API Reference
description: Complete API reference for Pinia plugin system. Learn how to develop and use Pinia plugins.
head:
  - [meta, { name: description, content: "Complete API reference for Pinia plugin system. Learn how to develop and use Pinia plugins." }]
  - [meta, { name: keywords, content: "Pinia plugins, Plugin API, Vue state management plugins, Pinia extensions" }]
  - [meta, { property: "og:title", content: "Plugins API Reference - Pinia" }]
  - [meta, { property: "og:description", content: "Complete API reference for Pinia plugin system. Learn how to develop and use Pinia plugins." }]
---

# Plugins API Reference

This section provides a complete API reference for the Pinia plugin system.

## Core Plugin API

### pinia.use()

Register a plugin to the Pinia instance.

```ts
function use(plugin: PiniaPlugin): Pinia
```

#### Parameters

- **plugin**: `PiniaPlugin` - The plugin function to register

#### Returns

- **Type**: `Pinia`
- **Description**: The Pinia instance (supports method chaining)

#### Example

```js
import { createPinia } from 'pinia'
import myPlugin from './my-plugin'

const pinia = createPinia()
pinia.use(myPlugin)

// Method chaining
pinia
  .use(plugin1)
  .use(plugin2)
  .use(plugin3)
```

## Plugin Type Definitions

### PiniaPlugin

Type definition for plugin functions.

```ts
type PiniaPlugin = (context: PiniaPluginContext) => 
  Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
```

#### Parameters

- **context**: `PiniaPluginContext` - Plugin context object

#### Returns

- **Type**: `Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void`
- **Description**: Properties to add to the store, or void

### PiniaPluginContext

Plugin context interface.

```ts
interface PiniaPluginContext<
  Id extends string = string,
  S extends StateTree = StateTree,
  G extends _GettersTree<S> = _GettersTree<S>,
  A extends _ActionsTree = _ActionsTree
> {
  pinia: Pinia
  app: App
  store: Store<Id, S, G, A>
  options: DefineStoreOptionsInPlugin<Id, S, G, A>
}
```

#### Properties

- **pinia**: `Pinia` - Current Pinia instance
- **app**: `App` - Vue application instance
- **store**: `Store<Id, S, G, A>` - Current store instance
- **options**: `DefineStoreOptionsInPlugin<Id, S, G, A>` - Store definition options

## Plugin Context Properties

### context.pinia

The current Pinia instance.

```ts
const pinia: Pinia
```

#### Example

```js
function myPlugin({ pinia }) {
  // Access Pinia instance
  console.log('Pinia instance:', pinia)
  
  // Access global state
  console.log('Global state:', pinia.state.value)
  
  // Access all stores
  console.log('All stores:', pinia._s)
}
```

### context.app

Vue application instance.

```ts
const app: App
```

#### Example

```js
function myPlugin({ app }) {
  // Access Vue app instance
  console.log('Vue app:', app)
  
  // Access app config
  console.log('App config:', app.config)
  
  // Register global components
  app.component('MyComponent', MyComponent)
}
```

### context.store

Current store instance.

```ts
const store: Store<Id, S, G, A>
```

#### Example

```js
function myPlugin({ store }) {
  // Access store properties
  console.log('Store ID:', store.$id)
  console.log('Store state:', store.$state)
  
  // Listen to state changes
  store.$subscribe((mutation, state) => {
    console.log('State changed:', mutation, state)
  })
  
  // Listen to action execution
  store.$onAction((action) => {
    console.log('Action executed:', action)
  })
}
```

### context.options

Store definition options.

```ts
const options: DefineStoreOptionsInPlugin<Id, S, G, A>
```

#### Example

```js
function myPlugin({ options }) {
  // Access store definition options
  console.log('Store ID:', options.id)
  console.log('State function:', options.state)
  console.log('Getters:', options.getters)
  console.log('Actions:', options.actions)
  
  // Check custom options
  if (options.persist) {
    console.log('Persistence enabled:', options.persist)
  }
}
```

## Plugin Return Values

### Adding Properties to Store

Plugins can return objects to add properties to stores.

```js
function addPropertiesPlugin() {
  return {
    // Add reactive property
    hello: ref('world'),
    
    // Add computed property
    doubled: computed(() => store.count * 2),
    
    // Add method
    reset() {
      store.$reset()
    },
    
    // Add async method
    async fetchData() {
      const data = await api.getData()
      store.data = data
    }
  }
}
```

### Adding State Properties

```js
function addStatePlugin({ store }) {
  return {
    // Add to state
    $state: {
      createdAt: new Date(),
      version: '1.0.0'
    }
  }
}
```

## Common Plugin Patterns

### Logger Plugin

```js
function createLoggerPlugin(options = {}) {
  return function loggerPlugin({ store }) {
    const { logActions = true, logMutations = true } = options
    
    if (logActions) {
      store.$onAction(({ name, args, after, onError }) => {
        console.log(`🚀 Action "${name}" started`, args)
        
        after((result) => {
          console.log(`✅ Action "${name}" completed`, result)
        })
        
        onError((error) => {
          console.error(`❌ Action "${name}" failed`, error)
        })
      })
    }
    
    if (logMutations) {
      store.$subscribe((mutation, state) => {
        console.log(`🔄 State changed:`, mutation)
        console.log(`📊 New state:`, state)
      })
    }
  }
}

// Usage
pinia.use(createLoggerPlugin({
  logActions: true,
  logMutations: false
}))
```

### Persistence Plugin

```js
function createPersistedStatePlugin(options = {}) {
  return function persistedStatePlugin({ store, options: storeOptions }) {
    // Check if persistence is enabled
    if (!storeOptions.persist) return
    
    const {
      key = store.$id,
      storage = localStorage,
      paths = null
    } = typeof storeOptions.persist === 'object' 
      ? storeOptions.persist 
      : {}
    
    // Restore state
    const savedState = storage.getItem(key)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (paths) {
          // Only restore specified paths
          paths.forEach(path => {
            if (parsed[path] !== undefined) {
              store.$state[path] = parsed[path]
            }
          })
        } else {
          // Restore entire state
          store.$patch(parsed)
        }
      } catch (error) {
        console.error('Failed to restore state:', error)
      }
    }
    
    // Listen to state changes and save
    store.$subscribe((mutation, state) => {
      try {
        const toSave = paths 
          ? paths.reduce((acc, path) => {
              acc[path] = state[path]
              return acc
            }, {})
          : state
        
        storage.setItem(key, JSON.stringify(toSave))
      } catch (error) {
        console.error('Failed to save state:', error)
      }
    })
  }
}

// Usage
pinia.use(createPersistedStatePlugin())
```

### Reset Plugin

```js
function resetPlugin({ store }) {
  const initialState = JSON.parse(JSON.stringify(store.$state))
  
  return {
    $reset() {
      store.$patch(initialState)
    }
  }
}

// Usage
pinia.use(resetPlugin)
```

### Debug Plugin

```js
function createDebugPlugin(options = {}) {
  return function debugPlugin({ store }) {
    if (process.env.NODE_ENV !== 'development') return
    
    const { 
      logLevel = 'info',
      enableTimeTravel = true,
      maxHistorySize = 50 
    } = options
    
    // History tracking
    const history = []
    
    // Track state changes
    store.$subscribe((mutation, state) => {
      const entry = {
        timestamp: Date.now(),
        mutation,
        state: JSON.parse(JSON.stringify(state))
      }
      
      history.push(entry)
      
      // Limit history size
      if (history.length > maxHistorySize) {
        history.shift()
      }
      
      if (logLevel === 'verbose') {
        console.log('🔍 Debug info:', entry)
      }
    })
    
    return {
      // Time travel
      $timeTravel: enableTimeTravel ? (index) => {
        if (history[index]) {
          store.$patch(history[index].state)
        }
      } : undefined,
      
      // Get history
      $getHistory: () => [...history],
      
      // Clear history
      $clearHistory: () => {
        history.length = 0
      }
    }
  }
}

// Usage
pinia.use(createDebugPlugin({
  logLevel: 'verbose',
  enableTimeTravel: true
}))
```

## Advanced Plugin Features

### Plugin Communication

```js
// Event bus plugin
function createEventBusPlugin() {
  const eventBus = new EventTarget()
  
  return function eventBusPlugin({ store }) {
    return {
      $emit(event, data) {
        eventBus.dispatchEvent(new CustomEvent(event, { detail: data }))
      },
      
      $on(event, handler) {
        eventBus.addEventListener(event, handler)
        return () => eventBus.removeEventListener(event, handler)
      },
      
      $off(event, handler) {
        eventBus.removeEventListener(event, handler)
      }
    }
  }
}

// Usage
pinia.use(createEventBusPlugin())

// In store
const store = useMyStore()
store.$emit('user-updated', { id: 1, name: 'John' })
store.$on('user-updated', (event) => {
  console.log('User updated:', event.detail)
})
```

### Conditional Plugins

```js
function createConditionalPlugin(condition, plugin) {
  return function conditionalPlugin(context) {
    if (condition(context)) {
      return plugin(context)
    }
  }
}

// Development-only plugin
const devOnlyPlugin = createConditionalPlugin(
  () => process.env.NODE_ENV === 'development',
  debugPlugin
)

pinia.use(devOnlyPlugin)

// Store-specific plugin
const userStoreOnlyPlugin = createConditionalPlugin(
  ({ store }) => store.$id === 'user',
  userSpecificPlugin
)

pinia.use(userStoreOnlyPlugin)
```

### Plugin Composition

```js
function composePlugins(...plugins) {
  return function composedPlugin(context) {
    const results = plugins.map(plugin => plugin(context)).filter(Boolean)
    
    // Merge all plugin return values
    return Object.assign({}, ...results)
  }
}

// Compose multiple plugins
const combinedPlugin = composePlugins(
  loggerPlugin,
  persistedStatePlugin,
  resetPlugin
)

pinia.use(combinedPlugin)
```

## TypeScript Support

### Plugin Type Definitions

```ts
import { PiniaPluginContext, Store } from 'pinia'

// Define plugin options type
interface MyPluginOptions {
  enabled?: boolean
  prefix?: string
}

// Define plugin properties type
interface MyPluginProperties {
  $myMethod: () => void
  $myProperty: string
}

// Plugin function type
type MyPlugin = (options?: MyPluginOptions) => 
  (context: PiniaPluginContext) => MyPluginProperties

// Implement plugin
const createMyPlugin: MyPlugin = (options = {}) => {
  return ({ store }) => {
    return {
      $myMethod() {
        console.log('My method called')
      },
      $myProperty: options.prefix || 'default'
    }
  }
}
```

### Extending Store Types

```ts
// Module declaration
declare module 'pinia' {
  export interface PiniaCustomProperties {
    $myMethod: () => void
    $myProperty: string
  }
  
  export interface PiniaCustomStateProperties {
    createdAt: Date
  }
}

// Now TypeScript knows these properties exist
const store = useMyStore()
store.$myMethod() // ✅ Type safe
store.$myProperty // ✅ Type safe
```

## Plugin Best Practices

### 1. Naming Conventions

```js
// Use $ prefix to avoid conflicts with user properties
function myPlugin() {
  return {
    $myMethod() {}, // ✅ Good
    myMethod() {},  // ❌ May conflict
  }
}
```

### 2. Error Handling

```js
function safePlugin({ store }) {
  try {
    // Plugin logic
    return {
      $safeMethod() {
        try {
          // Method implementation
        } catch (error) {
          console.error('Plugin method failed:', error)
        }
      }
    }
  } catch (error) {
    console.error('Plugin initialization failed:', error)
    return {}
  }
}
```

### 3. Performance Considerations

```js
function performantPlugin({ store }) {
  // Avoid expensive operations on every state change
  const debouncedSave = debounce(() => {
    // Expensive save operation
  }, 1000)
  
  store.$subscribe(() => {
    debouncedSave()
  })
}
```

### 4. Resource Cleanup

```js
function resourcePlugin({ store }) {
  const interval = setInterval(() => {
    // Periodic task
  }, 5000)
  
  // Cleanup when store is disposed
  store.$dispose(() => {
    clearInterval(interval)
  })
}
```

## Related Links

- [Plugins Guide](../guide/plugins.md)
- [Plugin Development Tutorial](../cookbook/plugin-development.md)
- [Official Plugins List](../ecosystem/plugins.md)