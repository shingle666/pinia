---
title: 核心概念 - Pinia 指南
description: 学习 Pinia 状态管理的基本概念，包括 store、状态、getter 和 action。掌握 Pinia 的构建块。
keywords: Pinia, Vue.js, 核心概念, store, 状态, getter, action, 状态管理
author: Pinia Team
generator: VitePress
og:title: 核心概念 - Pinia 指南
og:description: 学习 Pinia 状态管理的基本概念，包括 store、状态、getter 和 action。掌握 Pinia 的构建块。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/core-concepts
twitter:card: summary_large_image
twitter:title: 核心概念 - Pinia 指南
twitter:description: 学习 Pinia 状态管理的基本概念，包括 store、状态、getter 和 action。掌握 Pinia 的构建块。
twitter:image: /og-image.svg
---

# 核心概念

Pinia 围绕四个核心概念构建，它们协同工作以提供强大而直观的状态管理解决方案。理解这些概念对于在 Vue.js 应用程序中有效使用 Pinia 至关重要。

## 什么是 Store？

Store 是一个包含状态、getter 和 action 的响应式实体。可以将其视为可以在应用程序中任何地方使用的组件。Store 使用 `defineStore()` 函数定义，可以在任何组件、组合式函数甚至其他 store 中使用。

```js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
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

### Store 命名

`defineStore()` 的第一个参数是 store 的唯一标识符。Pinia 使用此 ID 将 store 连接到开发工具并用于服务端渲染。

```js
// ✅ 好的命名约定
const useUserStore = defineStore('user', { /* ... */ })
const useCartStore = defineStore('cart', { /* ... */ })
const useProductStore = defineStore('product', { /* ... */ })

// ❌ 避免通用名称
const useStore = defineStore('store', { /* ... */ })
const useDataStore = defineStore('data', { /* ... */ })
```

## 状态（State）

状态是 store 的核心部分。它表示应用程序需要管理的响应式数据。在 Pinia 中，状态定义为返回对象的函数。

### 定义状态

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户信息
    user: null,
    isAuthenticated: false,
    
    // UI 状态
    isLoading: false,
    error: null,
    
    // 应用数据
    preferences: {
      theme: 'light',
      language: 'en'
    },
    
    // 集合
    notifications: [],
    recentActivity: []
  })
})
```

### 访问状态

可以直接从 store 实例访问状态：

```js
// 在组件中
const userStore = useUserStore()

// 直接访问
console.log(userStore.user)
console.log(userStore.isAuthenticated)

// 在模板中响应式访问
// <template>
//   <div v-if="userStore.isAuthenticated">
//     欢迎，{{ userStore.user.name }}！
//   </div>
// </template>
```

### 修改状态

可以直接修改状态：

```js
const userStore = useUserStore()

// 直接修改
userStore.isLoading = true
userStore.user = { name: 'John', email: 'john@example.com' }

// 修改嵌套对象
userStore.preferences.theme = 'dark'
userStore.notifications.push({ id: 1, message: '欢迎！' })
```

### 重置状态

你可以将状态重置为初始值：

```js
const userStore = useUserStore()

// 重置整个 store
userStore.$reset()
```

## Getter

Getter 是 store 的计算属性。它们允许你派生状态并缓存结果。Getter 接收状态作为第一个参数，并可以访问其他 getter。

### 基本 Getter

```js
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    tax: 0.1
  }),
  getters: {
    // 简单 getter
    itemCount: (state) => state.items.length,
    
    // 带计算的 getter
    subtotal: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    },
    
    // 访问其他 getter 的 getter
    total() {
      return this.subtotal * (1 + this.tax)
    },
    
    // 带类型注解的 getter（TypeScript）
    expensiveItems: (state): CartItem[] => {
      return state.items.filter(item => item.price > 100)
    }
  }
})
```

### 带参数的 Getter

Getter 可以返回函数以接受参数：

```js
export const useProductStore = defineStore('product', {
  state: () => ({
    products: []
  }),
  getters: {
    getProductById: (state) => {
      return (productId) => {
        return state.products.find(product => product.id === productId)
      }
    },
    
    getProductsByCategory: (state) => {
      return (category) => {
        return state.products.filter(product => product.category === category)
      }
    },
    
    searchProducts: (state) => {
      return (query) => {
        return state.products.filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase())
        )
      }
    }
  }
})

// 使用
const productStore = useProductStore()
const product = productStore.getProductById('123')
const electronics = productStore.getProductsByCategory('electronics')
const searchResults = productStore.searchProducts('laptop')
```

### 在 Getter 中访问其他 Store

```js
export const useCartStore = defineStore('cart', {
  getters: {
    cartSummary() {
      const userStore = useUserStore()
      const productStore = useProductStore()
      
      return {
        items: this.items.map(item => ({
          ...item,
          product: productStore.getProductById(item.productId)
        })),
        user: userStore.user,
        total: this.total
      }
    }
  }
})
```

## Action

Action 是可以包含任意逻辑（包括异步操作）的方法。它们相当于组件中的方法，是放置业务逻辑的地方。

