---
title: 性能优化
description: 学习如何优化 Pinia store 以获得更好的性能，包括懒加载、计算属性优化、内存管理和最佳实践。
head:
  - [meta, { name: description, content: "学习如何优化 Pinia store 以获得更好的性能，包括懒加载、计算属性优化、内存管理和最佳实践。" }]
  - [meta, { name: keywords, content: "Pinia 性能, Vue 优化, 状态管理性能, 懒加载" }]
  - [meta, { property: "og:title", content: "性能优化 - Pinia" }]
  - [meta, { property: "og:description", content: "学习如何优化 Pinia store 以获得更好的性能，包括懒加载、计算属性优化、内存管理和最佳实践。" }]
---

# 性能优化

本指南涵盖了优化 Pinia store 和 Vue 应用程序性能的各种技术。

## Store 优化

### 懒加载 Store

只在需要时加载 store，以减少初始包大小并提高启动性能。

```ts
// stores/index.ts
export const useUserStore = () => import('./user').then(m => m.useUserStore)
export const useProductStore = () => import('./product').then(m => m.useProductStore)

// 在组件中使用
<script setup>
const loadUserStore = async () => {
  const { useUserStore } = await import('@/stores/user')
  return useUserStore()
}

const userStore = await loadUserStore()
</script>
```

### Store 拆分

将大型 store 拆分为更小、更专注的 store，以提高可维护性和性能。

```ts
// 避免使用一个大型 store
const useLargeStore = defineStore('large', () => {
  const users = ref([])
  const products = ref([])
  const orders = ref([])
  // ... 更多状态
})

// 拆分为专注的 store
const useUserStore = defineStore('user', () => {
  const users = ref([])
  const currentUser = ref(null)
  
  const fetchUsers = async () => {
    // 实现
  }
  
  return { users, currentUser, fetchUsers }
})

const useProductStore = defineStore('product', () => {
  const products = ref([])
  const categories = ref([])
  
  const fetchProducts = async () => {
    // 实现
  }
  
  return { products, categories, fetchProducts }
})
```

## 状态优化

### 计算属性

使用计算属性处理派生状态，避免不必要的重新计算。

```ts
const useProductStore = defineStore('product', () => {
  const products = ref([])
  const filters = ref({ category: '', priceRange: [0, 1000] })
  
  // 高效的计算属性
  const filteredProducts = computed(() => {
    return products.value.filter(product => {
      const matchesCategory = !filters.value.category || 
        product.category === filters.value.category
      const matchesPrice = product.price >= filters.value.priceRange[0] && 
        product.price <= filters.value.priceRange[1]
      
      return matchesCategory && matchesPrice
    })
  })
  
  // 昂贵的操作应该使用计算属性
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

### 浅层响应式

对于不需要深层响应式的大型对象，使用 `shallowRef`。

```ts
import { shallowRef, triggerRef } from 'vue'

