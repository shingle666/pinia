---
title: 从 Vuex 迁移 - Pinia 指南
description: 从 Vuex 迁移到 Pinia 的完整指南，包含分步说明、代码示例和最佳实践。
keywords: Pinia, Vuex, 迁移, Vue.js, 状态管理, 升级指南
author: Pinia Team
generator: VitePress
og:title: 从 Vuex 迁移 - Pinia 指南
og:description: 从 Vuex 迁移到 Pinia 的完整指南，包含分步说明、代码示例和最佳实践。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/migration-from-vuex
twitter:card: summary_large_image
twitter:title: 从 Vuex 迁移 - Pinia 指南
twitter:description: 从 Vuex 迁移到 Pinia 的完整指南，包含分步说明、代码示例和最佳实践。
twitter:image: /og-image.svg
---

# 从 Vuex 迁移

本指南将帮助您将现有的 Vuex store 迁移到 Pinia。我们将介绍两个库之间的差异，提供分步迁移说明，并向您展示如何利用 Pinia 的改进功能。

## 为什么要迁移到 Pinia？

Pinia 相比 Vuex 提供了几个优势：

- **更好的 TypeScript 支持**：完整的类型安全，无需复杂的类型体操
- **更简单的 API**：没有 mutations，更少的样板代码
- **模块化设计**：每个 store 都是独立的
- **DevTools 支持**：增强的调试体验
- **Tree-shaking**：更好的包优化
- **服务端渲染**：内置 SSR 支持
- **热模块替换**：更好的开发体验

## 主要差异

### Store 结构

**Vuex：**
```js
// store/index.js
import { createStore } from 'vuex'
import user from './modules/user'
import cart from './modules/cart'

export default createStore({
  modules: {
    user,
    cart
  }
})
```

**Pinia：**
```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  // store 定义
})

// stores/cart.ts
export const useCartStore = defineStore('cart', {
  // store 定义
})
```

### 状态管理

**Vuex：**
```js
// 状态变更需要 mutations
const mutations = {
  SET_USER(state, user) {
    state.user = user
  },
  INCREMENT_COUNT(state) {
    state.count++
  }
}

const actions = {
  async fetchUser({ commit }, id) {
    const user = await api.getUser(id)
    commit('SET_USER', user)
  }
}
```

**Pinia：**
```ts
// 在 actions 中直接修改状态
const actions = {
  async fetchUser(id: number) {
    const user = await api.getUser(id)
    this.user = user // 直接修改
  },
  
  increment() {
    this.count++ // 直接修改
  }
}
```

## 迁移步骤

### 步骤 1：安装 Pinia

```bash
npm uninstall vuex
npm install pinia
```

### 步骤 2：更新主应用

**之前（Vuex）：**
```js
// main.js
import { createApp } from 'vue'
import { createStore } from 'vuex'
import App from './App.vue'
import store from './store'

const app = createApp(App)
app.use(store)
app.mount('#app')
```

**之后（Pinia）：**
```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### 步骤 3：转换 Store 模块

让我们将一个典型的 Vuex 模块迁移到 Pinia：

**Vuex 模块：**
```js
// store/modules/user.js
const state = {
  user: null,
  users: [],
  loading: false,
  error: null
}

