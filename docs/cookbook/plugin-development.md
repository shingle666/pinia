---
title: Plugin Development
description: Learn how to develop custom plugins for Pinia. A comprehensive guide to creating powerful and reusable Pinia plugins.
head:
  - [meta, { name: description, content: "Learn how to develop custom plugins for Pinia. A comprehensive guide to creating powerful and reusable Pinia plugins." }]
  - [meta, { name: keywords, content: "Pinia plugin development, Vue plugin, state management plugin, Pinia extensions" }]
  - [meta, { property: "og:title", content: "Plugin Development - Pinia" }]
  - [meta, { property: "og:description", content: "Learn how to develop custom plugins for Pinia. A comprehensive guide to creating powerful and reusable Pinia plugins." }]
---

# Plugin Development

This guide will teach you how to develop custom plugins for Pinia, from basic concepts to advanced patterns.

## What are Pinia Plugins?

Pinia plugins are functions that extend the functionality of stores. They can:

- Add properties to stores
- Add new methods to stores
- Wrap existing methods
- Change or extend store options
- Add global functionality

## Basic Plugin Structure

### Plugin Function Signature

```ts
type PiniaPlugin = (context: PiniaPluginContext) => 
  Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
```

### Plugin Context

```ts
interface PiniaPluginContext {
  pinia: Pinia          // Pinia instance
  app: App              // Vue app instance
  store: Store          // Current store instance
  options: StoreOptions // Store definition options
}
```

### Basic Plugin Example

```js
function myFirstPlugin({ store }) {
  // Add a property to every store
  return {
    hello: 'world'
  }
}

// Register the plugin
const pinia = createPinia()
pinia.use(myFirstPlugin)

// Now every store has a 'hello' property
const store = useMyStore()
console.log(store.hello) // 'world'
```

## Development Environment Setup

### Project Structure

```
my-pinia-plugin/
├── src/
│   ├── index.ts          # Main plugin file
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Utility functions
├── tests/
│   ├── plugin.test.ts    # Plugin tests
│   └── setup.ts          # Test setup
├── examples/
│   └── basic-usage.ts    # Usage examples
├── package.json
├── tsconfig.json
└── README.md
```

### Package.json Setup

```json
{
  "name": "pinia-my-plugin",
  "version": "1.0.0",
  "description": "A custom Pinia plugin",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "rollup -c",
    "test": "vitest",
    "dev": "rollup -c -w"
  },
  "peerDependencies": {
    "pinia": "^2.0.0",
    "vue": "^3.0.0"
  },
  "devDependencies": {
    "@rollup/plugin-typescript": "^11.0.0",
    "pinia": "^2.0.0",
    "rollup": "^3.0.0",
    "typescript": "^4.9.0",
    "vitest": "^0.28.0",
    "vue": "^3.2.0"
  }
}
```

## Plugin Development Patterns

### 1. Adding Properties

```js
function addPropertiesPlugin() {
  return {
    // Add reactive property
    timestamp: ref(Date.now()),
    
    // Add computed property
    formattedTime: computed(() => {
      return new Date(timestamp.value).toLocaleString()
    }),
    
    // Add method
    updateTimestamp() {
      timestamp.value = Date.now()
    }
  }
}
```

### 2. Wrapping Actions

```js
function actionWrapperPlugin({ store }) {
  // Store original actions
  const originalActions = {}
  
  Object.keys(store).forEach(key => {
    if (typeof store[key] === 'function') {
      originalActions[key] = store[key]
      
      // Wrap the action
      store[key] = function(...args) {
        console.log(`Action ${key} called with:`, args)
        
        const result = originalActions[key].apply(this, args)
        
        console.log(`Action ${key} completed with:`, result)
        
        return result
      }
    }
  })
}
```

### 3. State Persistence

```js
function createPersistencePlugin(options = {}) {
  return function persistencePlugin({ store, options: storeOptions }) {
    // Check if persistence is enabled for this store
    if (!storeOptions.persist) return
    
    const {
      key = store.$id,
      storage = localStorage,
      serializer = JSON,
      beforeRestore = (state) => state,
      afterRestore = (state) => state
    } = typeof storeOptions.persist === 'object' 
      ? storeOptions.persist 
      : {}
    
    // Restore state from storage
    try {
      const savedState = storage.getItem(key)
      if (savedState) {
        const parsed = serializer.parse(savedState)
        const restored = beforeRestore(parsed)
        store.$patch(restored)
        afterRestore(store.$state)
      }
    } catch (error) {
      console.error('Failed to restore state:', error)
    }
    
    // Save state on changes
    store.$subscribe((mutation, state) => {
      try {
        const serialized = serializer.stringify(state)
        storage.setItem(key, serialized)
      } catch (error) {
        console.error('Failed to persist state:', error)
      }
    })
  }
}
```

### 4. Validation Plugin