const useDataStore = defineStore('data', () => {
  // 对于作为整体变化的大型数据集
  const largeDataset = shallowRef([])
  
  const updateDataset = (newData) => {
    largeDataset.value = newData
    triggerRef(largeDataset) // 手动触发响应式
  }
  
  return { largeDataset, updateDataset }
})
```

### 选择性响应式

只让必要的属性具有响应式。

```ts
const useConfigStore = defineStore('config', () => {
  // 用于 UI 更新的响应式
  const theme = ref('light')
  const language = ref('en')
  
  // 静态配置的非响应式
  const apiEndpoints = {
    users: '/api/users',
    products: '/api/products'
  }
  
  // 仅在需要时响应式
  const debugMode = ref(false)
  
  return {
    theme,
    language,
    apiEndpoints,
    debugMode
  }
})
```

## Action 优化

### 防抖 Actions

对频繁的 action 进行防抖以减少 API 调用。

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
  
  // 防抖搜索以避免过多的 API 调用
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

### 批量操作

批量处理多个操作以减少响应式开销。

```ts
const useCartStore = defineStore('cart', () => {
  const items = ref([])
  
  // 低效：每个项目都触发响应式
  const addMultipleItemsInefficient = (newItems) => {
    newItems.forEach(item => {
      items.value.push(item)
    })
  }
  
  // 高效：单次响应式触发
  const addMultipleItems = (newItems) => {
    items.value = [...items.value, ...newItems]
  }
  
  // 使用 $patch 进行多个更新
  const updateCart = (updates) => {
    // 批量多个状态更新
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

### 异步 Action 优化

通过缓存和请求去重优化异步 action。

```ts
const useUserStore = defineStore('user', () => {
  const users = ref(new Map())
  const loading = ref(new Set())
  
  // 缓存和去重请求
  const fetchUser = async (userId: string) => {
    // 如果有缓存则返回缓存的用户
    if (users.value.has(userId)) {
      return users.value.get(userId)
    }
    
    // 防止重复请求
    if (loading.value.has(userId)) {
      // 等待正在进行的请求
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

## 内存管理

### Store 清理

在不再需要时清理 store。

```ts
const useTemporaryStore = defineStore('temporary', () => {
  const data = ref([])
  const subscriptions = ref([])
  
  const cleanup = () => {
    // 清理数据
    data.value = []
    
    // 取消外部订阅
    subscriptions.value.forEach(unsubscribe => unsubscribe())
    subscriptions.value = []
  }
  
  // 在卸载时自动清理
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    data,
    cleanup
  }
})
```

### 弱引用

对临时数据使用弱引用。

```ts
const useCacheStore = defineStore('cache', () => {
  const cache = new WeakMap()
  const tempData = new Map()
  
  const setTempData = (key: string, value: any, ttl: number = 5000) => {
    tempData.set(key, value)
    
    // TTL 后自动清理
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

## 组件集成

### 选择性 Store 使用

在组件中只使用 store 的必要部分。

```vue
<script setup>
// 避免使用整个 store
const store = useProductStore()

// 只使用需要的部分
const { products, loading } = storeToRefs(useProductStore())
const { fetchProducts } = useProductStore()

// 或者为特定数据使用计算属性
const featuredProducts = computed(() => 
  useProductStore().products.filter(p => p.featured)
)
</script>
```

### 条件性 Store 加载

根据组件需求有条件地加载 store。

```vue
<script setup>
const props = defineProps<{
  showUserData: boolean
  showProductData: boolean
}>()

// 条件性 store 加载
const userStore = props.showUserData ? useUserStore() : null
const productStore = props.showProductData ? useProductStore() : null

// 或使用动态导入
const loadStoreData = async () => {
  if (props.showUserData) {
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()
    await userStore.fetchUsers()
  }
}
</script>
```

## 包优化

### Tree Shaking

构建 store 以启用有效的 tree shaking。

```ts
// stores/user/index.ts
export { useUserStore } from './store'
export { userHelpers } from './helpers'
export type { User, UserState } from './types'

// stores/user/store.ts
export const useUserStore = defineStore('user', () => {
  // Store 实现
})

// stores/user/helpers.ts
export const userHelpers = {
  formatUserName: (user) => `${user.firstName} ${user.lastName}`,
  isUserActive: (user) => user.status === 'active'
}
```

### 代码分割

按功能分割 store 代码。

```ts
// stores/user/actions.ts
export const createUserActions = () => {
  const login = async (credentials) => {
    // 实现
  }
  
  const logout = () => {
    // 实现
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

## 性能监控

### Store 性能跟踪

在开发中监控 store 性能。

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
          console.log(`Action ${actionName} 耗时 ${duration.toFixed(2)}ms`)
          
          const current = metrics.value.get(actionName) || []
          current.push(duration)
          metrics.value.set(actionName, current)
        }
        
        return result
      } catch (error) {
        const duration = performance.now() - start
        console.error(`Action ${actionName} 在 ${duration.toFixed(2)}ms 后失败`, error)
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

### 内存使用监控

监控 store 的内存使用。

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
      
      // 只保留最后 100 条记录
      if (memoryUsage.value.length > 100) {
        memoryUsage.value = memoryUsage.value.slice(-100)
      }
    }
  }
  
  // 在开发环境中每 5 秒记录一次内存使用
  if (import.meta.env.DEV) {
    setInterval(recordMemoryUsage, 5000)
  }
  
  return {
    memoryUsage,
    recordMemoryUsage
  }
})
```

## 最佳实践

### 性能检查清单

- ✅ 为派生状态使用计算属性
- ✅ 为大型 store 实现懒加载
- ✅ 对频繁的 action 进行防抖
- ✅ 尽可能批量状态更新
- ✅ 清理 store 和订阅
- ✅ 使用选择性响应式
- ✅ 为昂贵操作实现缓存
- ✅ 在开发中监控性能
- ✅ 将大型 store 拆分为更小的
- ✅ 使用 tree shaking 和代码分割

### 常见性能陷阱

1. **过度响应式**：在不需要时让所有东西都响应式
2. **大型对象**：对大型对象进行深层响应式
3. **频繁更新**：不批量状态更新
4. **内存泄漏**：不清理订阅
5. **不必要的计算**：不使用计算属性
6. **包膨胀**：预先加载所有 store

### 性能测试

```ts
// performance.test.ts
import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/product'

describe('Store 性能', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('应该高效处理大型数据集', () => {
    const store = useProductStore()
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: Math.random() * 100
    }))
    
    const start = performance.now()
    store.setProducts(largeDataset)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(100) // 应该在 100ms 内完成
  })
  
  it('应该高效过滤大型数据集', () => {
    const store = useProductStore()
    // 设置大型数据集
    
    const start = performance.now()
    const filtered = store.filteredProducts
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(50)
  })
})
```

## 相关资源

- [Vue 性能指南](https://cn.vuejs.org/guide/best-practices/performance.html)
- [Pinia DevTools](../ecosystem/devtools.md)
- [测试指南](./testing.md)
- [TypeScript 指南](./typescript.md)