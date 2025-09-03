---
title: 迁移指南
description: 从其他状态管理解决方案（如 Vuex、Redux）迁移到 Pinia 的完整指南，包括步骤、示例和最佳实践。
head:
  - [meta, { name: description, content: "从其他状态管理解决方案（如 Vuex、Redux）迁移到 Pinia 的完整指南，包括步骤、示例和最佳实践。" }]
  - [meta, { name: keywords, content: "Pinia 迁移, Vuex 迁移, Redux 迁移, 状态管理迁移" }]
  - [meta, { property: "og:title", content: "迁移指南 - Pinia" }]
  - [meta, { property: "og:description", content: "从其他状态管理解决方案（如 Vuex、Redux）迁移到 Pinia 的完整指南，包括步骤、示例和最佳实践。" }]
---

# 迁移指南

本指南将帮助您从其他状态管理解决方案迁移到 Pinia，包括详细的步骤、代码示例和最佳实践。

## 从 Vuex 迁移

### 主要差异

| 特性 | Vuex | Pinia |
|------|------|-------|
| 语法 | Options API | Composition API |
| TypeScript | 需要复杂配置 | 原生支持 |
| 模块 | 嵌套模块 | 扁平化 store |
| Mutations | 必需 | 不需要 |
| DevTools | 需要配置 | 自动支持 |
| 包大小 | 较大 | 更小 |
| SSR | 复杂 | 简单 |

### 迁移步骤

#### 1. 安装 Pinia

```bash
npm uninstall vuex
npm install pinia
```

#### 2. 替换 Vuex Store

**Vuex (之前):**

```js
// store/index.js
import { createStore } from 'vuex'
import user from './modules/user'
import products from './modules/products'

export default createStore({
  modules: {
    user,
    products
  }
})

// store/modules/user.js
export default {
  namespaced: true,
  state: {
    currentUser: null,
    isLoggedIn: false
  },
  mutations: {
    SET_USER(state, user) {
      state.currentUser = user
      state.isLoggedIn = !!user
    },
    LOGOUT(state) {
      state.currentUser = null
      state.isLoggedIn = false
    }
  },
  actions: {
    async login({ commit }, credentials) {
      const user = await api.login(credentials)
      commit('SET_USER', user)
      return user
    },
    logout({ commit }) {
      commit('LOGOUT')
    }
  },
  getters: {
    userName: (state) => state.currentUser?.name || '',
    isAdmin: (state) => state.currentUser?.role === 'admin'
  }
}
```

**Pinia (之后):**

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  
  // Getters
  const isLoggedIn = computed(() => !!currentUser.value)
  const userName = computed(() => currentUser.value?.name || '')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  
  // Actions
  const login = async (credentials: LoginCredentials) => {
    const user = await api.login(credentials)
    currentUser.value = user
    return user
  }
  
  const logout = () => {
    currentUser.value = null
  }
  
  return {
    // State
    currentUser: readonly(currentUser),
    
    // Getters
    isLoggedIn,
    userName,
    isAdmin,
    
    // Actions
    login,
    logout
  }
})
```

#### 3. 更新应用入口

**Vuex (之前):**

```js
// main.js
import { createApp } from 'vue'
import store from './store'
import App from './App.vue'

const app = createApp(App)
app.use(store)
app.mount('#app')
```

**Pinia (之后):**

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

#### 4. 更新组件使用方式

**Vuex (之前):**

```vue
<template>
  <div>
    <p v-if="isLoggedIn">欢迎，{{ userName }}！</p>
    <button @click="handleLogin">登录</button>
    <button @click="handleLogout">登出</button>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('user', ['currentUser']),
    ...mapGetters('user', ['isLoggedIn', 'userName', 'isAdmin'])
  },
  methods: {
    ...mapActions('user', ['login', 'logout']),
    
    async handleLogin() {
      await this.login({ email: 'user@example.com', password: 'password' })
    },
    
    handleLogout() {
      this.logout()
    }
  }
}
</script>
```

**Pinia (之后):**

```vue
<template>
  <div>
    <p v-if="userStore.isLoggedIn">欢迎，{{ userStore.userName }}！</p>
    <button @click="handleLogin">登录</button>
    <button @click="userStore.logout">登出</button>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const handleLogin = async () => {
  await userStore.login({ email: 'user@example.com', password: 'password' })
}
</script>
```

### 复杂迁移场景

#### 嵌套模块迁移

**Vuex 嵌套模块:**

```js
// store/modules/shop/index.js
export default {
  namespaced: true,
  modules: {
    cart: {
      namespaced: true,
      state: { items: [] },
      mutations: { ADD_ITEM(state, item) { state.items.push(item) } }
    },
    products: {
      namespaced: true,
      state: { list: [] },
      actions: { async fetchProducts({ commit }) { /* ... */ } }
    }
  }
}
```

**Pinia 扁平化 Store:**

```ts
// stores/cart.ts
export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  
  const addItem = (item) => {
    items.value.push(item)
  }
  
  return { items, addItem }
})