```js
function createValidationPlugin() {
  return function validationPlugin({ store, options }) {
    // Add validation schema if defined
    if (!options.validation) return
    
    const { schema, onError = console.error } = options.validation
    
    // Validate initial state
    validateState(store.$state, schema, onError)
    
    // Validate on state changes
    store.$subscribe((mutation, state) => {
      validateState(state, schema, onError)
    })
    
    return {
      $validate() {
        return validateState(store.$state, schema, onError)
      }
    }
  }
}

function validateState(state, schema, onError) {
  try {
    // Simple validation example
    for (const [key, validator] of Object.entries(schema)) {
      if (!validator(state[key])) {
        throw new Error(`Validation failed for ${key}`)
      }
    }
    return true
  } catch (error) {
    onError(error)
    return false
  }
}
```

### 5. Async Actions Plugin

```js
function createAsyncActionsPlugin() {
  return function asyncActionsPlugin({ store }) {
    const loadingStates = reactive({})
    const errors = reactive({})
    
    // Wrap async actions
    Object.keys(store).forEach(key => {
      const action = store[key]
      if (typeof action === 'function') {
        store[key] = async function(...args) {
          loadingStates[key] = true
          errors[key] = null
          
          try {
            const result = await action.apply(this, args)
            return result
          } catch (error) {
            errors[key] = error
            throw error
          } finally {
            loadingStates[key] = false
          }
        }
      }
    })
    
    return {
      $loading: readonly(loadingStates),
      $errors: readonly(errors),
      $isLoading: (actionName) => !!loadingStates[actionName],
      $getError: (actionName) => errors[actionName],
      $clearError: (actionName) => {
        errors[actionName] = null
      }
    }
  }
}
```

## Advanced Plugin Techniques

### Plugin Composition

```js
function composePlugins(...plugins) {
  return function composedPlugin(context) {
    const results = plugins.map(plugin => plugin(context)).filter(Boolean)
    return Object.assign({}, ...results)
  }
}

// Usage
const myPlugin = composePlugins(
  persistencePlugin,
  validationPlugin,
  asyncActionsPlugin
)

pinia.use(myPlugin)
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

// Only apply to specific stores
const userStorePlugin = createConditionalPlugin(
  ({ store }) => store.$id === 'user',
  userSpecificPlugin
)

// Only apply in development
const devPlugin = createConditionalPlugin(
  () => process.env.NODE_ENV === 'development',
  debugPlugin
)
```

### Plugin with Options

```js
function createConfigurablePlugin(defaultOptions = {}) {
  return function configurablePlugin(userOptions = {}) {
    const options = { ...defaultOptions, ...userOptions }
    
    return function plugin({ store }) {
      // Use merged options
      if (options.enableLogging) {
        store.$onAction(({ name, args }) => {
          console.log(`Action ${name} called:`, args)
        })
      }
      
      if (options.enablePersistence) {
        // Add persistence logic
      }
      
      return {
        $options: options
      }
    }
  }
}

// Usage
const myPlugin = createConfigurablePlugin({
  enableLogging: true,
  enablePersistence: false
})

pinia.use(myPlugin({
  enablePersistence: true // Override default
}))
```

## TypeScript Support

### Plugin Type Definitions

```ts
// types.ts
import { PiniaPluginContext } from 'pinia'

export interface MyPluginOptions {
  enabled?: boolean
  prefix?: string
  storage?: Storage
}

export interface MyPluginProperties {
  $myMethod: () => void
  $myProperty: string
}

export type MyPlugin = (options?: MyPluginOptions) => 
  (context: PiniaPluginContext) => MyPluginProperties
```

### Module Declaration

```ts
// Extend Pinia types
declare module 'pinia' {
  export interface PiniaCustomProperties {
    $myMethod: () => void
    $myProperty: string
  }
}
```

### Plugin Implementation

```ts
// index.ts
import { PiniaPluginContext } from 'pinia'
import { MyPlugin, MyPluginOptions, MyPluginProperties } from './types'

export const createMyPlugin: MyPlugin = (options = {}) => {
  return ({ store }: PiniaPluginContext): MyPluginProperties => {
    return {
      $myMethod() {
        console.log('Method called')
      },
      $myProperty: options.prefix || 'default'
    }
  }
}

export * from './types'
```

## Testing Plugins

### Test Setup

```ts
// tests/setup.ts
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

beforeEach(() => {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  setActivePinia(pinia)
})
```

### Plugin Tests

```ts
// tests/plugin.test.ts
import { describe, it, expect } from 'vitest'
import { defineStore } from 'pinia'
import { createMyPlugin } from '../src'

describe('MyPlugin', () => {
  it('should add properties to store', () => {
    const pinia = createPinia()
    pinia.use(createMyPlugin())
    
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 })
    })
    
    const store = useTestStore()
    
    expect(store.$myMethod).toBeDefined()
    expect(store.$myProperty).toBe('default')
  })
  
  it('should work with custom options', () => {
    const pinia = createPinia()
    pinia.use(createMyPlugin({ prefix: 'custom' }))
    
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 })
    })
    
    const store = useTestStore()
    
    expect(store.$myProperty).toBe('custom')
  })
})
```

