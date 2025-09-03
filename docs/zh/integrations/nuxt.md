---
title: Nuxt.js 集成
description: 学习如何在 Nuxt.js 应用中集成和使用 Pinia，包括 SSR 支持、模块配置和最佳实践。
head:
  - [meta, { name: description, content: "学习如何在 Nuxt.js 应用中集成和使用 Pinia，包括 SSR 支持、模块配置和最佳实践。" }]
  - [meta, { name: keywords, content: "Pinia Nuxt, Nuxt.js 状态管理, SSR, 服务端渲染" }]
  - [meta, { property: "og:title", content: "Nuxt.js 集成 - Pinia" }]
  - [meta, { property: "og:description", content: "学习如何在 Nuxt.js 应用中集成和使用 Pinia，包括 SSR 支持、模块配置和最佳实践。" }]
---

# Nuxt.js 集成

本指南介绍如何在 Nuxt.js 应用中集成和使用 Pinia，包括完整的 SSR 支持。

## 安装

### 使用 Nuxt 模块

推荐使用官方的 `@pinia/nuxt` 模块：

```bash
npm install pinia @pinia/nuxt
```

### 配置 Nuxt

在 `nuxt.config.ts` 中添加模块：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],
  // 可选：配置 Pinia
  pinia: {
    autoImports: [
      // 自动导入 `defineStore()`
      'defineStore',
      // 自动导入 `defineStore()` 作为 `definePiniaStore()`
      ['defineStore', 'definePiniaStore'],
    ],
  },
})
```

## 基础使用

### 创建 Store

在 `stores/` 目录下创建 store：

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)
  
  const login = async (credentials: LoginCredentials) => {
    const { data } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    user.value = data.user
  }
  
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }
  
  return {
    user: readonly(user),
    isLoggedIn,
    login,
    logout
  }
})
```

### 在组件中使用

```vue
<!-- pages/profile.vue -->
<template>
  <div>
    <div v-if="userStore.isLoggedIn">
      <h1>欢迎，{{ userStore.user.name }}！</h1>
      <button @click="userStore.logout">退出登录</button>
    </div>
    <div v-else>
      <h1>请登录</h1>
      <LoginForm @login="userStore.login" />
    </div>
  </div>
</template>

<script setup>
const userStore = useUserStore()

// 在服务端预取数据
if (process.server && userStore.user) {
  await userStore.fetchUserProfile()
}
</script>
```

## SSR 支持

### 服务端数据预取

使用 Nuxt 的数据获取功能与 Pinia 结合：

```vue
<!-- pages/products/index.vue -->
<template>
  <div>
    <h1>产品列表</h1>
    <div v-if="pending">加载中...</div>
    <div v-else>
      <ProductCard 
        v-for="product in productStore.products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </div>
</template>

<script setup>
const productStore = useProductStore()

// 使用 useLazyAsyncData 进行数据预取
const { pending } = await useLazyAsyncData('products', async () => {
  if (!productStore.products.length) {
    await productStore.fetchProducts()
  }
})

// 或者使用 refresh 方法
const refresh = () => productStore.fetchProducts()
</script>
```

### 状态水合

Pinia 会自动处理服务端状态到客户端的水合：

```ts
// stores/app.ts
export const useAppStore = defineStore('app', () => {
  const settings = ref({
    theme: 'light',
    language: 'zh-CN'
  })
  
  const initializeApp = async () => {
    // 这个方法在服务端和客户端都会运行
    if (process.server) {
      // 服务端初始化逻辑
      const config = await $fetch('/api/config')
      settings.value = { ...settings.value, ...config }
    } else {
      // 客户端初始化逻辑
      const savedSettings = localStorage.getItem('app-settings')
      if (savedSettings) {
        settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
      }
    }
  }
  
  return {
    settings,
    initializeApp
  }
})
```

## 插件集成

### 创建 Pinia 插件

```ts
// plugins/pinia.client.ts
export default defineNuxtPlugin(({ $pinia }) => {
  $pinia.use(({ store }) => {
    // 只在客户端运行的插件逻辑
    if (process.client) {
      // 添加持久化
      const savedState = localStorage.getItem(`pinia-${store.$id}`)
      if (savedState) {
        store.$patch(JSON.parse(savedState))
      }
      
      // 监听变化并保存
      store.$subscribe((mutation, state) => {
        localStorage.setItem(`pinia-${store.$id}`, JSON.stringify(state))
      })
    }
  })
})
```

