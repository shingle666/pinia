---
title: setActivePinia()
description: API reference for the setActivePinia() function in Pinia. Learn how to manually set the active Pinia instance.
head:
  - [meta, { name: description, content: "Complete API reference for setActivePinia() function. Learn how to manually set the active Pinia instance in different contexts." }]
  - [meta, { name: keywords, content: "setActivePinia, Pinia, API, active instance, Vue, state management" }]
  - [meta, { property: "og:title", content: "setActivePinia() - Pinia API Reference" }]
  - [meta, { property: "og:description", content: "Complete API reference for setActivePinia() function. Learn how to manually set the active Pinia instance in different contexts." }]
---

# setActivePinia()

The `setActivePinia()` function allows you to manually set the active Pinia instance. This is useful in specific scenarios where you need to control which Pinia instance is being used.

## Signature

```ts
function setActivePinia(pinia: Pinia | undefined): Pinia | undefined
```

## Parameters

- **pinia**: `Pinia | undefined` - The Pinia instance to set as active, or `undefined` to clear the active instance

## Returns

- **Type**: `Pinia | undefined`
- **Description**: The previously active Pinia instance, or `undefined` if there was none

## Basic Usage

### Setting an Active Instance

```js
import { createPinia, setActivePinia } from 'pinia'

const pinia = createPinia()
setActivePinia(pinia)

// Now this pinia instance is active
// Stores created after this will use this instance
```

### Getting the Previous Instance

```js
import { createPinia, setActivePinia } from 'pinia'

const pinia1 = createPinia()
const pinia2 = createPinia()

setActivePinia(pinia1)
const previousPinia = setActivePinia(pinia2)

console.log(previousPinia === pinia1) // true
```

## Common Use Cases

### 1. Testing Scenarios

In testing, you often need to create a fresh Pinia instance for each test:

```js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it } from 'vitest'

describe('Store Tests', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should work with fresh store', () => {
    const store = useMyStore()
    // Test your store...
  })
})
```

### 2. Server-Side Rendering (SSR)

In SSR contexts, you might need to set different Pinia instances for different requests:

```js
// server.js
import { createPinia, setActivePinia } from 'pinia'

app.use('*', (req, res, next) => {
  // Create a new Pinia instance for each request
  const pinia = createPinia()
  setActivePinia(pinia)
  
  // Store the instance in the request context
  req.pinia = pinia
  next()
})
```

### 3. Multiple App Instances

When working with multiple Vue app instances:

```js
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// First app
const app1 = createApp(App1)
const pinia1 = createPinia()
app1.use(pinia1)

// Second app with different Pinia instance
const app2 = createApp(App2)
const pinia2 = createPinia()
setActivePinia(pinia2)
app2.use(pinia2)
```

### 4. Plugin Development

When developing plugins that need to work with Pinia:

```js
function myPiniaPlugin(context) {
  // Save current active instance
  const previousPinia = setActivePinia(context.pinia)
  
  try {
    // Do plugin work with the specific Pinia instance
    // ...
  } finally {
    // Restore previous active instance
    setActivePinia(previousPinia)
  }
}
```

## Advanced Usage

### Temporary Instance Switching

```js
import { createPinia, setActivePinia, getActivePinia } from 'pinia'

function withPiniaInstance(pinia, callback) {
  const previousPinia = getActivePinia()
  setActivePinia(pinia)
  
  try {
    return callback()
  } finally {
    setActivePinia(previousPinia)
  }
}

// Usage
const tempPinia = createPinia()
const result = withPiniaInstance(tempPinia, () => {
  const store = useMyStore()
  return store.someComputation()
})
```

### Instance Isolation

```js
class PiniaManager {
  constructor() {
    this.instances = new Map()
  }
  
  createInstance(key) {
    const pinia = createPinia()
    this.instances.set(key, pinia)
    return pinia
  }
  
  useInstance(key) {
    const pinia = this.instances.get(key)
    if (pinia) {
      setActivePinia(pinia)
    }
    return pinia
  }
  
  destroyInstance(key) {
    this.instances.delete(key)
  }
}

const manager = new PiniaManager()
manager.createInstance('main')
manager.createInstance('admin')

// Switch to admin instance
manager.useInstance('admin')
const adminStore = useAdminStore()

// Switch to main instance
manager.useInstance('main')
const mainStore = useMainStore()
```