const getters = {
  isLoggedIn: (state) => !!state.user,
  userCount: (state) => state.users.length,
  getUserById: (state) => (id) => {
    return state.users.find(user => user.id === id)
  }
}

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_USERS(state, users) {
    state.users = users
  },
  ADD_USER(state, user) {
    state.users.push(user)
  },
  UPDATE_USER(state, updatedUser) {
    const index = state.users.findIndex(user => user.id === updatedUser.id)
    if (index !== -1) {
      state.users[index] = updatedUser
    }
  },
  REMOVE_USER(state, userId) {
    state.users = state.users.filter(user => user.id !== userId)
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async login({ commit }, credentials) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const user = await api.login(credentials)
      commit('SET_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async fetchUsers({ commit }) {
    commit('SET_LOADING', true)
    try {
      const users = await api.getUsers()
      commit('SET_USERS', users)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async createUser({ commit }, userData) {
    try {
      const user = await api.createUser(userData)
      commit('ADD_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  async updateUser({ commit }, user) {
    try {
      const updatedUser = await api.updateUser(user)
      commit('UPDATE_USER', updatedUser)
      return updatedUser
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  async deleteUser({ commit }, userId) {
    try {
      await api.deleteUser(userId)
      commit('REMOVE_USER', userId)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  logout({ commit }) {
    commit('SET_USER', null)
    // 如果需要，清除其他用户相关状态
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
```

**Pinia Store：**
```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { api } from '@/services/api'

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    users: [] as User[],
    loading: false,
    error: null as string | null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.user,
    userCount: (state) => state.users.length,
    getUserById: (state) => {
      return (id: number) => state.users.find(user => user.id === id)
    }
  },
  
  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true
      this.error = null
      
      try {
        const user = await api.login(credentials)
        this.user = user
        return user
      } catch (error) {
        this.error = error instanceof Error ? error.message : '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchUsers() {
      this.loading = true
      try {
        const users = await api.getUsers()
        this.users = users
      } catch (error) {
        this.error = error instanceof Error ? error.message : '获取用户失败'
      } finally {
        this.loading = false
      }
    },
    
    async createUser(userData: Omit<User, 'id'>) {
      try {
        const user = await api.createUser(userData)
        this.users.push(user)
        return user
      } catch (error) {
        this.error = error instanceof Error ? error.message : '创建用户失败'
        throw error
      }
    },
    
    async updateUser(user: User) {
      try {
        const updatedUser = await api.updateUser(user)
        const index = this.users.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
        return updatedUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : '更新用户失败'
        throw error
      }
    },
    
    async deleteUser(userId: number) {
      try {
        await api.deleteUser(userId)
        this.users = this.users.filter(user => user.id !== userId)
      } catch (error) {
        this.error = error instanceof Error ? error.message : '删除用户失败'
        throw error
      }
    },
    
    logout() {
      this.user = null
      // 如果需要，清除其他用户相关状态
    }
  }
})
```

### 步骤 4：更新组件使用

**Vuex 使用：**
```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误：{{ error }}</div>
    <div v-else>
      <h1>欢迎 {{ user?.name }}</h1>
      <p>总用户数：{{ userCount }}</p>
      
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
          <button @click="editUser(user)">编辑</button>
          <button @click="removeUser(user.id)">删除</button>
        </li>
      </ul>
      
      <button @click="loadUsers">刷新用户</button>
      <button @click="signOut">退出登录</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('user', ['user', 'users', 'loading', 'error']),
    ...mapGetters('user', ['isLoggedIn', 'userCount'])
  },
  
  methods: {
    ...mapActions('user', ['fetchUsers', 'updateUser', 'deleteUser', 'logout']),
    
    async loadUsers() {
      await this.fetchUsers()
    },
    
    async editUser(user) {
      const updatedUser = { ...user, name: user.name + ' (已编辑)' }
      await this.updateUser(updatedUser)
    },
    
    async removeUser(userId) {
      await this.deleteUser(userId)
    },
    
    signOut() {
      this.logout()
      this.$router.push('/login')
    }
  },
  
  async created() {
    if (this.isLoggedIn) {
      await this.fetchUsers()
    }
  }
}
</script>
```

**Pinia 使用（组合式 API）：**
```vue
<template>
  <div>
    <div v-if="userStore.loading">加载中...</div>
    <div v-else-if="userStore.error">错误：{{ userStore.error }}</div>
    <div v-else>
      <h1>欢迎 {{ userStore.user?.name }}</h1>
      <p>总用户数：{{ userStore.userCount }}</p>
      
      <ul>
        <li v-for="user in userStore.users" :key="user.id">
          {{ user.name }} - {{ user.email }}
          <button @click="editUser(user)">编辑</button>
          <button @click="removeUser(user.id)">删除</button>
        </li>
      </ul>
      
      <button @click="loadUsers">刷新用户</button>
      <button @click="signOut">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loadUsers = async () => {
  await userStore.fetchUsers()
}

const editUser = async (user) => {
  const updatedUser = { ...user, name: user.name + ' (已编辑)' }
  await userStore.updateUser(updatedUser)
}

const removeUser = async (userId) => {
  await userStore.deleteUser(userId)
}

const signOut = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchUsers()
  }
})
</script>
```

**Pinia 使用（选项式 API）：**
```vue
<template>
  <!-- 与上面相同的模板 -->
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    ...mapStores(useUserStore),
    // 访问 store 属性
    user() { return this.userStore.user },
    users() { return this.userStore.users },
    loading() { return this.userStore.loading },
    error() { return this.userStore.error },
    isLoggedIn() { return this.userStore.isLoggedIn },
    userCount() { return this.userStore.userCount }
  },
  
  methods: {
    async loadUsers() {
      await this.userStore.fetchUsers()
    },
    
    async editUser(user) {
      const updatedUser = { ...user, name: user.name + ' (已编辑)' }
      await this.userStore.updateUser(updatedUser)
    },
    
    async removeUser(userId) {
      await this.userStore.deleteUser(userId)
    },
    
    signOut() {
      this.userStore.logout()
      this.$router.push('/login')
    }
  },
  
  async created() {
    if (this.isLoggedIn) {
      await this.loadUsers()
    }
  }
}
</script>
```

## 高级迁移模式

### 迁移嵌套模块

**Vuex 嵌套模块：**
```js
// store/modules/ecommerce/index.js
import products from './products'
import cart from './cart'
import orders from './orders'

