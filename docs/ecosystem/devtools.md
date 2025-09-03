---
title: DevTools
description: Comprehensive guide to debugging and developing with Pinia using Vue DevTools and other development tools.
head:
  - [meta, { name: description, content: "Comprehensive guide to debugging and developing with Pinia using Vue DevTools and other development tools." }]
  - [meta, { name: keywords, content: "Pinia DevTools, Vue DevTools, debugging, development tools, state inspection" }]
  - [meta, { property: "og:title", content: "DevTools - Pinia" }]
  - [meta, { property: "og:description", content: "Comprehensive guide to debugging and developing with Pinia using Vue DevTools and other development tools." }]
---

# DevTools

Pinia provides excellent debugging capabilities through Vue DevTools and other development tools. This guide covers how to effectively use these tools for debugging and developing Pinia applications.

## Vue DevTools

### Installation

**Browser Extension:**

- [Chrome Extension](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Edge Extension](https://microsoftedge.microsoft.com/addons/detail/vuejs-devtools/olofadcdnkkjdfgjcmjaadnlehnnihnl)

**Standalone Application:**

```bash
npm install -g @vue/devtools
# or
yarn global add @vue/devtools

# Run
vue-devtools
```

### Pinia Integration

Pinia automatically integrates with Vue DevTools when both are available:

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// DevTools integration is automatic
app.use(pinia)
app.mount('#app')
```

### DevTools Features

#### 1. Store Inspector

**View Store State:**

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const preferences = ref({
    theme: 'light',
    language: 'en'
  })
  
  return { user, preferences }
})
```

In DevTools:
- Navigate to "Pinia" tab
- Select store from the list
- Inspect current state values
- View nested objects and arrays

#### 2. State Mutations

**Track State Changes:**

```ts
// stores/counter.ts
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  
  const increment = () => {
    count.value++ // This mutation will be tracked
  }
  
  const setCount = (newCount: number) => {
    count.value = newCount // This mutation will be tracked
  }
  
  return { count, increment, setCount }
})
```

DevTools shows:
- Mutation timeline
- Before/after state values
- Action that triggered the mutation
- Stack trace

#### 3. Action Tracking

**Monitor Action Execution:**

```ts
// stores/api.ts
export const useApiStore = defineStore('api', () => {
  const data = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const fetchData = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/data')
      data.value = await response.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  return { data, loading, error, fetchData }
})
```

DevTools displays:
- Action execution timeline
- Action parameters
- Execution duration
- Success/error status
- State changes during action

#### 4. Time Travel Debugging

**Navigate Through State History:**

```ts
// Enable time travel (automatic in development)
const pinia = createPinia()

// In DevTools:
// 1. View mutation history
// 2. Click on any mutation to travel back
// 3. See application state at that point
// 4. Continue from that state or reset
```

### DevTools Configuration

#### Custom Store Names

```ts
// Better store identification in DevTools
export const useUserStore = defineStore('user-management', () => {
  // Store implementation
})

export const useShoppingCartStore = defineStore('shopping-cart', () => {
  // Store implementation
})
```

#### Store Grouping

```ts
// Group related stores
export const useUserProfileStore = defineStore('user/profile', () => {
  // User profile store
})

export const useUserSettingsStore = defineStore('user/settings', () => {
  // User settings store
})

export const useProductCatalogStore = defineStore('product/catalog', () => {
  // Product catalog store
})

export const useProductCartStore = defineStore('product/cart', () => {
  // Shopping cart store
})
```

## Development Tools

### Hot Module Replacement (HMR)

**Automatic Store Updates:**

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  
  const login = async (credentials) => {
    // Login logic
  }
  
  const logout = () => {
    user.value = null
  }
  
  return { user, login, logout }
})

// HMR preserves store state during development
// Changes to store logic are applied without losing state
```

**Manual HMR Configuration:**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_PROD_DEVTOOLS__: false, // Disable DevTools in production
  }
})
```

### TypeScript Integration

**Type-Safe Debugging:**

```ts
// stores/typed-store.ts
interface User {
  id: number
  name: string
  email: string
}

interface UserState {
  currentUser: User | null
  users: User[]
  loading: boolean
}

export const useUserStore = defineStore('user', (): UserState => {
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const loading = ref(false)
  
  return {
    currentUser: readonly(currentUser),
    users: readonly(users),
    loading: readonly(loading)
  }
})

// DevTools will show proper types for all state properties
```

### Custom DevTools Plugin

**Create Custom Inspector:**

