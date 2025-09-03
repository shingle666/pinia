---
title: Performance Optimization
description: Learn how to optimize your Pinia stores for better performance, including lazy loading, computed optimization, memory management, and best practices.
head:
  - [meta, { name: description, content: "Learn how to optimize your Pinia stores for better performance, including lazy loading, computed optimization, memory management, and best practices." }]
  - [meta, { name: keywords, content: "Pinia performance, Vue optimization, state management performance, lazy loading" }]
  - [meta, { property: "og:title", content: "Performance Optimization - Pinia" }]
  - [meta, { property: "og:description", content: "Learn how to optimize your Pinia stores for better performance, including lazy loading, computed optimization, memory management, and best practices." }]
---

# Performance Optimization

This guide covers various techniques to optimize the performance of your Pinia stores and Vue applications.

## Store Optimization

### Lazy Loading Stores

Load stores only when needed to reduce initial bundle size and improve startup performance.

```ts
// stores/index.ts
export const useUserStore = () => import('./user').then(m => m.useUserStore)
export const useProductStore = () => import('./product').then(m => m.useProductStore)

// In component
<script setup>
const loadUserStore = async () => {
  const { useUserStore } = await import('@/stores/user')
  return useUserStore()
}

const userStore = await loadUserStore()
</script>
```

### Store Splitting

Split large stores into smaller, focused stores to improve maintainability and performance.

```ts
// Instead of one large store
const useLargeStore = defineStore('large', () => {
  const users = ref([])
  const products = ref([])
  const orders = ref([])
  // ... many more states
})

// Split into focused stores
const useUserStore = defineStore('user', () => {
  const users = ref([])
  const currentUser = ref(null)
  
  const fetchUsers = async () => {
    // Implementation
  }
  
  return { users, currentUser, fetchUsers }
})

const useProductStore = defineStore('product', () => {
  const products = ref([])
  const categories = ref([])
  
  const fetchProducts = async () => {
    // Implementation
  }
  
  return { products, categories, fetchProducts }
})
```

## State Optimization

### Computed Properties

Use computed properties for derived state to avoid unnecessary recalculations.

```ts
const useProductStore = defineStore('product', () => {
  const products = ref([])
  const filters = ref({ category: '', priceRange: [0, 1000] })
  
  // Efficient computed property
  const filteredProducts = computed(() => {
    return products.value.filter(product => {
      const matchesCategory = !filters.value.category || 
        product.category === filters.value.category
      const matchesPrice = product.price >= filters.value.priceRange[0] && 
        product.price <= filters.value.priceRange[1]
      
      return matchesCategory && matchesPrice
    })
  })
  
  // Expensive operations should be computed
  const productStats = computed(() => {
    const total = products.value.length
    const avgPrice = products.value.reduce((sum, p) => sum + p.price, 0) / total
    const categories = [...new Set(products.value.map(p => p.category))]
    
    return { total, avgPrice, categories }
  })
  
  return {
    products,
    filters,
    filteredProducts,
    productStats
  }
})
```

### Shallow Reactivity

Use `shallowRef` for large objects that don't need deep reactivity.

```ts
import { shallowRef, triggerRef } from 'vue'

const useDataStore = defineStore('data', () => {
  // For large datasets that change as a whole
  const largeDataset = shallowRef([])
  
  const updateDataset = (newData) => {
    largeDataset.value = newData
    triggerRef(largeDataset) // Manually trigger reactivity
  }
  
  return { largeDataset, updateDataset }
})
```

### Selective Reactivity

Make only necessary properties reactive.

```ts
const useConfigStore = defineStore('config', () => {
  // Reactive for UI updates
  const theme = ref('light')
  const language = ref('en')
  
  // Non-reactive for static configuration
  const apiEndpoints = {
    users: '/api/users',
    products: '/api/products'
  }
  
  // Reactive only when needed
  const debugMode = ref(false)
  
  return {
    theme,
    language,
    apiEndpoints,
    debugMode
  }
})
```

## Action Optimization

### Debounced Actions

Debounce frequent actions to reduce API calls.