export default {
  namespaced: true,
  modules: {
    products,
    cart,
    orders
  }
}
```

**Pinia 等价写法：**
```ts
// stores/products.ts
export const useProductsStore = defineStore('products', {
  // products store
})

// stores/cart.ts
export const useCartStore = defineStore('cart', {
  // cart store
})

// stores/orders.ts
export const useOrdersStore = defineStore('orders', {
  // orders store
})

// 可选：为相关 stores 创建组合式函数
// composables/useEcommerce.ts
export function useEcommerce() {
  const productsStore = useProductsStore()
  const cartStore = useCartStore()
  const ordersStore = useOrdersStore()
  
  return {
    productsStore,
    cartStore,
    ordersStore
  }
}
```

### 迁移复杂状态交互

**Vuex 跨模块 Actions：**
```js
// store/modules/cart.js
const actions = {
  async addToCart({ commit, rootGetters }, { productId, quantity }) {
    const product = rootGetters['products/getProductById'](productId)
    
    if (product.stock >= quantity) {
      commit('ADD_ITEM', { product, quantity })
      commit('products/DECREASE_STOCK', { productId, quantity }, { root: true })
    } else {
      throw new Error('库存不足')
    }
  }
}
```

**Pinia 跨 Store Actions：**
```ts
// stores/cart.ts
import { useProductsStore } from './products'

export const useCartStore = defineStore('cart', {
  actions: {
    async addToCart(productId: number, quantity: number) {
      const productsStore = useProductsStore()
      const product = productsStore.getProductById(productId)
      
      if (product && product.stock >= quantity) {
        this.items.push({ product, quantity })
        productsStore.decreaseStock(productId, quantity)
      } else {
        throw new Error('库存不足')
      }
    }
  }
})
```

### 迁移插件

**Vuex 插件：**
```js
// plugins/persistence.js
const persistencePlugin = (store) => {
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex-state', JSON.stringify(state))
  })
}

// store/index.js
export default createStore({
  plugins: [persistencePlugin]
})
```

**Pinia 插件：**
```ts
// plugins/persistence.ts
import { PiniaPluginContext } from 'pinia'

export function persistencePlugin({ store }: PiniaPluginContext) {
  // 从 localStorage 恢复状态
  const saved = localStorage.getItem(`pinia-${store.$id}`)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }
  
  // 保存状态变更
  store.$subscribe((mutation, state) => {
    localStorage.setItem(`pinia-${store.$id}`, JSON.stringify(state))
  })
}

// main.ts
const pinia = createPinia()
pinia.use(persistencePlugin)
```

## 迁移检查清单

### 迁移前

- [ ] **审核当前 Vuex 使用情况**：记录所有 stores、模块及其依赖关系
- [ ] **识别复杂模式**：注意正在使用的任何高级 Vuex 功能
- [ ] **规划迁移顺序**：从叶子模块开始（无依赖项）
- [ ] **设置测试**：确保在迁移前有良好的测试覆盖率
- [ ] **创建迁移分支**：在单独的分支中工作以确保安全

### 迁移期间

- [ ] **安装 Pinia**：移除 Vuex 并安装 Pinia
- [ ] **更新主应用**：用 Pinia 替换 Vuex store
- [ ] **逐个迁移 stores**：将每个 Vuex 模块转换为 Pinia store
- [ ] **更新组件使用**：用 Pinia 等价物替换 mapState/mapActions
- [ ] **迁移插件**：将 Vuex 插件转换为 Pinia 插件
- [ ] **更新 TypeScript 类型**：利用 Pinia 更好的 TypeScript 支持
- [ ] **彻底测试**：确保所有功能按预期工作

### 迁移后

- [ ] **移除 Vuex 依赖**：清理 package.json 和导入
- [ ] **更新文档**：记录新的 store 结构
- [ ] **优化包**：利用 tree-shaking 改进
- [ ] **增强 DevTools**：设置 Pinia DevTools 以获得更好的调试体验
- [ ] **培训团队**：确保团队成员理解新模式

## 常见迁移挑战

### 1. 处理 Mutations

**问题**：Vuex 需要 mutations 来进行状态变更
**解决方案**：在 Pinia 中，直接在 actions 中修改状态

```ts
// Vuex 模式（在 Pinia 中不要这样做）
const mutations = {
  SET_USER(state, user) {
    state.user = user
  }
}