## Error Handling

### Checking for Active Instance

```js
import { getActivePinia, setActivePinia } from 'pinia'

function ensureActivePinia() {
  if (!getActivePinia()) {
    console.warn('No active Pinia instance found, creating one...')
    const pinia = createPinia()
    setActivePinia(pinia)
    return pinia
  }
  return getActivePinia()
}
```

### Safe Instance Setting

```js
function safeSetActivePinia(pinia) {
  try {
    return setActivePinia(pinia)
  } catch (error) {
    console.error('Failed to set active Pinia instance:', error)
    return undefined
  }
}
```

## TypeScript Usage

```ts
import { Pinia, createPinia, setActivePinia } from 'pinia'

function createAndSetPinia(): Pinia {
  const pinia: Pinia = createPinia()
  const previous: Pinia | undefined = setActivePinia(pinia)
  
  if (previous) {
    console.log('Replaced previous Pinia instance')
  }
  
  return pinia
}

// Type-safe instance manager
class TypedPiniaManager {
  private instances = new Map<string, Pinia>()
  
  createInstance(key: string): Pinia {
    const pinia = createPinia()
    this.instances.set(key, pinia)
    return pinia
  }
  
  setActive(key: string): Pinia | undefined {
    const pinia = this.instances.get(key)
    if (pinia) {
      return setActivePinia(pinia)
    }
    return undefined
  }
}
```

## Best Practices

### 1. Always Restore Previous Instance

When temporarily changing the active instance, always restore the previous one:

```js
// Good
const previous = setActivePinia(tempPinia)
try {
  // Do work with temp instance
} finally {
  setActivePinia(previous)
}

// Bad - doesn't restore
setActivePinia(tempPinia)
// Do work...
// Previous instance is lost
```

### 2. Use in Setup Functions

Prefer setting active Pinia in setup functions rather than during module loading:

```js
// Good
function setupApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const app = createApp(App)
  app.use(pinia)
  return app
}

// Avoid - sets during module load
const pinia = createPinia()
setActivePinia(pinia) // This runs immediately
```

### 3. Clear When No Longer Needed

```js
function cleanup() {
  // Clear the active instance when shutting down
  setActivePinia(undefined)
}
```

### 4. Document Instance Switching

```js
/**
 * Temporarily switches to the admin Pinia instance
 * for administrative operations
 */
function withAdminContext(callback) {
  const previous = setActivePinia(adminPinia)
  try {
    return callback()
  } finally {
    setActivePinia(previous)
  }
}
```

## Common Pitfalls

### 1. Forgetting to Restore

```js
// Wrong - previous instance is lost
setActivePinia(newPinia)
doSomething()

// Correct - restore previous instance
const previous = setActivePinia(newPinia)
try {
  doSomething()
} finally {
  setActivePinia(previous)
}
```

### 2. Setting During Module Load

```js
// Problematic - runs during import
const pinia = createPinia()
setActivePinia(pinia)

// Better - set when needed
export function initializePinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
```

### 3. Not Handling Undefined

```js
// Wrong - doesn't handle undefined
function switchInstance(pinia) {
  setActivePinia(pinia) // pinia might be undefined
}

// Correct - handle undefined case
function switchInstance(pinia) {
  if (pinia) {
    setActivePinia(pinia)
  } else {
    console.warn('Cannot set undefined Pinia instance')
  }
}
```

## Related Functions

- [`getActivePinia()`](./get-active-pinia.md) - Get the currently active Pinia instance
- [`createPinia()`](./create-pinia.md) - Create a new Pinia instance

## Related Links

- [Pinia Instance API](./pinia-instance.md)
- [Testing Guide](../guide/testing.md)
- [SSR Guide](../guide/ssr.md)
- [Plugins Guide](../guide/plugins.md)