```ts
// plugins/devtools-plugin.ts
import { App } from 'vue'
import { PiniaPluginContext } from 'pinia'

export function createDevToolsPlugin() {
  return ({ store, app }: PiniaPluginContext) => {
    // Add custom properties to DevTools
    store.$subscribe((mutation, state) => {
      console.group(`🍍 ${store.$id}`)
      console.log('Mutation:', mutation)
      console.log('State:', state)
      console.groupEnd()
    })
    
    // Add custom actions to DevTools
    store.$onAction(({ name, args, after, onError }) => {
      console.log(`🚀 Action "${name}" started with args:`, args)
      
      after((result) => {
        console.log(`✅ Action "${name}" completed with result:`, result)
      })
      
      onError((error) => {
        console.error(`❌ Action "${name}" failed:`, error)
      })
    })
  }
}

// main.ts
const pinia = createPinia()
pinia.use(createDevToolsPlugin())
```

## Debugging Techniques

### State Inspection

**Direct State Access:**

```ts
// In browser console or debugger
const userStore = useUserStore()
console.log('Current user:', userStore.user)
console.log('All state:', userStore.$state)

// Reactive state watching
watch(
  () => userStore.user,
  (newUser, oldUser) => {
    console.log('User changed:', { newUser, oldUser })
  },
  { deep: true }
)
```

**State Snapshots:**

```ts
// stores/debug.ts
export const useDebugStore = defineStore('debug', () => {
  const snapshots = ref([])
  
  const takeSnapshot = (label: string) => {
    const allStores = {}
    
    // Collect all store states
    const pinia = getActivePinia()
    pinia._s.forEach((store, id) => {
      allStores[id] = JSON.parse(JSON.stringify(store.$state))
    })
    
    snapshots.value.push({
      label,
      timestamp: Date.now(),
      states: allStores
    })
  }
  
  const compareSnapshots = (index1: number, index2: number) => {
    const snap1 = snapshots.value[index1]
    const snap2 = snapshots.value[index2]
    
    // Compare states and return differences
    return {
      snap1: snap1.label,
      snap2: snap2.label,
      differences: findDifferences(snap1.states, snap2.states)
    }
  }
  
  return { snapshots, takeSnapshot, compareSnapshots }
})
```

### Action Debugging

**Action Interceptors:**

```ts
// plugins/action-logger.ts
export function createActionLogger() {
  return ({ store }: PiniaPluginContext) => {
    store.$onAction(({ name, args, after, onError }) => {
      const startTime = Date.now()
      
      console.group(`🎬 Action: ${store.$id}.${name}`)
      console.log('Arguments:', args)
      console.log('State before:', JSON.stringify(store.$state))
      
      after((result) => {
        const duration = Date.now() - startTime
        console.log('State after:', JSON.stringify(store.$state))
        console.log('Result:', result)
        console.log(`Duration: ${duration}ms`)
        console.groupEnd()
      })
      
      onError((error) => {
        console.error('Error:', error)
        console.groupEnd()
      })
    })
  }
}
```

**Async Action Debugging:**

```ts
// stores/async-debug.ts
export const useAsyncStore = defineStore('async', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const fetchData = async (url: string) => {
    const actionId = `fetch-${Date.now()}`
    
    console.time(actionId)
    loading.value = true
    error.value = null
    
    try {
      console.log(`🌐 Fetching: ${url}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      data.value = await response.json()
      console.log(`✅ Fetch successful:`, data.value)
    } catch (err) {
      error.value = err.message
      console.error(`❌ Fetch failed:`, err)
    } finally {
      loading.value = false
      console.timeEnd(actionId)
    }
  }
  
  return { data, loading, error, fetchData }
})
```

### Performance Debugging

**Store Performance Monitor:**

```ts
// plugins/performance-monitor.ts
export function createPerformanceMonitor() {
  return ({ store }: PiniaPluginContext) => {
    const metrics = {
      mutations: 0,
      actions: 0,
      subscriptions: 0
    }
    
    // Track mutations
    store.$subscribe(() => {
      metrics.mutations++
    })
    
    // Track actions
    store.$onAction(() => {
      metrics.actions++
    })
    
    // Expose metrics
    store.$metrics = metrics
    
    // Log performance summary
    setInterval(() => {
      console.log(`📊 Store ${store.$id} metrics:`, metrics)
    }, 10000) // Every 10 seconds
  }
}
```

**Memory Usage Tracking:**

```ts
// utils/memory-tracker.ts
export function trackMemoryUsage() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory
    
    if (memory) {
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
  }
  
  return null
}

