---
title: Pinia 快速开始 | 快速入门指南
description: 快速上手 Pinia。学习如何创建 store、管理状态，并在 Vue.js 应用中使用 Pinia，包含实用示例。
keywords: Pinia 快速开始, Vue 状态管理教程, Pinia stores, Vue.js 快速入门, 状态管理指南
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "Pinia 快速开始 | 快速入门指南" }]
  - ["meta", { property: "og:description", content: "快速上手 Pinia。学习如何创建 store、管理状态，并在 Vue.js 应用中使用 Pinia，包含实用示例。" }]
  - ["meta", { property: "og:url", content: "https://allfun.net/zh/guide/getting-started" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Pinia 快速开始 | 快速入门指南" }]
  - ["meta", { property: "twitter:description", content: "快速上手 Pinia。学习如何创建 store、管理状态，并在 Vue.js 应用中使用 Pinia，包含实用示例。" }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/zh/guide/getting-started" }]
---

# 快速开始

本指南将带您快速上手 Pinia，创建您的第一个 store 并在组件中使用它。

## 前提条件

在开始之前，请确保您已经：

- ✅ [安装了 Pinia](./installation)
- ✅ 在应用中配置了 Pinia 实例
- ✅ 对 Vue.js 有基本了解

## 创建您的第一个 Store

让我们创建一个简单的计数器 store：

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // 状态
  state: () => ({
    count: 0,
    name: '计数器'
  }),
  
  // 计算属性
  getters: {
    doubleCount: (state) => state.count * 2,
    
    // 带参数的 getter
    countPlusOne: (state) => {
      return (num) => state.count + num
    }
  },
  
  // 方法
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    reset() {
      this.count = 0
    },
    
    // 异步 action
    async incrementAsync() {
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.increment()
    }
  }
})
```

## 在组件中使用 Store

### 基本用法

```vue
<template>
  <div class="counter">
    <h2>{{ counter.name }}</h2>
    <p>当前计数: {{ counter.count }}</p>
    <p>双倍计数: {{ counter.doubleCount }}</p>
    <p>计数 + 10: {{ counter.countPlusOne(10) }}</p>
    
    <div class="buttons">
      <button @click="counter.increment()">+1</button>
      <button @click="counter.decrement()">-1</button>
      <button @click="counter.reset()">重置</button>
      <button @click="counter.incrementAsync()" :disabled="loading">
        {{ loading ? '加载中...' : '异步 +1' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
const loading = ref(false)

// 监听异步操作
const handleAsyncIncrement = async () => {
  loading.value = true
  await counter.incrementAsync()
  loading.value = false
}
</script>

<style scoped>
.counter {
  text-align: center;
  padding: 20px;
}

.buttons {
  margin-top: 20px;
}

.buttons button {
  margin: 0 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.buttons button:hover {
  background: #0056b3;
}

.buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

### 解构使用

如果您只需要使用 store 的部分功能，可以使用解构：

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

// 解构响应式状态和 getters
const { count, doubleCount } = storeToRefs(counterStore)

// 解构 actions（不需要 storeToRefs）
const { increment, decrement, reset } = counterStore
</script>
```

::: warning 注意
直接解构 store 会失去响应性！必须使用 `storeToRefs()` 来保持响应性。
:::

## 组合式 API 风格

Pinia 也支持组合式 API 风格的 store 定义：

```javascript
// stores/counter.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // state
  const count = ref(0)
  const name = ref('计数器')
  
  // getters
  const doubleCount = computed(() => count.value * 2)
  
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
  
  return {
    count,
    name,
    doubleCount,
    increment,
    decrement,
    reset,
    incrementAsync
  }
})
```

## 实际应用示例

让我们创建一个更实际的用户管理 store：

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { api } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    users: [],
    loading: false,
    error: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    
    isAdmin: (state) => {
      return state.currentUser?.role === 'admin'
    },
    
    getUserById: (state) => {
      return (id) => state.users.find(user => user.id === id)
    }
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const user = await api.login(credentials)
        this.currentUser = user
        
        // 保存到 localStorage
        localStorage.setItem('user', JSON.stringify(user))
        
        return user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.currentUser = null
      localStorage.removeItem('user')
    },
    
    async fetchUsers() {
      this.loading = true
      
      try {
        const users = await api.getUsers()
        this.users = users
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    // 从 localStorage 恢复用户状态
    restoreUser() {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
      }
    }
  }
})
```

在组件中使用：

```vue
<template>
  <div>
    <div v-if="!user.isLoggedIn">
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="邮箱" required>
        <input v-model="password" type="password" placeholder="密码" required>
        <button type="submit" :disabled="user.loading">
          {{ user.loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p v-if="user.error" class="error">{{ user.error }}</p>
    </div>
    
    <div v-else>
      <h2>欢迎，{{ user.currentUser.name }}！</h2>
      <p v-if="user.isAdmin">您是管理员</p>
      <button @click="user.logout()">退出登录</button>
      
      <div v-if="user.isAdmin">
        <h3>用户列表</h3>
        <button @click="user.fetchUsers()" :disabled="user.loading">
          {{ user.loading ? '加载中...' : '刷新用户列表' }}
        </button>
        <ul>
          <li v-for="u in user.users" :key="u.id">
            {{ u.name }} ({{ u.email }})
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const user = useUserStore()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await user.login({
      email: email.value,
      password: password.value
    })
    
    // 登录成功后的操作
    if (user.isAdmin) {
      await user.fetchUsers()
    }
  } catch (error) {
    // 错误已经在 store 中处理
    console.error('登录失败:', error)
  }
}

// 应用启动时恢复用户状态
onMounted(() => {
  user.restoreUser()
})
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 300px;
}

input, button {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

## 多个 Store 的协作

在实际应用中，您可能需要多个 store 协作：

```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useProductStore } from './product'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    loading: false
  }),
  
  getters: {
    totalPrice: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    },
    
    itemCount: (state) => {
      return state.items.reduce((count, item) => count + item.quantity, 0)
    }
  },
  
  actions: {
    addItem(product, quantity = 1) {
      const userStore = useUserStore()
      
      // 检查用户是否登录
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      const existingItem = this.items.find(item => item.id === product.id)
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({
          ...product,
          quantity
        })
      }
    },
    
    removeItem(productId) {
      const index = this.items.findIndex(item => item.id === productId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    },
    
    async checkout() {
      const userStore = useUserStore()
      
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      this.loading = true
      
      try {
        const order = await api.createOrder({
          userId: userStore.currentUser.id,
          items: this.items,
          total: this.totalPrice
        })
        
        // 清空购物车
        this.items = []
        
        return order
      } finally {
        this.loading = false
      }
    }
  }
})
```

## 常见模式和最佳实践

### 1. 错误处理

```javascript
actions: {
  async fetchData() {
    this.loading = true
    this.error = null
    
    try {
      const data = await api.getData()
      this.data = data
    } catch (error) {
      this.error = error.message
      // 可以选择重新抛出错误
      throw error
    } finally {
      this.loading = false
    }
  }
}
```

### 2. 状态重置

```javascript
actions: {
  $reset() {
    // 重置到初始状态
    Object.assign(this, {
      data: [],
      loading: false,
      error: null
    })
  }
}
```

### 3. 状态持久化

```javascript
actions: {
  saveToStorage() {
    localStorage.setItem('myStore', JSON.stringify(this.$state))
  },
  
  loadFromStorage() {
    const saved = localStorage.getItem('myStore')
    if (saved) {
      this.$patch(JSON.parse(saved))
    }
  }
}
```

## 下一步

恭喜！您已经学会了 Pinia 的基本用法。接下来您可以学习：

- [定义 Store](./defining-stores) - 深入了解 store 的定义方式
- [State 状态管理](./state) - 学习状态的高级用法
- [Getters 计算属性](./getters) - 掌握 getters 的各种用法
- [Actions 动作](./actions) - 了解 actions 的最佳实践
- [插件系统](./plugins) - 扩展 Pinia 功能

继续探索 Pinia 的强大功能吧！🎉