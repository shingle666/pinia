# Store 组合

Pinia 最强大的功能之一是能够将 store 组合在一起。这允许您通过组合多个 store 来创建模块化、可重用和可维护的状态管理解决方案。

## 基础 Store 组合

### 在一个 Store 中使用另一个 Store

您可以通过简单地调用另一个 store 来在一个 store 内部使用它：

```typescript
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])
  const userStore = useUserStore()

  async function fetchUserPosts() {
    if (!userStore.currentUser) {
      throw new Error('用户必须登录')
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

### 跨 Store 通信

Store 可以通过共享状态和操作相互通信：

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
        notificationsStore.addNotification('登录成功！', 'success')
      } else {
        throw new Error('登录失败')
      }
    } catch (error) {
      notificationsStore.addNotification('登录失败，请重试。', 'error')
      throw error
    }
  }

  return { user, login }
})
```

## 高级组合模式

### Store 工厂模式

为相似功能创建可重用的 store 工厂：

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
        if (!response.ok) throw new Error(`获取 ${resourceName} 失败`)
        items.value = await response.json()
      } catch (err) {
        error.value = err instanceof Error ? err.message : '未知错误'
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
        
        if (!response.ok) throw new Error(`创建 ${resourceName} 失败`)
        const newItem = await response.json()
        items.value.push(newItem)
        return newItem
      } catch (err) {
        error.value = err instanceof Error ? err.message : '未知错误'
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
        
        if (!response.ok) throw new Error(`更新 ${resourceName} 失败`)
        const updatedItem = await response.json()
        
        const index = items.value.findIndex(item => item.id === id)
        if (index > -1) {
          items.value[index] = updatedItem
        }
        
        return updatedItem
      } catch (err) {
        error.value = err instanceof Error ? err.message : '未知错误'
        throw err
      }
    }

    async function remove(id: string) {
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) throw new Error(`删除 ${resourceName} 失败`)
        
        const index = items.value.findIndex(item => item.id === id)
        if (index > -1) {
          items.value.splice(index, 1)
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : '未知错误'
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

// 使用方法
const useUsersStore = createResourceStore<User>('users', '/api/users')
const usePostsStore = createResourceStore<Post>('posts', '/api/posts')
const useCommentsStore = createResourceStore<Comment>('comments', '/api/comments')
```

### Mixin 模式

创建可以混入到 store 中的可重用功能：

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
      error.value = err instanceof Error ? err.message : '未知错误'
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

// 在 store 中使用 mixins
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
      if (!response.ok) throw new Error('获取产品失败')
      
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

### 事件驱动通信

在 store 之间实现事件驱动通信：

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

    // 返回取消订阅函数
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

  // 监听购物车事件
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
    
    // 发送到分析服务
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
      console.error('发送分析事件失败:', error)
    }
  }

  return {
    events: readonly(events),
    trackEvent
  }
})
```

## Store 依赖

### 依赖注入模式

显式管理 store 依赖：

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
    throw new Error('Store 依赖未初始化')
  }
  return dependencies.value
}

// stores/products.ts
export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const { apiClient, logger, cache } = getStoreDependencies()

  async function fetchProducts() {
    try {
      logger.info('获取产品')
      
      const cached = await cache.get('products')
      if (cached) {
        products.value = cached
        return cached
      }

      const data = await apiClient.get<Product[]>('/products')
      products.value = data
      await cache.set('products', data, 300) // 5 分钟
      
      logger.info(`获取了 ${data.length} 个产品`)
      return data
    } catch (error) {
      logger.error('获取产品失败:', error)
      throw error
    }
  }

  return {
    products: readonly(products),
    fetchProducts
  }
})
```

### 分层 Store 结构

在 store 之间创建分层关系：

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
        error.value = err instanceof Error ? err.message : '初始化失败'
        throw err
      }
    }

    async function onInitialize() {
      // 在子 store 中重写
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
    
    // 初始化子 store
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

## 测试组合的 Store

### 模拟 Store 依赖

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'
import { useNotificationsStore } from './notifications'

describe('购物车 Store 组合', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('添加商品到购物车时应该发送通知', () => {
    const cartStore = useCartStore()
    const notificationsStore = useNotificationsStore()
    
    const addNotificationSpy = vi.spyOn(notificationsStore, 'addNotification')
    
    const product = { id: '1', name: '测试产品', price: 10 }
    cartStore.addItem(product, 2)
    
    expect(addNotificationSpy).toHaveBeenCalledWith(
      '已将测试产品添加到购物车',
      'success'
    )
  })

  it('应该处理 store 初始化顺序', async () => {
    const appStore = useAppStore()
    
    appStore.registerChildStore('cart')
    appStore.registerChildStore('notifications')
    
    await appStore.initializeApp()
    
    expect(appStore.initialized).toBe(true)
  })
})
```

## 最佳实践

### 1. 避免循环依赖

```typescript
// ❌ 错误：循环依赖
// store A 使用 store B，store B 使用 store A

// ✅ 正确：使用共享 store 或事件系统
export const useSharedStore = defineStore('shared', () => {
  const sharedState = ref({})
  return { sharedState }
})
```

### 2. 保持 Store 职责清晰

```typescript
// ✅ 正确：每个 store 都有明确的职责
export const useUserStore = defineStore('user', () => {
  // 只有用户相关的状态和操作
})

export const useCartStore = defineStore('cart', () => {
  // 只有购物车相关的状态和操作
  const userStore = useUserStore() // 可以使用其他 store
})
```

### 3. 使用 TypeScript 改善组合

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

### 4. 记录 Store 关系

```typescript
/**
 * 购物车 Store
 * 
 * 依赖：
 * - useUserStore: 用于用户认证状态
 * - useProductsStore: 用于产品信息
 * - useNotificationsStore: 用于用户反馈
 * 
 * 发出的事件：
 * - cart:item-added
 * - cart:item-removed
 * - cart:cleared
 */
export const useCartStore = defineStore('cart', () => {
  // 实现
})
```

通过遵循这些模式和最佳实践，您可以创建结构良好、可维护的应用程序，其中组合的 Pinia store 可以无缝协作。