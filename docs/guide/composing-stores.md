# Composing Stores

One of Pinia's most powerful features is the ability to compose stores together. This allows you to create modular, reusable, and maintainable state management solutions by combining multiple stores.

## Basic Store Composition

### Using One Store in Another

You can use one store inside another by simply calling it:

```typescript
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])
  const userStore = useUserStore()

  async function fetchUserPosts() {
    if (!userStore.currentUser) {
      throw new Error('User must be logged in')
    }
    
    const response = await fetch(`/api/users/${userStore.currentUser.id}/posts`)
    posts.value = await response.json()
  }

  const userPosts = computed(() => {
    return posts.value.filter(post => post.authorId === userStore.currentUser?.id)
  })

  return {
    posts: readonly(posts),
    userPosts,
    fetchUserPosts
  }
})
```

### Cross-Store Communication

Stores can communicate with each other through shared state and actions:

```typescript
// stores/notifications.ts
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])

  function addNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    }
    notifications.value.push(notification)
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  return {
    notifications: readonly(notifications),
    addNotification,
    removeNotification
  }
})

// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const notificationsStore = useNotificationsStore()

  async function login(credentials) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })
      
      if (response.ok) {
        user.value = await response.json()
        notificationsStore.addNotification('Successfully logged in!', 'success')
      } else {
        throw new Error('Login failed')
      }
    } catch (error) {
      notificationsStore.addNotification('Login failed. Please try again.', 'error')
      throw error
    }
  }

  return { user, login }
})
```

## Advanced Composition Patterns

### Store Factory Pattern

Create reusable store factories for similar functionality:

```typescript
function createResourceStore<T>(resourceName: string, apiEndpoint: string) {
  return defineStore(`${resourceName}Store`, () => {
    const items = ref<T[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchAll() {
      loading.value = true
      error.value = null
      
      try {
        const response = await fetch(apiEndpoint)
        if (!response.ok) throw new Error(`Failed to fetch ${resourceName}`)
        items.value = await response.json()
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
      } finally {
        loading.value = false
      }
    }

    async function create(item: Omit<T, 'id'>) {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
        
        if (!response.ok) throw new Error(`Failed to create ${resourceName}`)
        const newItem = await response.json()
        items.value.push(newItem)
        return newItem
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        throw err
      }
    }

    async function update(id: string, updates: Partial<T>) {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        
        if (!response.ok) throw new Error(`Failed to update ${resourceName}`)
        const updatedItem = await response.json()
        
        const index = items.value.findIndex(item => item.id === id)
        if (index > -1) {
          items.value[index] = updatedItem
        }
        
        return updatedItem
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        throw err
      }
    }

    async function remove(id: string) {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) throw new Error(`Failed to delete ${resourceName}`)
        
        const index = items.value.findIndex(item => item.id === id)
        if (index > -1) {
          items.value.splice(index, 1)
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Unknown error'
        throw err
      }
    }

    return {
      items: readonly(items),
      loading: readonly(loading),
      error: readonly(error),
      fetchAll,
      create,
      update,
      remove
    }
  })
}

// Usage
const useUsersStore = createResourceStore<User>('users', '/api/users')
const usePostsStore = createResourceStore<Post>('posts', '/api/posts')
const useCommentsStore = createResourceStore<Comment>('comments', '/api/comments')
```

### Mixin Pattern

Create reusable functionality that can be mixed into stores:

```typescript
// mixins/cacheable.ts
function useCacheable<T>(key: string, ttl: number = 5 * 60 * 1000) {
  const cache = ref<{ data: T | null; timestamp: number }>({ data: null, timestamp: 0 })

  function isCacheValid(): boolean {
    return Date.now() - cache.value.timestamp < ttl
  }

  function setCache(data: T) {
    cache.value = {
      data,
      timestamp: Date.now()
    }
  }

  function getCache(): T | null {
    return isCacheValid() ? cache.value.data : null
  }

  function clearCache() {
    cache.value = { data: null, timestamp: 0 }
  }

  return {
    cache: readonly(cache),
    isCacheValid,
    setCache,
    getCache,
    clearCache
  }
}

// mixins/loadable.ts
function useLoadable() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function withLoading<T>(operation: () => Promise<T>): Promise<T> {
    loading.value = true
    error.value = null
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    withLoading
  }
}

// Using mixins in a store
export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const { cache, setCache, getCache, clearCache } = useCacheable<Product[]>('products')
  const { loading, error, withLoading } = useLoadable()

  async function fetchProducts() {
    const cachedProducts = getCache()
    if (cachedProducts) {
      products.value = cachedProducts
      return cachedProducts
    }

    return withLoading(async () => {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      
      const data = await response.json()
      products.value = data
      setCache(data)
      return data
    })
  }

  function invalidateCache() {
    clearCache()
  }

  return {
    products: readonly(products),
    loading,
    error,
    fetchProducts,
    invalidateCache
  }
})
```

