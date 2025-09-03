---
title: TypeScript - Pinia 指南
description: 学习如何在 TypeScript 中使用 Pinia 进行类型安全的状态管理。了解 store 类型定义、类型推断和高级 TypeScript 模式。
keywords: Pinia, Vue.js, TypeScript, 类型安全, store 类型, 类型推断
author: Pinia Team
generator: VitePress
og:title: TypeScript - Pinia 指南
og:description: 学习如何在 TypeScript 中使用 Pinia 进行类型安全的状态管理。了解 store 类型定义、类型推断和高级 TypeScript 模式。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/typescript
twitter:card: summary_large_image
twitter:title: TypeScript - Pinia 指南
twitter:description: 学习如何在 TypeScript 中使用 Pinia 进行类型安全的状态管理。了解 store 类型定义、类型推断和高级 TypeScript 模式。
twitter:image: /og-image.svg
---

# TypeScript

Pinia 提供开箱即用的一流 TypeScript 支持。本指南介绍如何利用 TypeScript 与 Pinia 进行类型安全的状态管理。

## 基本设置

Pinia 使用 TypeScript 编写，无需额外配置即可提供出色的类型推断：

```ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo'
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

## 类型推断

Pinia 自动推断你的 store 类型：

```ts
const store = useCounterStore()

// TypeScript 知道这些类型：
store.count // number
store.name // string
store.doubleCount // number (getter)
store.increment() // void (action)
```

## 状态类型定义

### 基本状态类型

```ts
interface UserInfo {
  name: string
  email: string
  age?: number
}

export const useUserStore = defineStore('user', {
  state: (): { user: UserInfo | null; isLoading: boolean } => ({
    user: null,
    isLoading: false
  })
})
```

### 复杂状态类型

```ts
interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  discountCode?: string
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    total: 0,
    discountCode: undefined
  })
})
```

## Getter 类型定义

Getter 根据其返回值自动推断类型：

```ts
export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    total: 0
  }),
  getters: {
    // 自动推断为 number
    itemCount: (state) => state.items.length,
    
    // 显式类型的 getter
    expensiveItems: (state): CartItem[] => {
      return state.items.filter(item => item.price > 100)
    },
    
    // 带参数的 getter（返回函数）
    getItemById: (state) => {
      return (id: string): CartItem | undefined => {
        return state.items.find(item => item.id === id)
      }
    }
  }
})
```

## Action 类型定义

Action 根据其参数和返回值自动推断类型：

```ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as UserInfo | null,
    isLoading: false
  }),
  actions: {
    // 带类型参数的异步 action
    async fetchUser(userId: string): Promise<UserInfo> {
      this.isLoading = true
      try {
        const response = await fetch(`/api/users/${userId}`)
        const user = await response.json() as UserInfo
        this.user = user
        return user
      } finally {
        this.isLoading = false
      }
    },
    
    // 带类型参数的 action
    updateUser(updates: Partial<UserInfo>): void {
      if (this.user) {
        this.user = { ...this.user, ...updates }
      }
    }
  }
})
```

## 组合式 API Store

使用组合式 API 时，TypeScript 推断无缝工作：

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface Todo {
  id: string
  text: string
  completed: boolean
}

export const useTodoStore = defineStore('todo', () => {
  // 状态
  const todos = ref<Todo[]>([])
  const filter = ref<'all' | 'active' | 'completed'>('all')
  
  // Getter
  const filteredTodos = computed(() => {
    switch (filter.value) {
      case 'active':
        return todos.value.filter(todo => !todo.completed)
      case 'completed':
        return todos.value.filter(todo => todo.completed)
      default:
        return todos.value
    }
  })
  
  const completedCount = computed(() => 
    todos.value.filter(todo => todo.completed).length
  )
  
  // Action
  function addTodo(text: string): void {
    todos.value.push({
      id: Date.now().toString(),
      text,
      completed: false
    })
  }
  
  function toggleTodo(id: string): void {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }
  
  function removeTodo(id: string): void {
    const index = todos.value.findIndex(t => t.id === id)
    if (index > -1) {
      todos.value.splice(index, 1)
    }
  }
  
  return {
    // 状态
    todos,
    filter,
    // Getter
    filteredTodos,
    completedCount,
    // Action
    addTodo,
    toggleTodo,
    removeTodo
  }
})
```

## Store 类型工具

Pinia 提供用于提取 store 类型的工具类型：

```ts
import type { Store } from 'pinia'

// 提取 store 类型
type CounterStore = ReturnType<typeof useCounterStore>

// 或使用 Store 工具类型
type CounterStoreType = Store<
  'counter',
  { count: number; name: string },
  { doubleCount: number },
  { increment(): void }
>
```

## 插件类型定义

创建插件时，你可以为上下文添加类型：

