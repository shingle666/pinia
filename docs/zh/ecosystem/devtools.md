---
title: 开发工具
description: 使用 Vue DevTools 和其他开发工具调试和开发 Pinia 应用的综合指南。
head:
  - [meta, { name: description, content: "使用 Vue DevTools 和其他开发工具调试和开发 Pinia 应用的综合指南。" }]
  - [meta, { name: keywords, content: "Pinia DevTools, Vue DevTools, 调试, 开发工具, 状态检查" }]
  - [meta, { property: "og:title", content: "开发工具 - Pinia" }]
  - [meta, { property: "og:description", content: "使用 Vue DevTools 和其他开发工具调试和开发 Pinia 应用的综合指南。" }]
---

# 开发工具

Pinia 通过 Vue DevTools 和其他开发工具提供了出色的调试功能。本指南介绍如何有效使用这些工具来调试和开发 Pinia 应用程序。

## Vue DevTools

### 安装

**浏览器扩展：**

- [Chrome 扩展](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Firefox 扩展](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Edge 扩展](https://microsoftedge.microsoft.com/addons/detail/vuejs-devtools/olofadcdnkkjdfgjcmjaadnlehnnihnl)

**独立应用程序：**

```bash
npm install -g @vue/devtools
# 或
yarn global add @vue/devtools

# 运行
vue-devtools
```

### Pinia 集成

当 Vue DevTools 和 Pinia 都可用时，Pinia 会自动与 Vue DevTools 集成：

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// DevTools 集成是自动的
app.use(pinia)
app.mount('#app')
```

### DevTools 功能

#### 1. Store 检查器

**查看 Store 状态：**

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const preferences = ref({
    theme: 'light',
    language: 'zh'
  })
  
  return { user, preferences }
})
```

在 DevTools 中：
- 导航到 "Pinia" 选项卡
- 从列表中选择 store
- 检查当前状态值
- 查看嵌套对象和数组

#### 2. 状态变更

**跟踪状态变化：**

```ts
// stores/counter.ts
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  
  const increment = () => {
    count.value++ // 这个变更将被跟踪
  }
  
  const setCount = (newCount: number) => {
    count.value = newCount // 这个变更将被跟踪
  }
  
  return { count, increment, setCount }
})
```

DevTools 显示：
- 变更时间线
- 变更前后的状态值
- 触发变更的操作
- 堆栈跟踪

#### 3. 操作跟踪

**监控操作执行：**

```ts
// stores/api.ts
export const useApiStore = defineStore('api', () => {
  const data = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const fetchData = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/data')
      data.value = await response.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  return { data, loading, error, fetchData }
})
```

DevTools 显示：
- 操作执行时间线
- 操作参数
- 执行持续时间
- 成功/错误状态
- 操作期间的状态变化

#### 4. 时间旅行调试

**在状态历史中导航：**

```ts
// 启用时间旅行（开发环境中自动启用）
const pinia = createPinia()

// 在 DevTools 中：
// 1. 查看变更历史
// 2. 点击任何变更以回到那个时间点
// 3. 查看应用程序在那个时间点的状态
// 4. 从那个状态继续或重置
```

### DevTools 配置

#### 自定义 Store 名称

```ts
// 在 DevTools 中更好地识别 store
export const useUserStore = defineStore('user-management', () => {
  // Store 实现
})

export const useShoppingCartStore = defineStore('shopping-cart', () => {
  // Store 实现
})
```

#### Store 分组

```ts
// 分组相关的 store
export const useUserProfileStore = defineStore('user/profile', () => {
  // 用户资料 store
})

export const useUserSettingsStore = defineStore('user/settings', () => {
  // 用户设置 store
})

export const useProductCatalogStore = defineStore('product/catalog', () => {
  // 产品目录 store
})

export const useProductCartStore = defineStore('product/cart', () => {
  // 购物车 store
})
```

## 开发工具

### 热模块替换 (HMR)

**自动 Store 更新：**

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  
  const login = async (credentials) => {
    // 登录逻辑
  }
  
  const logout = () => {
    user.value = null
  }
  
  return { user, login, logout }
})

// HMR 在开发过程中保持 store 状态
// store 逻辑的更改会在不丢失状态的情况下应用
```

**手动 HMR 配置：**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_PROD_DEVTOOLS__: false, // 在生产环境中禁用 DevTools
  }
})
```

### TypeScript 集成

**类型安全调试：**

```ts
// stores/typed-store.ts
interface User {
  id: number
  name: string
  email: string
}

interface UserState {
  currentUser: User | null
  users: User[]
  loading: boolean
}

export const useUserStore = defineStore('user', (): UserState => {
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const loading = ref(false)
  
  return {
    currentUser: readonly(currentUser),
    users: readonly(users),
    loading: readonly(loading)
  }
})

// DevTools 将为所有状态属性显示正确的类型
```

### 自定义 DevTools 插件

**创建自定义检查器：**