```ts
import { debounce } from 'lodash-es'

const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const results = ref([])
  const loading = ref(false)
  
  const searchAPI = async (searchQuery: string) => {
    loading.value = true
    try {
      const response = await fetch(`/api/search?q=${searchQuery}`)
      results.value = await response.json()
    } finally {
      loading.value = false
    }
  }
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = debounce(searchAPI, 300)
  
  const search = (searchQuery: string) => {
    query.value = searchQuery
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      results.value = []
    }
  }
  
  return {
    query,
    results,
    loading,
    search
  }
})
```

### Batch Operations

Batch multiple operations to reduce reactivity overhead.

```ts
const useCartStore = defineStore('cart', () => {
  const items = ref([])
  
  // Inefficient: triggers reactivity for each item
  const addMultipleItemsInefficient = (newItems) => {
    newItems.forEach(item => {
      items.value.push(item)
    })
  }
  
  // Efficient: single reactivity trigger
  const addMultipleItems = (newItems) => {
    items.value = [...items.value, ...newItems]
  }
  
  // Using $patch for multiple updates
  const updateCart = (updates) => {
    // Batch multiple state updates
    $patch((state) => {
      if (updates.items) state.items = updates.items
      if (updates.total) state.total = updates.total
      if (updates.discount) state.discount = updates.discount
    })
  }
  
  return {
    items,
    addMultipleItems,
    updateCart
  }
})
```

### Async Action Optimization

Optimize async actions with caching and request deduplication.

```ts
const useUserStore = defineStore('user', () => {
  const users = ref(new Map())
  const loading = ref(new Set())
  
  // Cache and deduplicate requests
  const fetchUser = async (userId: string) => {
    // Return cached user if available
    if (users.value.has(userId)) {
      return users.value.get(userId)
    }
    
    // Prevent duplicate requests
    if (loading.value.has(userId)) {
      // Wait for ongoing request
      while (loading.value.has(userId)) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      return users.value.get(userId)
    }
    
    loading.value.add(userId)
    
    try {
      const response = await fetch(`/api/users/${userId}`)
      const user = await response.json()
      users.value.set(userId, user)
      return user
    } finally {
      loading.value.delete(userId)
    }
  }
  
  return {
    users,
    fetchUser
  }
})
```

## Memory Management

### Store Cleanup

Clean up stores when they're no longer needed.

```ts
const useTemporaryStore = defineStore('temporary', () => {
  const data = ref([])
  const subscriptions = ref([])
  
  const cleanup = () => {
    // Clear data
    data.value = []
    
    // Unsubscribe from external sources
    subscriptions.value.forEach(unsubscribe => unsubscribe())
    subscriptions.value = []
  }
  
  // Auto-cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    data,
    cleanup
  }
})
```

### Weak References

Use weak references for temporary data.

```ts
const useCacheStore = defineStore('cache', () => {
  const cache = new WeakMap()
  const tempData = new Map()
  
  const setTempData = (key: string, value: any, ttl: number = 5000) => {
    tempData.set(key, value)
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      tempData.delete(key)
    }, ttl)
  }
  
  return {
    cache,
    tempData,
    setTempData
  }
})
```

## Component Integration

### Selective Store Usage

Only use the parts of the store you need in components.

```vue
<script setup>
// Instead of using entire store
const store = useProductStore()

// Use only what you need
const { products, loading } = storeToRefs(useProductStore())
const { fetchProducts } = useProductStore()

// Or use computed for specific data
const featuredProducts = computed(() => 
  useProductStore().products.filter(p => p.featured)
)
</script>
```

### Conditional Store Loading

Load stores conditionally based on component needs.

```vue
<script setup>
const props = defineProps<{
  showUserData: boolean
  showProductData: boolean
}>()

// Conditional store loading
const userStore = props.showUserData ? useUserStore() : null
const productStore = props.showProductData ? useProductStore() : null

// Or use dynamic imports
const loadStoreData = async () => {
  if (props.showUserData) {
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()
    await userStore.fetchUsers()
  }
}
</script>
```

## Bundle Optimization

### Tree Shaking

Structure stores to enable effective tree shaking.

```ts
// stores/user/index.ts
export { useUserStore } from './store'
export { userHelpers } from './helpers'
export type { User, UserState } from './types'

// stores/user/store.ts
export const useUserStore = defineStore('user', () => {
  // Store implementation
})

// stores/user/helpers.ts
export const userHelpers = {
  formatUserName: (user) => `${user.firstName} ${user.lastName}`,
  isUserActive: (user) => user.status === 'active'
}
```