```ts
import type { PiniaPluginContext } from 'pinia'

function myPlugin(context: PiniaPluginContext) {
  const { store, app, pinia, options } = context
  
  // 为 store 添加类型化属性
  store.$customProperty = 'Hello'
}

// 扩展 PiniaCustomProperties 接口
declare module 'pinia' {
  export interface PiniaCustomProperties {
    $customProperty: string
  }
}
```

## 高级类型模式

### 泛型 Store

```ts
function createResourceStore<T>(name: string) {
  return defineStore(name, {
    state: () => ({
      items: [] as T[],
      loading: false,
      error: null as string | null
    }),
    actions: {
      async fetchItems(): Promise<T[]> {
        this.loading = true
        this.error = null
        try {
          const response = await fetch(`/api/${name}`)
          const items = await response.json() as T[]
          this.items = items
          return items
        } catch (error) {
          this.error = error instanceof Error ? error.message : '未知错误'
          throw error
        } finally {
          this.loading = false
        }
      }
    }
  })
}

// 使用
interface User {
  id: string
  name: string
  email: string
}

const useUserStore = createResourceStore<User>('users')
```

### 严格状态类型

```ts
// 定义严格接口
interface StrictUserState {
  readonly id: string | null
  readonly profile: UserProfile | null
  readonly preferences: UserPreferences
  readonly lastLoginAt: Date | null
}

interface UserProfile {
  readonly name: string
  readonly email: string
  readonly avatar?: string
}

interface UserPreferences {
  readonly theme: 'light' | 'dark'
  readonly language: 'en' | 'es' | 'fr'
  readonly notifications: boolean
}

export const useUserStore = defineStore('user', {
  state: (): StrictUserState => ({
    id: null,
    profile: null,
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    },
    lastLoginAt: null
  })
})
```

### 类型化 Store 组合

```ts
// 基础 store 接口
interface BaseStore {
  loading: boolean
  error: string | null
}

// 加载状态混入
function withLoading<T extends Record<string, any>>(store: T) {
  return {
    ...store,
    loading: false,
    error: null as string | null,
    
    setLoading(loading: boolean) {
      this.loading = loading
    },
    
    setError(error: string | null) {
      this.error = error
    }
  }
}

// 使用
export const useApiStore = defineStore('api', () => {
  const baseStore = withLoading({
    data: ref<any[]>([]),
    
    async fetchData() {
      this.setLoading(true)
      this.setError(null)
      try {
        // 获取逻辑
      } catch (error) {
        this.setError(error instanceof Error ? error.message : '未知错误')
      } finally {
        this.setLoading(false)
      }
    }
  })
  
  return baseStore
})
```

## 最佳实践

### 1. 定义接口

始终为复杂状态定义接口：

```ts
// ✅ 好的做法
interface UserState {
  user: User | null
  isAuthenticated: boolean
}

// ❌ 避免
const state = {
  user: null,
  isAuthenticated: false
}
```

### 2. 谨慎使用类型断言

```ts
// ✅ 好的做法 - 带验证
async fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()
  
  // 验证数据结构
  if (isValidUser(data)) {
    this.user = data as User
  } else {
    throw new Error('无效的用户数据')
  }
}

// ❌ 避免 - 盲目断言
async fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`)
  this.user = await response.json() as User
}
```

### 3. 利用类型守卫

```ts
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string'
}

// 在 action 中使用
actions: {
  setUser(userData: unknown) {
    if (isUser(userData)) {
      this.user = userData
    } else {
      throw new Error('无效的用户数据')
    }
  }
}
```

### 4. 导出 Store 类型

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  // ... store 定义
})

// 导出 store 类型供其他文件使用
export type UserStore = ReturnType<typeof useUserStore>
```

## 常见 TypeScript 问题

### 问题：状态类型推断

```ts
// ❌ 问题：TypeScript 无法推断正确类型
state: () => ({
  user: null, // 推断为 null，而不是 User | null
  items: [] // 推断为 never[]，而不是 Item[]
})

// ✅ 解决方案：显式类型
state: (): { user: User | null; items: Item[] } => ({
  user: null,
  items: []
})
```

### 问题：Getter 返回类型

```ts
// ❌ 问题：复杂 getter 没有显式返回类型
getters: {
  complexCalculation(state) {
    // TypeScript 无法推断的复杂逻辑
    return someComplexCalculation(state)
  }
}

// ✅ 解决方案：显式返回类型
getters: {
  complexCalculation(state): CalculationResult {
    return someComplexCalculation(state)
  }
}
```

## 下一步

现在你了解了 TypeScript 与 Pinia，探索：

- [核心概念](./core-concepts) - 了解 Pinia 的基本概念
- [插件](./plugins) - 使用自定义功能扩展 Pinia
- [测试](./testing) - 有效测试你的类型化 store