### 服务端插件

```ts
// plugins/pinia.server.ts
export default defineNuxtPlugin(({ $pinia }) => {
  $pinia.use(({ store }) => {
    // 服务端特定的插件逻辑
    if (process.server) {
      // 添加服务端日志
      store.$onAction(({ name, args }) => {
        console.log(`[Server] Action ${name} called with:`, args)
      })
    }
  })
})
```

## 中间件集成

### 路由中间件

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn) {
    return navigateTo('/login')
  }
})
```

### 全局中间件

```ts
// middleware/app.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const appStore = useAppStore()
  
  // 确保应用已初始化
  if (!appStore.isInitialized) {
    await appStore.initialize()
  }
  
  // 根据路由设置页面标题
  if (to.meta.title) {
    appStore.setPageTitle(to.meta.title)
  }
})
```

## API 集成

### 使用 $fetch

```ts
// stores/api.ts
export const useApiStore = defineStore('api', () => {
  const loading = ref(false)
  const error = ref(null)
  
  const apiCall = async <T>(url: string, options: any = {}): Promise<T> => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<T>(url, {
        ...options,
        onRequest({ request, options }) {
          // 添加认证头
          const userStore = useUserStore()
          if (userStore.token) {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${userStore.token}`
            }
          }
        },
        onResponseError({ response }) {
          // 处理认证错误
          if (response.status === 401) {
            const userStore = useUserStore()
            userStore.logout()
            navigateTo('/login')
          }
        }
      })
      
      return data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading: readonly(loading),
    error: readonly(error),
    apiCall
  }
})
```

### 响应式 API 调用

```ts
// composables/useApi.ts
export const useApi = <T>(url: string, options: any = {}) => {
  const apiStore = useApiStore()
  
  return useLazyAsyncData<T>(url, () => 
    apiStore.apiCall<T>(url, options)
  )
}

// 在组件中使用
const { data: products, pending, error, refresh } = await useApi('/api/products')
```

## 类型安全

### Store 类型定义

```ts
// types/stores.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface UserState {
  user: User | null
  token: string | null
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}
```

### 类型化 Store

```ts
// stores/user.ts
import type { User, UserState, UserPreferences } from '~/types/stores'

export const useUserStore = defineStore('user', (): UserState & {
  // Actions
  login(credentials: LoginCredentials): Promise<void>
  logout(): Promise<void>
  updatePreferences(prefs: Partial<UserPreferences>): void
  
  // Getters
  isLoggedIn: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
} => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const preferences = ref<UserPreferences>({
    theme: 'light',
    language: 'zh-CN',
    notifications: true
  })
  
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  const login = async (credentials: LoginCredentials) => {
    const response = await $fetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    
    user.value = response.user
    token.value = response.token
  }
  
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    token.value = null
  }
  
  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    preferences.value = { ...preferences.value, ...prefs }
  }
  
  return {
    user: readonly(user),
    token: readonly(token),
    preferences,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    updatePreferences
  }
})
```

## 测试

### 单元测试

```ts
// tests/stores/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '~/stores/user'

// Mock $fetch
vi.mock('#app', () => ({
  $fetch: vi.fn()
}))

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  it('应该正确处理登录', async () => {
    const store = useUserStore()
    const mockUser = { id: '1', name: 'John', email: 'john@example.com', role: 'user' }
    const mockToken = 'mock-token'
    
    // Mock API 响应
    vi.mocked($fetch).mockResolvedValueOnce({
      user: mockUser,
      token: mockToken
    })
    
    await store.login({ email: 'john@example.com', password: 'password' })
    
    expect(store.user).toEqual(mockUser)
    expect(store.token).toBe(mockToken)
    expect(store.isLoggedIn).toBe(true)
  })
  
  it('应该正确处理登出', async () => {
    const store = useUserStore()
    
    // 设置初始状态
    store.$patch({
      user: { id: '1', name: 'John', email: 'john@example.com', role: 'user' },
      token: 'mock-token'
    })
    
    vi.mocked($fetch).mockResolvedValueOnce({})
    
    await store.logout()
    
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
})
```

### 集成测试

```ts
// tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoginPage from '~/pages/login.vue'

describe('认证集成测试', () => {
  it('应该正确渲染登录页面', async () => {
    const component = await mountSuspended(LoginPage)
    
    expect(component.text()).toContain('登录')
  })
  
  it('应该处理登录流程', async () => {
    const component = await mountSuspended(LoginPage)
    
    // 模拟用户输入
    await component.find('input[type="email"]').setValue('test@example.com')
    await component.find('input[type="password"]').setValue('password')
    
    // 提交表单
    await component.find('form').trigger('submit')
    
    // 验证状态变化
    const userStore = useUserStore()
    expect(userStore.isLoggedIn).toBe(true)
  })
})
```

## 性能优化

### 懒加载 Store

```ts
// composables/useLazyStore.ts
export const useLazyStore = <T>(storeFactory: () => T): Promise<T> => {
  return new Promise((resolve) => {
    if (process.client) {
      // 客户端懒加载
      nextTick(() => {
        resolve(storeFactory())
      })
    } else {
      // 服务端立即加载
      resolve(storeFactory())
    }
  })
}

// 使用示例
const store = await useLazyStore(() => useHeavyStore())
```

### 代码分割

```ts
// stores/index.ts
export const useUserStore = () => import('./user').then(m => m.useUserStore)
export const useProductStore = () => import('./product').then(m => m.useProductStore)
export const useCartStore = () => import('./cart').then(m => m.useCartStore)

// 在组件中使用
const loadUserStore = async () => {
  const { useUserStore } = await import('~/stores/user')
  return useUserStore()
}
```

## 部署注意事项

### 环境变量

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 服务端环境变量
    apiSecret: process.env.API_SECRET,
    
    public: {
      // 客户端环境变量
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  }
})

// 在 store 中使用
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
```

### 生产优化

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    // 预渲染路由
    prerender: {
      routes: ['/sitemap.xml']
    }
  },
  
  // 构建优化
  build: {
    transpile: ['pinia']
  },
  
  // 实验性功能
  experimental: {
    payloadExtraction: false // 如果使用大量 store 数据
  }
})
```

## 最佳实践

### Store 组织

```
stores/
├── index.ts          # Store 导出
├── user.ts           # 用户相关
├── auth.ts           # 认证相关
├── products/         # 产品模块
│   ├── index.ts
│   ├── list.ts
│   └── detail.ts
└── utils/            # Store 工具
    ├── api.ts
    └── cache.ts
```

### 错误处理

```ts
// stores/error.ts
export const useErrorStore = defineStore('error', () => {
  const errors = ref<Array<AppError>>([])
  
  const addError = (error: AppError) => {
    errors.value.push(error)
    
    // 自动清除错误
    setTimeout(() => {
      removeError(error.id)
    }, 5000)
  }
  
  const removeError = (id: string) => {
    const index = errors.value.findIndex(e => e.id === id)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }
  
  const clearErrors = () => {
    errors.value = []
  }
  
  return {
    errors: readonly(errors),
    addError,
    removeError,
    clearErrors
  }
})

// 全局错误处理
export default defineNuxtPlugin(() => {
  const errorStore = useErrorStore()
  
  // 捕获未处理的错误
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      errorStore.addError({
        id: Date.now().toString(),
        message: event.reason.message || '未知错误',
        type: 'error'
      })
    })
  }
})
```

### 开发工具

```ts
// plugins/devtools.client.ts
export default defineNuxtPlugin(() => {
  if (process.dev) {
    // 开发环境下的调试工具
    window.__PINIA_STORES__ = {}
    
    const pinia = usePinia()
    pinia.use(({ store }) => {
      window.__PINIA_STORES__[store.$id] = store
    })
  }
})
```

## 常见问题

### Q: 如何在 Nuxt 3 中使用 Pinia？

A: 使用 `@pinia/nuxt` 模块，它提供了完整的 Nuxt 3 支持，包括自动导入和 SSR。

### Q: 状态在服务端和客户端不一致怎么办？

A: 确保在服务端和客户端使用相同的数据获取逻辑，并正确处理异步操作。

### Q: 如何在 Nuxt 中持久化 store 状态？

A: 使用插件在客户端将状态保存到 localStorage，在服务端从 cookie 或数据库恢复。

### Q: 如何处理认证状态？

A: 使用中间件检查认证状态，在服务端从 cookie 恢复用户信息，在客户端监听认证变化。

## 相关资源

- [Nuxt.js 官方文档](https://nuxt.com)
- [@pinia/nuxt 模块](https://pinia.vuejs.org/ssr/nuxt.html)
- [Pinia SSR 指南](../api/ssr.md)
- [状态序列化](../api/state-serialization.md)
- [性能优化](../guide/performance.md)