// Usage in store
export const useMemoryStore = defineStore('memory', () => {
  const memoryUsage = ref(null)
  
  const updateMemoryUsage = () => {
    memoryUsage.value = trackMemoryUsage()
  }
  
  // Update every 5 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(updateMemoryUsage, 5000)
  }
  
  return { memoryUsage, updateMemoryUsage }
})
```

## Production Debugging

### Error Tracking

**Error Boundary for Stores:**

```ts
// plugins/error-tracker.ts
export function createErrorTracker() {
  return ({ store }: PiniaPluginContext) => {
    store.$onAction(({ name, onError }) => {
      onError((error) => {
        // Send to error tracking service
        if (typeof window !== 'undefined') {
          // Example: Sentry, LogRocket, etc.
          console.error(`Store action error in ${store.$id}.${name}:`, error)
          
          // Send to monitoring service
          // Sentry.captureException(error, {
          //   tags: {
          //     store: store.$id,
          //     action: name
          //   }
          // })
        }
      })
    })
  }
}
```

### State Persistence for Debugging

**Debug State Persistence:**

```ts
// plugins/debug-persistence.ts
export function createDebugPersistence() {
  return ({ store }: PiniaPluginContext) => {
    if (process.env.NODE_ENV === 'development') {
      // Save state to localStorage for debugging
      store.$subscribe((mutation, state) => {
        localStorage.setItem(
          `debug-${store.$id}`,
          JSON.stringify({
            state,
            timestamp: Date.now(),
            mutation
          })
        )
      })
      
      // Restore state from localStorage
      const savedState = localStorage.getItem(`debug-${store.$id}`)
      if (savedState) {
        try {
          const { state } = JSON.parse(savedState)
          store.$patch(state)
        } catch (error) {
          console.warn(`Failed to restore debug state for ${store.$id}:`, error)
        }
      }
    }
  }
}
```

## Best Practices

### DevTools Optimization

1. **Use Descriptive Store Names:**

```ts
// ❌ Bad
defineStore('store1', () => { /* ... */ })
defineStore('s', () => { /* ... */ })

// ✅ Good
defineStore('user-authentication', () => { /* ... */ })
defineStore('shopping-cart', () => { /* ... */ })
```

2. **Group Related Stores:**

```ts
// ✅ Good organization
defineStore('auth/user', () => { /* ... */ })
defineStore('auth/permissions', () => { /* ... */ })
defineStore('ecommerce/products', () => { /* ... */ })
defineStore('ecommerce/cart', () => { /* ... */ })
```

3. **Add Meaningful Action Names:**

```ts
// ❌ Bad
const doSomething = () => { /* ... */ }
const update = () => { /* ... */ }

// ✅ Good
const authenticateUser = () => { /* ... */ }
const updateUserProfile = () => { /* ... */ }
```

### Development vs Production

```ts
// main.ts
const pinia = createPinia()

if (process.env.NODE_ENV === 'development') {
  // Development-only plugins
  pinia.use(createActionLogger())
  pinia.use(createPerformanceMonitor())
  pinia.use(createDebugPersistence())
}

if (process.env.NODE_ENV === 'production') {
  // Production-only plugins
  pinia.use(createErrorTracker())
}

app.use(pinia)
```

### Security Considerations

```ts
// Avoid exposing sensitive data in DevTools
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  
  // ❌ Don't expose sensitive data directly
  // return { user, token }
  
  // ✅ Use getters to control exposure
  const publicUser = computed(() => {
    if (!user.value) return null
    
    return {
      id: user.value.id,
      name: user.value.name,
      email: user.value.email
      // Don't expose sensitive fields
    }
  })
  
  const isAuthenticated = computed(() => !!token.value)
  
  return {
    user: publicUser,
    isAuthenticated
    // Don't expose token directly
  }
})
```

## Troubleshooting

### Common Issues

1. **DevTools Not Showing Pinia Tab:**

```ts
// Ensure Vue DevTools is installed and enabled
// Check browser console for errors
// Verify Pinia is properly installed

// Force DevTools detection
if (process.env.NODE_ENV === 'development') {
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || {}
}
```

2. **Store State Not Updating in DevTools:**

```ts
// Ensure you're using reactive references
const state = ref(initialValue) // ✅ Reactive
const state = initialValue // ❌ Not reactive

// Ensure proper state mutations
state.value = newValue // ✅ Triggers reactivity
state = newValue // ❌ Doesn't trigger reactivity
```

3. **Actions Not Appearing in Timeline:**

```ts
// Ensure actions are properly defined and returned
export const useStore = defineStore('store', () => {
  const action = () => {
    // Action logic
  }
  
  return {
    action // ✅ Must be returned to be tracked
  }
})
```

### Performance Issues

```ts
// Avoid excessive DevTools updates
export const useOptimizedStore = defineStore('optimized', () => {
  const data = ref([])
  
  // ❌ Triggers many DevTools updates
  const addItemsOneByOne = (items) => {
    items.forEach(item => {
      data.value.push(item) // Each push triggers update
    })
  }
  
  // ✅ Single DevTools update
  const addItemsBatch = (items) => {
    data.value = [...data.value, ...items]
  }
  
  return { data, addItemsBatch }
})
```

## Related Resources

- [Vue DevTools Documentation](https://devtools.vuejs.org/)
- [Pinia Testing Guide](../guide/testing.md)
- [Performance Optimization](../guide/performance.md)
- [Plugin Development](../cookbook/plugin-development.md)
- [TypeScript Best Practices](../cookbook/typescript-best-practices.md)