### Integration Tests

```ts
// tests/integration.test.ts
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMyPlugin } from '../src'
import TestComponent from './TestComponent.vue'

it('should work in Vue components', () => {
  const pinia = createPinia()
  pinia.use(createMyPlugin())
  
  const wrapper = mount(TestComponent, {
    global: {
      plugins: [pinia]
    }
  })
  
  // Test component behavior with plugin
  expect(wrapper.text()).toContain('Plugin loaded')
})
```

## Publishing Your Plugin

### Build Configuration

```js
// rollup.config.js
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named'
    },
    {
      file: 'dist/index.esm.js',
      format: 'es'
    }
  ],
  plugins: [typescript()],
  external: ['pinia', 'vue']
}
```

### Documentation

```markdown
# My Pinia Plugin

## Installation

```bash
npm install pinia-my-plugin
```

## Usage

```js
import { createPinia } from 'pinia'
import { createMyPlugin } from 'pinia-my-plugin'

const pinia = createPinia()
pinia.use(createMyPlugin({
  // options
}))
```

## API

### Options

- `enabled` (boolean): Enable/disable plugin
- `prefix` (string): Prefix for properties

### Added Properties

- `$myMethod()`: Custom method
- `$myProperty`: Custom property
```

### Publishing Checklist

- [ ] Tests pass
- [ ] TypeScript definitions included
- [ ] Documentation complete
- [ ] Examples provided
- [ ] Peer dependencies specified
- [ ] Build artifacts generated
- [ ] Version bumped
- [ ] Changelog updated

## Best Practices

### 1. Naming Conventions

```js
// Use $ prefix for plugin properties
return {
  $myMethod() {},     // ✅ Good
  myMethod() {},      // ❌ May conflict with user code
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
  // Debounce expensive operations
  const debouncedSave = debounce(() => {
    // Expensive operation
  }, 1000)
  
  store.$subscribe(() => {
    debouncedSave()
  })
  
  // Use WeakMap for store-specific data
  const storeData = new WeakMap()
  storeData.set(store, { /* data */ })
}
```

### 4. Memory Management

```js
function memoryAwarePlugin({ store }) {
  const cleanup = []
  
  // Set up subscriptions
  const unsubscribe = store.$subscribe(() => {})
  cleanup.push(unsubscribe)
  
  const interval = setInterval(() => {}, 1000)
  cleanup.push(() => clearInterval(interval))
  
  // Clean up when store is disposed
  store.$dispose(() => {
    cleanup.forEach(fn => fn())
  })
}
```

### 5. Backward Compatibility

```js
function compatiblePlugin({ store, options }) {
  // Check Pinia version
  const piniaVersion = store.$pinia.version || '2.0.0'
  
  if (semver.gte(piniaVersion, '2.1.0')) {
    // Use new features
  } else {
    // Fallback for older versions
  }
}
```

## Common Patterns

### Plugin Registry

```js
class PluginRegistry {
  constructor() {
    this.plugins = new Map()
  }
  
  register(name, plugin) {
    this.plugins.set(name, plugin)
  }
  
  get(name) {
    return this.plugins.get(name)
  }
  
  createComposed(...names) {
    const plugins = names.map(name => this.get(name))
    return composePlugins(...plugins)
  }
}

const registry = new PluginRegistry()
registry.register('persistence', persistencePlugin)
registry.register('validation', validationPlugin)

const myPlugin = registry.createComposed('persistence', 'validation')
```

### Plugin Middleware

```js
function createMiddleware() {
  const middlewares = []
  
  return {
    use(middleware) {
      middlewares.push(middleware)
    },
    
    createPlugin() {
      return function middlewarePlugin(context) {
        let result = {}
        
        for (const middleware of middlewares) {
          const middlewareResult = middleware(context, result)
          if (middlewareResult) {
            result = { ...result, ...middlewareResult }
          }
        }
        
        return result
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Plugin not working**: Check if plugin is registered before store creation
2. **TypeScript errors**: Ensure module declaration is included
3. **Performance issues**: Use debouncing and avoid expensive operations in subscriptions
4. **Memory leaks**: Always clean up subscriptions and intervals

### Debugging

```js
function debugPlugin({ store }) {
  console.log('Plugin applied to store:', store.$id)
  console.log('Store state:', store.$state)
  console.log('Store options:', store.$options)
  
  return {
    $debug: {
      store,
      state: store.$state,
      options: store.$options
    }
  }
}
```

## Related Resources

- [Plugin API Reference](../api/plugins.md)
- [Official Plugins](../ecosystem/plugins.md)
- [TypeScript Guide](../guide/typescript.md)