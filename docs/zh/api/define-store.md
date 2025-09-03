---
title: defineStore() API | Pinia Store 创建
description: 学习如何使用 defineStore() 创建 Pinia store。完整的 API 参考，包含 Options API 和 Composition API 风格的示例。
keywords: defineStore, Pinia store 创建, Vue 状态管理, Pinia API, store 定义, Options API, Composition API
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "defineStore() API | Pinia Store 创建" }]
  - ["meta", { property: "og:description", content: "学习如何使用 defineStore() 创建 Pinia store。完整的 API 参考，包含 Options API 和 Composition API 风格的示例。" }]
  - ["meta", { property: "og:url", content: "https://allfun.net/zh/api/define-store" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "defineStore() API | Pinia Store 创建" }]
  - ["meta", { property: "twitter:description", content: "学习如何使用 defineStore() 创建 Pinia store。完整的 API 参考，包含 Options API 和 Composition API 风格的示例。" }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/zh/api/define-store" }]
---

# defineStore()

`defineStore()` 是 Pinia 的核心函数，用于定义一个 store。它返回一个函数，调用该函数可以获取 store 实例。

## 语法

```typescript
function defineStore<Id, S, G, A>(
  id: Id,
  options: DefineStoreOptions<Id, S, G, A>
): StoreDefinition<Id, S, G, A>

function defineStore<Id, S, G, A>(
  options: DefineStoreOptions<Id, S, G, A> & { id: Id }
): StoreDefinition<Id, S, G, A>

function defineStore<Id, SS>(
  id: Id,
  storeSetup: () => SS
): StoreDefinition<Id, _ExtractStateFromSetupStore<SS>, _ExtractGettersFromSetupStore<SS>, _ExtractActionsFromSetupStore<SS>>
```

## 参数

### id
- **类型**: `string`
- **描述**: store 的唯一标识符
- **必需**: 是（除非在 options 中提供）

### options
- **类型**: `DefineStoreOptions`
- **描述**: store 的配置选项

### storeSetup
- **类型**: `() => object`
- **描述**: 组合式 API 风格的 setup 函数

## 返回值

返回一个 store 定义函数，调用该函数可以获取 store 实例。

```typescript
type StoreDefinition = () => Store
```

## 用法示例

### 选项式 API 风格

```javascript
import { defineStore } from 'pinia'

// 方式 1: 分离 id 和 options
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: '计数器'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    
    // 返回函数的 getter
    countPlusOne: (state) => {
      return (num) => state.count + num
    },
    
    // 使用其他 getter
    quadrupleCount() {
      return this.doubleCount * 2
    }
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    async incrementAsync() {
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.increment()
    }
  }
})

// 方式 2: id 包含在 options 中
export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    currentUser: null,
    users: []
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.currentUser
  },
  
  actions: {
    async login(credentials) {
      // 登录逻辑
    }
  }
})
```

### 组合式 API 风格

```javascript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // state
  const count = ref(0)
  const name = ref('计数器')
  
  // getters
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  
  // actions
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  function reset() {
    count.value = 0
  }
  
  async function incrementAsync() {
    await new Promise(resolve => setTimeout(resolve, 1000))
    increment()
  }
  
  // 返回暴露的状态和方法
  return {
    count,
    name,
    doubleCount,
    isEven,
    increment,
    decrement,
    reset,
    incrementAsync
  }
})
```

## DefineStoreOptions

### state
- **类型**: `() => object`
- **描述**: 返回 store 初始状态的函数
- **必需**: 否

```javascript
state: () => ({
  count: 0,
  user: null,
  items: []
})
```

### getters
- **类型**: `Record<string, Getter>`
- **描述**: store 的计算属性
- **必需**: 否

```javascript
getters: {
  // 基本 getter
  doubleCount: (state) => state.count * 2,
  
  // 使用其他 getter
  quadrupleCount() {
    return this.doubleCount * 2
  },
  
  // 带参数的 getter
  getUserById: (state) => {
    return (id) => state.users.find(user => user.id === id)
  },
  
  // 使用其他 store
  someGetter() {
    const otherStore = useOtherStore()
    return this.count + otherStore.count
  }
}
```

### actions
- **类型**: `Record<string, Action>`
- **描述**: store 的方法，可以修改状态
- **必需**: 否

```javascript
actions: {
  // 同步 action
  increment() {
    this.count++
  },
  
  // 异步 action
  async fetchUser(id) {
    try {
      const user = await api.getUser(id)
      this.user = user
      return user
    } catch (error) {
      console.error('获取用户失败:', error)
      throw error
    }
  },
  
  // 使用其他 store
  async syncWithOtherStore() {
    const otherStore = useOtherStore()
    await otherStore.fetchData()
    this.data = otherStore.data
  }
}
```

### hydrate
- **类型**: `(storeState, initialState) => void`
- **描述**: 用于服务端渲染的状态水合函数
- **必需**: 否

```javascript
hydrate(storeState, initialState) {
  // 自定义状态水合逻辑
  storeState.user = initialState.user
  storeState.preferences = new Map(initialState.preferences)
}
```

## TypeScript 支持

### 基本类型推断

```typescript
// TypeScript 会自动推断类型
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,        // number
    name: 'counter'  // string
  }),
  
  getters: {
    // 返回类型自动推断为 number
    doubleCount: (state) => state.count * 2
  },
  
  actions: {
    // 参数和返回类型需要显式声明
    increment(amount: number = 1): void {
      this.count += amount
    }
  }
})
```

### 显式类型定义

```typescript
interface CounterState {
  count: number
  name: string
}

interface CounterGetters {
  doubleCount: number
  isEven: boolean
}

interface CounterActions {
  increment(amount?: number): void
  decrement(amount?: number): void
  reset(): void
}

export const useCounterStore = defineStore<
  'counter',
  CounterState,
  CounterGetters,
  CounterActions
>('counter', {
  state: (): CounterState => ({
    count: 0,
    name: 'counter'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  },
  
  actions: {
    increment(amount = 1) {
      this.count += amount
    },
    
    decrement(amount = 1) {
      this.count -= amount
    },
    
    reset() {
      this.count = 0
    }
  }
})
```

### 组合式 API 的类型定义

```typescript
import { ref, computed, Ref, ComputedRef } from 'vue'

interface CounterStore {
  count: Ref<number>
  name: Ref<string>
  doubleCount: ComputedRef<number>
  increment: () => void
  decrement: () => void
}

export const useCounterStore = defineStore('counter', (): CounterStore => {
  const count = ref(0)
  const name = ref('counter')
  
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  return {
    count,
    name,
    doubleCount,
    increment,
    decrement
  }
})
```

## 高级用法

### 动态 Store ID

```javascript
function createUserStore(userId) {
  return defineStore(`user-${userId}`, {
    state: () => ({
      id: userId,
      profile: null
    }),
    
    actions: {
      async fetchProfile() {
        this.profile = await api.getUserProfile(this.id)
      }
    }
  })
}

// 使用
const useUser1Store = createUserStore(1)
const useUser2Store = createUserStore(2)
```

### Store 工厂函数

```javascript
function createResourceStore(resourceName) {
  return defineStore(resourceName, {
    state: () => ({
      items: [],
      loading: false,
      error: null
    }),
    
    actions: {
      async fetchItems() {
        this.loading = true
        this.error = null
        
        try {
          this.items = await api.get(`/${resourceName}`)
        } catch (error) {
          this.error = error.message
        } finally {
          this.loading = false
        }
      }
    }
  })
}

// 创建不同资源的 store
export const useUsersStore = createResourceStore('users')
export const useProductsStore = createResourceStore('products')
export const useOrdersStore = createResourceStore('orders')
```

### 继承和混入

```javascript
// 基础 store 配置
const baseStoreOptions = {
  state: () => ({
    loading: false,
    error: null
  }),
  
  actions: {
    setLoading(loading) {
      this.loading = loading
    },
    
    setError(error) {
      this.error = error
    }
  }
}

// 扩展基础配置
export const useUserStore = defineStore('user', {
  ...baseStoreOptions,
  
  state: () => ({
    ...baseStoreOptions.state(),
    users: [],
    currentUser: null
  }),
  
  actions: {
    ...baseStoreOptions.actions,
    
    async fetchUsers() {
      this.setLoading(true)
      this.setError(null)
      
      try {
        this.users = await api.getUsers()
      } catch (error) {
        this.setError(error.message)
      } finally {
        this.setLoading(false)
      }
    }
  }
})
```

## 常见错误

### 1. 忘记返回状态对象

```javascript
// ❌ 错误
defineStore('counter', {
  state: {
    count: 0  // 应该是函数
  }
})

// ✅ 正确
defineStore('counter', {
  state: () => ({
    count: 0
  })
})
```

### 2. 在 getter 中修改状态

```javascript
// ❌ 错误
getters: {
  doubleCount(state) {
    state.count++  // 不应该在 getter 中修改状态
    return state.count * 2
  }
}

// ✅ 正确
getters: {
  doubleCount: (state) => state.count * 2
},
actions: {
  increment() {
    this.count++  // 在 action 中修改状态
  }
}
```

### 3. 直接解构 store

```javascript
// ❌ 错误 - 失去响应性
const { count, increment } = useCounterStore()

// ✅ 正确
import { storeToRefs } from 'pinia'
const store = useCounterStore()
const { count } = storeToRefs(store)
const { increment } = store
```

## 最佳实践

1. **使用描述性的 store ID**
   ```javascript
   // ✅ 好
   defineStore('userProfile', { ... })
   defineStore('shoppingCart', { ... })
   
   // ❌ 不好
   defineStore('store1', { ... })
   defineStore('data', { ... })
   ```

2. **保持 state 的简单性**
   ```javascript
   // ✅ 好
   state: () => ({
     users: [],
     loading: false,
     error: null
   })
   
   // ❌ 避免深层嵌套
   state: () => ({
     data: {
       users: {
         list: [],
         meta: {
           loading: false,
           error: null
         }
       }
     }
   })
   ```

3. **使用 TypeScript**
   ```typescript
   // 为复杂的 store 定义接口
   interface UserState {
     currentUser: User | null
     users: User[]
     loading: boolean
   }
   ```

4. **合理组织 actions**
   ```javascript
   actions: {
     // 按功能分组
     async fetchUsers() { ... },
     async createUser() { ... },
     async updateUser() { ... },
     async deleteUser() { ... },
     
     // 辅助方法
     setLoading(loading) { ... },
     setError(error) { ... }
   }
   ```

## 相关 API

- [`createPinia()`](./create-pinia) - 创建 Pinia 实例
- [`storeToRefs()`](./store-to-refs) - 转换为响应式引用
- [Store 实例方法](./store-instance) - store 实例的方法
- [插件系统](./plugins) - 扩展 store 功能