// stores/products.ts
export const useProductsStore = defineStore('products', () => {
  const list = ref([])
  
  const fetchProducts = async () => {
    const data = await api.getProducts()
    list.value = data
  }
  
  return { list, fetchProducts }
})

// stores/shop.ts (组合 store)
export const useShopStore = defineStore('shop', () => {
  const cartStore = useCartStore()
  const productsStore = useProductsStore()
  
  const addToCart = (productId) => {
    const product = productsStore.list.find(p => p.id === productId)
    if (product) {
      cartStore.addItem(product)
    }
  }
  
  return {
    cartStore,
    productsStore,
    addToCart
  }
})
```

#### 插件迁移

**Vuex 插件:**

```js
// vuex-persist.js
const vuexPersist = (store) => {
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex', JSON.stringify(state))
  })
}

// store/index.js
export default createStore({
  plugins: [vuexPersist]
})
```

**Pinia 插件:**

```ts
// plugins/persist.ts
import type { PiniaPluginContext } from 'pinia'

export function piniaPersistedState(context: PiniaPluginContext) {
  const { store } = context
  
  // 恢复状态
  const saved = localStorage.getItem(`pinia-${store.$id}`)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }
  
  // 监听变化
  store.$subscribe((mutation, state) => {
    localStorage.setItem(`pinia-${store.$id}`, JSON.stringify(state))
  })
}

// main.ts
const pinia = createPinia()
pinia.use(piniaPersistedState)
```

## 从 Redux 迁移

### 主要差异

| 特性 | Redux | Pinia |
|------|-------|-------|
| 样板代码 | 大量 | 最少 |
| 不可变性 | 手动 | 自动 |
| 中间件 | 复杂 | 简单 |
| 时间旅行 | 内置 | DevTools |
| 学习曲线 | 陡峭 | 平缓 |

### 迁移示例

**Redux (之前):**

```js
// actions/user.js
export const LOGIN_REQUEST = 'LOGIN_REQUEST'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const LOGIN_FAILURE = 'LOGIN_FAILURE'
export const LOGOUT = 'LOGOUT'

export const loginRequest = () => ({ type: LOGIN_REQUEST })
export const loginSuccess = (user) => ({ type: LOGIN_SUCCESS, payload: user })
export const loginFailure = (error) => ({ type: LOGIN_FAILURE, payload: error })
export const logout = () => ({ type: LOGOUT })

export const login = (credentials) => async (dispatch) => {
  dispatch(loginRequest())
  try {
    const user = await api.login(credentials)
    dispatch(loginSuccess(user))
  } catch (error) {
    dispatch(loginFailure(error.message))
  }
}

// reducers/user.js
const initialState = {
  user: null,
  loading: false,
  error: null
}

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, loading: true, error: null }
    case LOGIN_SUCCESS:
      return { ...state, loading: false, user: action.payload }
    case LOGIN_FAILURE:
      return { ...state, loading: false, error: action.payload }
    case LOGOUT:
      return { ...state, user: null }
    default:
      return state
  }
}

// selectors/user.js
export const selectUser = (state) => state.user.user
export const selectIsLoading = (state) => state.user.loading
export const selectError = (state) => state.user.error
export const selectIsLoggedIn = (state) => !!state.user.user
```

**Pinia (之后):**

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // Getters
  const isLoggedIn = computed(() => !!user.value)
  
  // Actions
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      const userData = await api.login(credentials)
      user.value = userData
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const logout = () => {
    user.value = null
    error.value = null
  }
  
  return {
    // State
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    isLoggedIn,
    
    // Actions
    login,
    logout
  }
})
```

## 渐进式迁移策略