### 同步 Action

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    incrementBy(amount) {
      this.count += amount
    },
    
    reset() {
      this.count = 0
    }
  }
})
```

### 异步 Action

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isLoading: false,
    error: null
  }),
  actions: {
    async fetchUser(userId) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          throw new Error('获取用户失败')
        }
        this.user = await response.json()
      } catch (error) {
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },
    
    async updateUser(userData) {
      this.isLoading = true
      
      try {
        const response = await fetch(`/api/users/${this.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
        
        if (!response.ok) {
          throw new Error('更新用户失败')
        }
        
        this.user = await response.json()
      } catch (error) {
        this.error = error.message
        throw error // 重新抛出以允许组件处理
      } finally {
        this.isLoading = false
      }
    }
  }
})
```

### Action 调用其他 Action

```js
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null
  }),
  actions: {
    async login(credentials) {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      this.token = data.token
      
      // 调用另一个 action
      await this.fetchUserProfile()
    },
    
    async fetchUserProfile() {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })
      
      this.user = await response.json()
    },
    
    logout() {
      this.token = null
      this.user = null
      
      // 调用其他 store 的 action
      const cartStore = useCartStore()
      cartStore.clearCart()
    }
  }
})
```

## Store 组合

Store 可以使用其他 store，实现强大的组合模式：

```js
// 用户 store
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    preferences: {}
  }),
  actions: {
    async fetchUser(id) {
      // 获取用户逻辑
    }
  }
})

// 使用用户 store 的购物车 store
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  getters: {
    cartWithUserInfo() {
      const userStore = useUserStore()
      return {
        items: this.items,
        user: userStore.user,
        appliedDiscounts: this.calculateDiscounts(userStore.user)
      }
    }
  },
  actions: {
    calculateDiscounts(user) {
      // 根据用户数据计算折扣
      if (user?.isPremium) {
        return 0.1 // 高级用户 10% 折扣
      }
      return 0
    },
    
    async checkout() {
      const userStore = useUserStore()
      
      if (!userStore.user) {
        throw new Error('用户必须登录才能结账')
      }
      
      // 结账逻辑
    }
  }
})
```

## 在组件中使用 Store

### 选项式 API

```js
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment', 'incrementBy'])
  }
}
```

### 组合式 API

```js
import { useCounterStore } from '@/stores/counter'

export default {
  setup() {
    const counterStore = useCounterStore()
    
    return {
      // 直接访问
      counterStore,
      
      // 解构（失去响应性）
      // count: counterStore.count,
      
      // 使用 storeToRefs 进行响应式解构
      ...storeToRefs(counterStore)
    }
  }
}
```

### Script Setup

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, incrementBy } = counterStore
</script>

<template>
  <div>
    <p>计数：{{ count }}</p>
    <p>双倍：{{ doubleCount }}</p>
    <button @click="increment">+1</button>
    <button @click="incrementBy(5)">+5</button>
  </div>
</template>
```

## 最佳实践

### 1. 保持 Store 专注

每个 store 应该有单一职责：

```js
// ✅ 好的做法 - 专注的 store
const useUserStore = defineStore('user', { /* 用户相关状态 */ })
const useCartStore = defineStore('cart', { /* 购物车相关状态 */ })
const useProductStore = defineStore('product', { /* 产品相关状态 */ })

// ❌ 避免 - 单体 store
const useAppStore = defineStore('app', {
  state: () => ({
    user: {},
    cart: {},
    products: {},
    ui: {},
    // ... 所有东西
  })
})
```

### 2. 在 Action 中使用业务逻辑

```js
// ✅ 好的做法 - 业务逻辑在 action 中
actions: {
  async addToCart(product, quantity = 1) {
    // 验证
    if (quantity <= 0) {
      throw new Error('数量必须为正数')
    }
    
    // 检查库存
    const productStore = useProductStore()
    if (!productStore.isInStock(product.id, quantity)) {
      throw new Error('库存不足')
    }
    
    // 添加到购物车
    const existingItem = this.items.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      this.items.push({ ...product, quantity })
    }
    
    // 更新库存
    productStore.decreaseStock(product.id, quantity)
  }
}

// ❌ 避免 - 业务逻辑在组件中
// 组件应该只调用 action
```

### 3. 使用 Getter 处理计算值

```js
// ✅ 好的做法 - 计算值作为 getter
getters: {
  totalPrice: (state) => {
    return state.items.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  },
  
  formattedTotal() {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(this.totalPrice)
  }
}

// ❌ 避免 - 在组件中重复计算
```

### 4. 优雅地处理错误

```js
actions: {
  async fetchData() {
    this.isLoading = true
    this.error = null
    
    try {
      const data = await api.fetchData()
      this.data = data
    } catch (error) {
      this.error = error.message
      console.error('获取数据失败：', error)
    } finally {
      this.isLoading = false
    }
  }
}
```

## 下一步

现在你了解了核心概念，探索：

- [状态管理](./state) - 高级状态管理模式
- [TypeScript](./typescript) - 在 TypeScript 中使用 Pinia
- [插件](./plugins) - 使用自定义功能扩展 Pinia
- [测试](./testing) - 有效测试你的 store