### Event-Driven Communication

Implement event-driven communication between stores:

```typescript
// stores/events.ts
type EventCallback = (...args: any[]) => void

export const useEventBusStore = defineStore('eventBus', () => {
  const listeners = ref<Record<string, EventCallback[]>>({})

  function on(event: string, callback: EventCallback) {
    if (!listeners.value[event]) {
      listeners.value[event] = []
    }
    listeners.value[event].push(callback)

    // Return unsubscribe function
    return () => {
      const index = listeners.value[event]?.indexOf(callback)
      if (index !== undefined && index > -1) {
        listeners.value[event].splice(index, 1)
      }
    }
  }

  function emit(event: string, ...args: any[]) {
    const eventListeners = listeners.value[event]
    if (eventListeners) {
      eventListeners.forEach(callback => callback(...args))
    }
  }

  function off(event: string, callback?: EventCallback) {
    if (!callback) {
      delete listeners.value[event]
    } else {
      const index = listeners.value[event]?.indexOf(callback)
      if (index !== undefined && index > -1) {
        listeners.value[event].splice(index, 1)
      }
    }
  }

  return { on, emit, off }
})

// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const eventBus = useEventBusStore()

  function addItem(product: Product, quantity: number = 1) {
    const existingItem = items.value.find(item => item.productId === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        product,
        quantity,
        addedAt: new Date()
      })
    }

    eventBus.emit('cart:item-added', { product, quantity })
  }

  function removeItem(productId: string) {
    const index = items.value.findIndex(item => item.productId === productId)
    if (index > -1) {
      const removedItem = items.value.splice(index, 1)[0]
      eventBus.emit('cart:item-removed', removedItem)
    }
  }

  return { items, addItem, removeItem }
})

// stores/analytics.ts
export const useAnalyticsStore = defineStore('analytics', () => {
  const events = ref<AnalyticsEvent[]>([])
  const eventBus = useEventBusStore()

  // Listen to cart events
  eventBus.on('cart:item-added', ({ product, quantity }) => {
    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      quantity,
      value: product.price * quantity
    })
  })

  eventBus.on('cart:item-removed', (item) => {
    trackEvent('remove_from_cart', {
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity
    })
  })

  function trackEvent(name: string, properties: Record<string, any>) {
    const event = {
      id: Date.now().toString(),
      name,
      properties,
      timestamp: new Date()
    }
    
    events.value.push(event)
    
    // Send to analytics service
    sendToAnalytics(event)
  }

  async function sendToAnalytics(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  return {
    events: readonly(events),
    trackEvent
  }
})
```

## Store Dependencies

### Dependency Injection Pattern

Manage store dependencies explicitly:

```typescript
// stores/dependencies.ts
export interface StoreDependencies {
  apiClient: ApiClient
  logger: Logger
  cache: CacheService
}

const dependencies = ref<StoreDependencies | null>(null)

export function setStoreDependencies(deps: StoreDependencies) {
  dependencies.value = deps
}

export function getStoreDependencies(): StoreDependencies {
  if (!dependencies.value) {
    throw new Error('Store dependencies not initialized')
  }
  return dependencies.value
}

// stores/products.ts
export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const { apiClient, logger, cache } = getStoreDependencies()

  async function fetchProducts() {
    try {
      logger.info('Fetching products')
      
      const cached = await cache.get('products')
      if (cached) {
        products.value = cached
        return cached
      }

      const data = await apiClient.get<Product[]>('/products')
      products.value = data
      await cache.set('products', data, 300) // 5 minutes
      
      logger.info(`Fetched ${data.length} products`)
      return data
    } catch (error) {
      logger.error('Failed to fetch products:', error)
      throw error
    }
  }

  return {
    products: readonly(products),
    fetchProducts
  }
})
```