### 1. 并行运行

在迁移期间，可以让 Vuex 和 Pinia 并行运行：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import vuexStore from './store/vuex'

const app = createApp(App)
const pinia = createPinia()

// 同时使用两个状态管理库
app.use(vuexStore)
app.use(pinia)

app.mount('#app')
```

### 2. 逐模块迁移

```ts
// 迁移计划
const migrationPlan = {
  phase1: ['user', 'auth'],           // 第一阶段：核心模块
  phase2: ['products', 'cart'],       // 第二阶段：业务模块
  phase3: ['ui', 'settings']          // 第三阶段：辅助模块
}

// 创建迁移助手
const createMigrationHelper = () => {
  const migratedStores = new Set()
  
  return {
    markAsMigrated(storeName) {
      migratedStores.add(storeName)
    },
    
    isMigrated(storeName) {
      return migratedStores.has(storeName)
    },
    
    getProgress() {
      const total = Object.values(migrationPlan).flat().length
      return (migratedStores.size / total) * 100
    }
  }
}
```

### 3. 状态同步

在迁移期间保持 Vuex 和 Pinia 状态同步：

```ts
// utils/stateSyncPlugin.ts
export function createStateSyncPlugin(vuexStore) {
  return (context: PiniaPluginContext) => {
    const { store } = context
    
    // Pinia -> Vuex
    store.$subscribe((mutation, state) => {
      if (vuexStore.hasModule(store.$id)) {
        vuexStore.commit(`${store.$id}/SYNC_FROM_PINIA`, state)
      }
    })
    
    // Vuex -> Pinia
    vuexStore.subscribe((mutation) => {
      if (mutation.type.startsWith(`${store.$id}/`) && 
          !mutation.type.includes('SYNC_FROM_PINIA')) {
        const vuexState = vuexStore.state[store.$id]
        store.$patch(vuexState)
      }
    })
  }
}
```

## 迁移检查清单

### 准备阶段

- [ ] 分析现有 Vuex/Redux 代码结构
- [ ] 识别依赖关系和模块边界
- [ ] 制定迁移计划和时间表
- [ ] 设置测试环境
- [ ] 准备回滚策略

### 迁移阶段

- [ ] 安装 Pinia 并配置
- [ ] 创建对应的 Pinia store
- [ ] 迁移状态定义
- [ ] 迁移 getters/computed
- [ ] 迁移 actions/mutations
- [ ] 更新组件使用方式
- [ ] 迁移插件和中间件
- [ ] 更新类型定义

### 测试阶段

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] E2E 测试通过
- [ ] 性能测试通过
- [ ] 兼容性测试通过

### 清理阶段

- [ ] 移除旧的状态管理代码
- [ ] 清理未使用的依赖
- [ ] 更新文档
- [ ] 团队培训
- [ ] 监控生产环境

## 常见迁移模式

### 异步 Actions

**迁移前 (Vuex):**

```js
actions: {
  async fetchUserData({ commit, state }, userId) {
    if (state.users[userId]) {
      return state.users[userId]
    }
    
    commit('SET_LOADING', true)
    try {
      const user = await api.getUser(userId)
      commit('SET_USER', { userId, user })
      return user
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}
```

**迁移后 (Pinia):**

```ts
const fetchUserData = async (userId: string) => {
  if (users.value[userId]) {
    return users.value[userId]
  }
  
  loading.value = true
  try {
    const user = await api.getUser(userId)
    users.value[userId] = user
    return user
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}
```

### 跨 Store 通信

**迁移前 (Vuex):**

```js
// 通过 rootState 访问其他模块
actions: {
  addToCart({ commit, rootState }, productId) {
    const product = rootState.products.items.find(p => p.id === productId)
    if (product && rootState.user.isLoggedIn) {
      commit('ADD_ITEM', product)
    }
  }
}
```

**迁移后 (Pinia):**

```ts
const addToCart = (productId: string) => {
  const productsStore = useProductsStore()
  const userStore = useUserStore()
  
  const product = productsStore.items.find(p => p.id === productId)
  if (product && userStore.isLoggedIn) {
    items.value.push(product)
  }
}
```

## 迁移工具

### 自动化迁移脚本

```bash
#!/bin/bash
# migrate-to-pinia.sh

echo "开始 Vuex 到 Pinia 迁移..."

# 1. 安装 Pinia
npm install pinia
npm uninstall vuex

# 2. 创建 stores 目录
mkdir -p src/stores

# 3. 运行迁移工具
node scripts/vuex-to-pinia-migrator.js

echo "迁移完成！请检查生成的文件并进行必要的调整。"
```

### 迁移助手函数

```ts
// utils/migrationHelpers.ts

// 将 Vuex mapState 转换为 Pinia
export function convertMapState(storeId: string, states: string[]) {
  return states.reduce((acc, state) => {
    acc[state] = computed(() => {
      const store = useStore(storeId)
      return store[state]
    })
    return acc
  }, {})
}

// 将 Vuex mapGetters 转换为 Pinia
export function convertMapGetters(storeId: string, getters: string[]) {
  return getters.reduce((acc, getter) => {
    acc[getter] = computed(() => {
      const store = useStore(storeId)
      return store[getter]
    })
    return acc
  }, {})
}

// 将 Vuex mapActions 转换为 Pinia
export function convertMapActions(storeId: string, actions: string[]) {
  return actions.reduce((acc, action) => {
    acc[action] = (...args: any[]) => {
      const store = useStore(storeId)
      return store[action](...args)
    }
    return acc
  }, {})
}
```

## 性能考虑

### 包大小对比

```bash
# 分析包大小
npm run build -- --analyze

# Vuex vs Pinia 包大小对比
# Vuex: ~2.6KB (gzipped)
# Pinia: ~1.3KB (gzipped)
```

### 运行时性能

```ts
// 性能测试
const performanceTest = () => {
  const iterations = 10000
  
  // 测试状态更新性能
  console.time('Pinia state updates')
  for (let i = 0; i < iterations; i++) {
    store.updateCounter(i)
  }
  console.timeEnd('Pinia state updates')
  
  // 测试计算属性性能
  console.time('Pinia computed access')
  for (let i = 0; i < iterations; i++) {
    const value = store.computedValue
  }
  console.timeEnd('Pinia computed access')
}
```

## 故障排除

### 常见问题

#### 1. TypeScript 类型错误

```ts
// 问题：类型推断失败
// 解决：明确类型定义
interface UserState {
  user: User | null
  loading: boolean
}

export const useUserStore = defineStore('user', (): UserState => {
  // 实现
})
```

#### 2. 响应式丢失

```ts
// 问题：解构导致响应式丢失
const { user, isLoggedIn } = userStore // ❌ 错误

// 解决：使用 storeToRefs
const { user, isLoggedIn } = storeToRefs(userStore) // ✅ 正确
```

#### 3. SSR 水合问题

```ts
// 问题：服务端和客户端状态不一致
// 解决：正确处理 SSR 状态序列化
if (process.client) {
  // 客户端特定逻辑
}
```

### 调试技巧

```ts
// 开发环境调试
if (import.meta.env.DEV) {
  // 添加全局 store 访问
  window.__PINIA_STORES__ = {}
  
  pinia.use(({ store }) => {
    window.__PINIA_STORES__[store.$id] = store
    
    // 添加调试信息
    store.$onAction(({ name, args }) => {
      console.log(`Action ${name} called with:`, args)
    })
  })
}
```

## 最佳实践

### 迁移策略

1. **小步快跑**：逐个模块迁移，避免大爆炸式重构
2. **保持向后兼容**：在迁移期间保持 API 兼容性
3. **充分测试**：每个迁移步骤都要有对应的测试
4. **文档更新**：及时更新开发文档和 API 文档
5. **团队培训**：确保团队成员了解新的状态管理方式

### 代码组织

```
src/
├── stores/
│   ├── index.ts          # Store 导出
│   ├── user.ts           # 用户 store
│   ├── products.ts       # 产品 store
│   └── utils/            # Store 工具
│       ├── api.ts
│       └── cache.ts
├── composables/          # 组合式函数
│   ├── useAuth.ts
│   └── useApi.ts
└── types/                # 类型定义
    ├── store.ts
    └── api.ts
```

## 相关资源

- [Vuex 兼容性指南](./vuex-compatibility.md)
- [测试迁移指南](./testing-migration.md)
- [性能优化](./performance.md)
- [TypeScript 指南](../cookbook/typescript-best-practices.md)
- [Pinia vs Vuex 对比](../introduction/comparison.md)