// Pinia 模式
const actions = {
  setUser(user) {
    this.user = user // 直接修改
  }
}
```

### 2. 命名空间模块

**问题**：Vuex 命名空间模块需要基于路径的访问
**解决方案**：Pinia stores 是独立的，使用直接导入

```js
// Vuex
this.$store.dispatch('user/login', credentials)
this.$store.getters['user/isLoggedIn']

// Pinia
const userStore = useUserStore()
userStore.login(credentials)
userStore.isLoggedIn
```

### 3. 根状态访问

**问题**：Vuex 允许从模块访问根状态
**解决方案**：直接导入和使用其他 stores

```js
// Vuex
const getters = {
  cartTotal: (state, getters, rootState) => {
    return rootState.products.items.reduce(/* ... */)
  }
}

// Pinia
const getters = {
  cartTotal(): number {
    const productsStore = useProductsStore()
    return productsStore.items.reduce(/* ... */)
  }
}
```

### 4. 动态模块注册

**问题**：Vuex 支持动态模块注册
**解决方案**：动态创建 stores 或使用工厂函数

```ts
// 动态 store 创建
export function createUserStore(userId: string) {
  return defineStore(`user-${userId}`, {
    state: () => ({
      user: null,
      preferences: {}
    }),
    // ... store 的其余部分
  })
}

// 使用
const userStore = createUserStore('123')()
```

## 性能考虑

### 包大小

Pinia 通常会产生更小的包，因为：
- 更好的 tree-shaking
- 没有 mutations 样板代码
- 模块化架构

### 运行时性能

Pinia 通过以下方式提供更好的运行时性能：
- 直接属性访问（无基于字符串的路径）
- 优化的响应式系统
- 减少 mutations 的开销

### 开发体验

Pinia 通过以下方式改善开发体验：
- 更好的 TypeScript 集成
- 增强的 DevTools
- 热模块替换
- 更简单的调试

## 迁移最佳实践

### 1. 渐进式迁移

```ts
// 在迁移期间可以同时运行 Vuex 和 Pinia
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import vuexStore from './store/vuex'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuexStore) // 在迁移期间保留 Vuex
app.mount('#app')
```

### 2. 保持一致的命名

```ts
// 保持相似的命名约定以便于迁移
// Vuex：user 模块
// Pinia：useUserStore

// Vuex：products/fetchProducts
// Pinia：useProductsStore().fetchProducts
```

### 3. 利用 TypeScript

```ts
// 利用 Pinia 更好的 TypeScript 支持
interface UserState {
  user: User | null
  users: User[]
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    users: [],
    loading: false,
    error: null
  })
})
```

### 4. 使用组合式 API 的优势

```ts
// 创建可重用的组合式函数
export function useAsyncState<T>(asyncFn: () => Promise<T>) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await asyncFn()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
    } finally {
      loading.value = false
    }
  }
  
  return { loading, error, data, execute }
}

// 在 stores 中使用
export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const { loading, error, execute: fetchUsers } = useAsyncState(async () => {
    const result = await api.getUsers()
    users.value = result
    return result
  })
  
  return { users, loading, error, fetchUsers }
})
```

## 相关链接

- [快速开始](./getting-started) - 基本 Pinia 设置
- [定义 Stores](./defining-stores) - Store 创建模式
- [状态管理](./state) - 在 Pinia 中管理状态
- [Actions](./actions) - 处理业务逻辑
- [插件](./plugins) - 扩展 Pinia 功能