```ts
// plugins/devtools-plugin.ts
import { App } from 'vue'
import { PiniaPluginContext } from 'pinia'

export function createDevToolsPlugin() {
  return ({ store, app }: PiniaPluginContext) => {
    // 向 DevTools 添加自定义属性
    store.$subscribe((mutation, state) => {
      console.group(`🍍 ${store.$id}`)
      console.log('变更:', mutation)
      console.log('状态:', state)
      console.groupEnd()
    })
    
    // 向 DevTools 添加自定义操作
    store.$onAction(({ name, args, after, onError }) => {
      console.log(`🚀 操作 "${name}" 开始，参数:`, args)
      
      after((result) => {
        console.log(`✅ 操作 "${name}" 完成，结果:`, result)
      })
      
      onError((error) => {
        console.error(`❌ 操作 "${name}" 失败:`, error)
      })
    })
  }
}

// main.ts
const pinia = createPinia()
pinia.use(createDevToolsPlugin())
```

## 调试技巧

### 状态检查

**直接状态访问：**

```ts
// 在浏览器控制台或调试器中
const userStore = useUserStore()
console.log('当前用户:', userStore.user)
console.log('所有状态:', userStore.$state)

// 响应式状态监听
watch(
  () => userStore.user,
  (newUser, oldUser) => {
    console.log('用户变更:', { newUser, oldUser })
  },
  { deep: true }
)
```

**状态快照：**

```ts
// stores/debug.ts
export const useDebugStore = defineStore('debug', () => {
  const snapshots = ref([])
  
  const takeSnapshot = (label: string) => {
    const allStores = {}
    
    // 收集所有 store 状态
    const pinia = getActivePinia()
    pinia._s.forEach((store, id) => {
      allStores[id] = JSON.parse(JSON.stringify(store.$state))
    })
    
    snapshots.value.push({
      label,
      timestamp: Date.now(),
      states: allStores
    })
  }
  
  const compareSnapshots = (index1: number, index2: number) => {
    const snap1 = snapshots.value[index1]
    const snap2 = snapshots.value[index2]
    
    // 比较状态并返回差异
    return {
      snap1: snap1.label,
      snap2: snap2.label,
      differences: findDifferences(snap1.states, snap2.states)
    }
  }
  
  return { snapshots, takeSnapshot, compareSnapshots }
})
```

### 操作调试

**操作拦截器：**

```ts
// plugins/action-logger.ts
export function createActionLogger() {
  return ({ store }: PiniaPluginContext) => {
    store.$onAction(({ name, args, after, onError }) => {
      const startTime = Date.now()
      
      console.group(`🎬 操作: ${store.$id}.${name}`)
      console.log('参数:', args)
      console.log('执行前状态:', JSON.stringify(store.$state))
      
      after((result) => {
        const duration = Date.now() - startTime
        console.log('执行后状态:', JSON.stringify(store.$state))
        console.log('结果:', result)
        console.log(`持续时间: ${duration}ms`)
        console.groupEnd()
      })
      
      onError((error) => {
        console.error('错误:', error)
        console.groupEnd()
      })
    })
  }
}
```

**异步操作调试：**

```ts
// stores/async-debug.ts
export const useAsyncStore = defineStore('async', () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const fetchData = async (url: string) => {
    const actionId = `fetch-${Date.now()}`
    
    console.time(actionId)
    loading.value = true
    error.value = null
    
    try {
      console.log(`🌐 获取数据: ${url}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      data.value = await response.json()
      console.log(`✅ 获取成功:`, data.value)
    } catch (err) {
      error.value = err.message
      console.error(`❌ 获取失败:`, err)
    } finally {
      loading.value = false
      console.timeEnd(actionId)
    }
  }
  
  return { data, loading, error, fetchData }
})
```

### 性能调试

**Store 性能监控：**

```ts
// plugins/performance-monitor.ts
export function createPerformanceMonitor() {
  return ({ store }: PiniaPluginContext) => {
    const metrics = {
      mutations: 0,
      actions: 0,
      subscriptions: 0
    }
    
    // 跟踪变更
    store.$subscribe(() => {
      metrics.mutations++
    })
    
    // 跟踪操作
    store.$onAction(() => {
      metrics.actions++
    })
    
    // 暴露指标
    store.$metrics = metrics
    
    // 记录性能摘要
    setInterval(() => {
      console.log(`📊 Store ${store.$id} 指标:`, metrics)
    }, 10000) // 每 10 秒
  }
}
```

**内存使用跟踪：**

```ts
// utils/memory-tracker.ts
export function trackMemoryUsage() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory
    
    if (memory) {
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
  }
  
  return null
}