### Hierarchical Store Structure

Create hierarchical relationships between stores:

```typescript
// stores/base.ts
export function createBaseStore(name: string) {
  return defineStore(name, () => {
    const initialized = ref(false)
    const error = ref<string | null>(null)

    async function initialize() {
      if (initialized.value) return
      
      try {
        await onInitialize()
        initialized.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Initialization failed'
        throw err
      }
    }

    async function onInitialize() {
      // Override in child stores
    }

    function reset() {
      initialized.value = false
      error.value = null
    }

    return {
      initialized: readonly(initialized),
      error: readonly(error),
      initialize,
      reset,
      onInitialize
    }
  })
}

// stores/app.ts
export const useAppStore = defineStore('app', () => {
  const baseStore = createBaseStore('app')()
  const childStores = ref<string[]>([])

  async function initializeApp() {
    await baseStore.initialize()
    
    // Initialize child stores
    for (const storeName of childStores.value) {
      const store = getStoreByName(storeName)
      if (store && 'initialize' in store) {
        await store.initialize()
      }
    }
  }

  function registerChildStore(storeName: string) {
    if (!childStores.value.includes(storeName)) {
      childStores.value.push(storeName)
    }
  }

  return {
    ...baseStore,
    childStores: readonly(childStores),
    initializeApp,
    registerChildStore
  }
})
```

## Testing Composed Stores

### Mocking Store Dependencies

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'
import { useNotificationsStore } from './notifications'

describe('Cart Store Composition', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should notify when item is added to cart', () => {
    const cartStore = useCartStore()
    const notificationsStore = useNotificationsStore()
    
    const addNotificationSpy = vi.spyOn(notificationsStore, 'addNotification')
    
    const product = { id: '1', name: 'Test Product', price: 10 }
    cartStore.addItem(product, 2)
    
    expect(addNotificationSpy).toHaveBeenCalledWith(
      'Added Test Product to cart',
      'success'
    )
  })

  it('should handle store initialization order', async () => {
    const appStore = useAppStore()
    
    appStore.registerChildStore('cart')
    appStore.registerChildStore('notifications')
    
    await appStore.initializeApp()
    
    expect(appStore.initialized).toBe(true)
  })
})
```

## Best Practices

### 1. Avoid Circular Dependencies

```typescript
// ❌ Bad: Circular dependency
// store A uses store B, store B uses store A

// ✅ Good: Use a shared store or event system
export const useSharedStore = defineStore('shared', () => {
  const sharedState = ref({})
  return { sharedState }
})
```

### 2. Keep Store Responsibilities Clear

```typescript
// ✅ Good: Each store has a clear responsibility
export const useUserStore = defineStore('user', () => {
  // Only user-related state and actions
})

export const useCartStore = defineStore('cart', () => {
  // Only cart-related state and actions
  const userStore = useUserStore() // OK to use other stores
})
```

### 3. Use TypeScript for Better Composition

```typescript
interface StoreComposition {
  user: ReturnType<typeof useUserStore>
  cart: ReturnType<typeof useCartStore>
  notifications: ReturnType<typeof useNotificationsStore>
}

export function useStoreComposition(): StoreComposition {
  return {
    user: useUserStore(),
    cart: useCartStore(),
    notifications: useNotificationsStore()
  }
}
```

### 4. Document Store Relationships

```typescript
/**
 * Shopping Cart Store
 * 
 * Dependencies:
 * - useUserStore: For user authentication state
 * - useProductsStore: For product information
 * - useNotificationsStore: For user feedback
 * 
 * Events Emitted:
 * - cart:item-added
 * - cart:item-removed
 * - cart:cleared
 */
export const useCartStore = defineStore('cart', () => {
  // Implementation
})
```

By following these patterns and best practices, you can create well-structured, maintainable applications with composed Pinia stores that work together seamlessly.