### Code Splitting

Split store code by feature.

```ts
// stores/user/actions.ts
export const createUserActions = () => {
  const login = async (credentials) => {
    // Implementation
  }
  
  const logout = () => {
    // Implementation
  }
  
  return { login, logout }
}

// stores/user/getters.ts
export const createUserGetters = (state) => {
  const isLoggedIn = computed(() => !!state.user.value)
  const fullName = computed(() => 
    state.user.value ? `${state.user.value.firstName} ${state.user.value.lastName}` : ''
  )
  
  return { isLoggedIn, fullName }
}

// stores/user/index.ts
export const useUserStore = defineStore('user', () => {
  const state = {
    user: ref(null)
  }
  
  const actions = createUserActions()
  const getters = createUserGetters(state)
  
  return {
    ...state,
    ...actions,
    ...getters
  }
})
```

## Performance Monitoring

### Store Performance Tracking

Monitor store performance in development.

```ts
const usePerformanceStore = defineStore('performance', () => {
  const metrics = ref(new Map())
  
  const trackAction = (actionName: string, fn: Function) => {
    return async (...args: any[]) => {
      const start = performance.now()
      
      try {
        const result = await fn(...args)
        const duration = performance.now() - start
        
        if (import.meta.env.DEV) {
          console.log(`Action ${actionName} took ${duration.toFixed(2)}ms`)
          
          const current = metrics.value.get(actionName) || []
          current.push(duration)
          metrics.value.set(actionName, current)
        }
        
        return result
      } catch (error) {
        const duration = performance.now() - start
        console.error(`Action ${actionName} failed after ${duration.toFixed(2)}ms`, error)
        throw error
      }
    }
  }
  
  const getMetrics = () => {
    const summary = new Map()
    
    metrics.value.forEach((durations, actionName) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length
      const min = Math.min(...durations)
      const max = Math.max(...durations)
      
      summary.set(actionName, { avg, min, max, count: durations.length })
    })
    
    return summary
  }
  
  return {
    trackAction,
    getMetrics
  }
})
```

### Memory Usage Monitoring

Monitor memory usage of stores.

```ts
const useMemoryMonitor = defineStore('memoryMonitor', () => {
  const memoryUsage = ref([])
  
  const recordMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      })
      
      // Keep only last 100 records
      if (memoryUsage.value.length > 100) {
        memoryUsage.value = memoryUsage.value.slice(-100)
      }
    }
  }
  
  // Record memory usage every 5 seconds in development
  if (import.meta.env.DEV) {
    setInterval(recordMemoryUsage, 5000)
  }
  
  return {
    memoryUsage,
    recordMemoryUsage
  }
})
```

## Best Practices

### Performance Checklist

- ✅ Use computed properties for derived state
- ✅ Implement lazy loading for large stores
- ✅ Debounce frequent actions
- ✅ Batch state updates when possible
- ✅ Clean up stores and subscriptions
- ✅ Use selective reactivity
- ✅ Implement caching for expensive operations
- ✅ Monitor performance in development
- ✅ Split large stores into smaller ones
- ✅ Use tree shaking and code splitting

### Common Performance Pitfalls

1. **Over-reactivity**: Making everything reactive when not needed
2. **Large objects**: Deep reactivity on large objects
3. **Frequent updates**: Not batching state updates
4. **Memory leaks**: Not cleaning up subscriptions
5. **Unnecessary computations**: Not using computed properties
6. **Bundle bloat**: Loading all stores upfront

### Performance Testing

```ts
// performance.test.ts
import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/product'

describe('Store Performance', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should handle large datasets efficiently', () => {
    const store = useProductStore()
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: Math.random() * 100
    }))
    
    const start = performance.now()
    store.setProducts(largeDataset)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(100) // Should complete in under 100ms
  })
  
  it('should efficiently filter large datasets', () => {
    const store = useProductStore()
    // Setup large dataset
    
    const start = performance.now()
    const filtered = store.filteredProducts
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(50)
  })
})
```

## Related Resources

- [Vue Performance Guide](https://vuejs.org/guide/best-practices/performance.html)
- [Pinia DevTools](../ecosystem/devtools.md)
- [Testing Guide](./testing.md)
- [TypeScript Guide](./typescript.md)