// 在 store 中使用
export const useMemoryStore = defineStore('memory', () => {
  const memoryUsage = ref(null)
  
  const updateMemoryUsage = () => {
    memoryUsage.value = trackMemoryUsage()
  }
  
  // 在开发环境中每 5 秒更新一次
  if (process.env.NODE_ENV === 'development') {
    setInterval(updateMemoryUsage, 5000)
  }
  
  return { memoryUsage, updateMemoryUsage }
})
```

## 生产环境调试

### 错误跟踪

**Store 错误边界：**

```ts
// plugins/error-tracker.ts
export function createErrorTracker() {
  return ({ store }: PiniaPluginContext) => {
    store.$onAction(({ name, onError }) => {
      onError((error) => {
        // 发送到错误跟踪服务
        if (typeof window !== 'undefined') {
          // 示例：Sentry、LogRocket 等
          console.error(`Store 操作错误 ${store.$id}.${name}:`, error)
          
          // 发送到监控服务
          // Sentry.captureException(error, {
          //   tags: {
          //     store: store.$id,
          //     action: name
          //   }
          // })
        }
      })
    })
  }
}
```

### 调试状态持久化

**调试状态持久化：**

```ts
// plugins/debug-persistence.ts
export function createDebugPersistence() {
  return ({ store }: PiniaPluginContext) => {
    if (process.env.NODE_ENV === 'development') {
      // 将状态保存到 localStorage 用于调试
      store.$subscribe((mutation, state) => {
        localStorage.setItem(
          `debug-${store.$id}`,
          JSON.stringify({
            state,
            timestamp: Date.now(),
            mutation
          })
        )
      })
      
      // 从 localStorage 恢复状态
      const savedState = localStorage.getItem(`debug-${store.$id}`)
      if (savedState) {
        try {
          const { state } = JSON.parse(savedState)
          store.$patch(state)
        } catch (error) {
          console.warn(`恢复 ${store.$id} 调试状态失败:`, error)
        }
      }
    }
  }
}
```

## 最佳实践

### DevTools 优化

1. **使用描述性的 Store 名称：**

```ts
// ❌ 不好
defineStore('store1', () => { /* ... */ })
defineStore('s', () => { /* ... */ })

// ✅ 好
defineStore('user-authentication', () => { /* ... */ })
defineStore('shopping-cart', () => { /* ... */ })
```

2. **分组相关的 Store：**

```ts
// ✅ 好的组织方式
defineStore('auth/user', () => { /* ... */ })
defineStore('auth/permissions', () => { /* ... */ })
defineStore('ecommerce/products', () => { /* ... */ })
defineStore('ecommerce/cart', () => { /* ... */ })
```

3. **添加有意义的操作名称：**

```ts
// ❌ 不好
const doSomething = () => { /* ... */ }
const update = () => { /* ... */ }

// ✅ 好
const authenticateUser = () => { /* ... */ }
const updateUserProfile = () => { /* ... */ }
```

### 开发环境 vs 生产环境

```ts
// main.ts
const pinia = createPinia()

if (process.env.NODE_ENV === 'development') {
  // 仅开发环境插件
  pinia.use(createActionLogger())
  pinia.use(createPerformanceMonitor())
  pinia.use(createDebugPersistence())
}

if (process.env.NODE_ENV === 'production') {
  // 仅生产环境插件
  pinia.use(createErrorTracker())
}

app.use(pinia)
```

### 安全考虑

```ts
// 避免在 DevTools 中暴露敏感数据
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  
  // ❌ 不要直接暴露敏感数据
  // return { user, token }
  
  // ✅ 使用 getter 控制暴露
  const publicUser = computed(() => {
    if (!user.value) return null
    
    return {
      id: user.value.id,
      name: user.value.name,
      email: user.value.email
      // 不暴露敏感字段
    }
  })
  
  const isAuthenticated = computed(() => !!token.value)
  
  return {
    user: publicUser,
    isAuthenticated
    // 不直接暴露 token
  }
})
```

## 故障排除

### 常见问题

1. **DevTools 不显示 Pinia 选项卡：**

```ts
// 确保 Vue DevTools 已安装并启用
// 检查浏览器控制台是否有错误
// 验证 Pinia 是否正确安装

// 强制 DevTools 检测
if (process.env.NODE_ENV === 'development') {
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || {}
}
```

2. **Store 状态在 DevTools 中不更新：**

```ts
// 确保使用响应式引用
const state = ref(initialValue) // ✅ 响应式
const state = initialValue // ❌ 非响应式

// 确保正确的状态变更
state.value = newValue // ✅ 触发响应式
state = newValue // ❌ 不触发响应式
```

3. **操作不在时间线中显示：**

```ts
// 确保操作正确定义并返回
export const useStore = defineStore('store', () => {
  const action = () => {
    // 操作逻辑
  }
  
  return {
    action // ✅ 必须返回才能被跟踪
  }
})
```

### 性能问题

```ts
// 避免过多的 DevTools 更新
export const useOptimizedStore = defineStore('optimized', () => {
  const data = ref([])
  
  // ❌ 触发许多 DevTools 更新
  const addItemsOneByOne = (items) => {
    items.forEach(item => {
      data.value.push(item) // 每次 push 都触发更新
    })
  }
  
  // ✅ 单次 DevTools 更新
  const addItemsBatch = (items) => {
    data.value = [...data.value, ...items]
  }
  
  return { data, addItemsBatch }
})
```

## 相关资源

- [Vue DevTools 文档](https://devtools.vuejs.org/)
- [Pinia 测试指南](../guide/testing.md)
- [性能优化](../guide/performance.md)
- [插件开发](../cookbook/plugin-development.md)
- [TypeScript 最佳实践](../cookbook/typescript-best-practices.md)