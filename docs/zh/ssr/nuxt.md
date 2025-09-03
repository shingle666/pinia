---
title: Nuxt.js SSR - Pinia 指南
description: 学习如何在 Nuxt.js 中使用 Pinia 进行服务端渲染。包含设置、配置和 SSR 应用最佳实践的完整指南。
keywords: Pinia, Vue.js, Nuxt.js, SSR, 服务端渲染, 状态管理, 水合, 通用应用
author: Pinia Team
generator: VitePress
og:title: Nuxt.js SSR - Pinia 指南
og:description: 学习如何在 Nuxt.js 中使用 Pinia 进行服务端渲染。包含设置、配置和 SSR 应用最佳实践的完整指南。
og:image: /og-image.svg
og:url: https://allfun.net/zh/ssr/nuxt
twitter:card: summary_large_image
twitter:title: Nuxt.js SSR - Pinia 指南
twitter:description: 学习如何在 Nuxt.js 中使用 Pinia 进行服务端渲染。包含设置、配置和 SSR 应用最佳实践的完整指南。
twitter:image: /og-image.svg
---

# Nuxt.js SSR

Pinia 与 Nuxt.js 无缝协作，为你的 Vue 应用程序提供服务端渲染（SSR）功能。本指南涵盖了如何在 Nuxt.js 环境中设置和使用 Pinia。

## 安装

### Nuxt 3

对于 Nuxt 3，安装官方的 Pinia 模块：

```bash
npm install @pinia/nuxt
```

将模块添加到你的 `nuxt.config.ts`：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],
})
```

就是这样！现在你可以在 Nuxt 3 应用程序中使用 Pinia，无需任何额外配置。

### Nuxt 2

对于 Nuxt 2，你需要同时安装 Pinia 和 composition API：

```bash
npm install pinia @nuxtjs/composition-api
```

创建一个插件文件：

```js
// plugins/pinia.js
import { createPinia, PiniaVuePlugin } from 'pinia'

export default ({ app }, inject) => {
  app.use(PiniaVuePlugin)
  const pinia = createPinia()
  app.use(pinia)
  inject('pinia', pinia)
}
```

在 `nuxt.config.js` 中注册插件：

```js
// nuxt.config.js
export default {
  buildModules: [
    '@nuxtjs/composition-api/module'
  ],
  plugins: [
    '~/plugins/pinia.js'
  ]
}
```

## 基本用法

### 创建 Store

在 `stores` 目录中创建你的 store：

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: '张三'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    async fetchUserData() {
      const { $fetch } = useNuxtApp()
      try {
        const userData = await $fetch('/api/user')
        this.name = userData.name
      } catch (error) {
        console.error('获取用户数据失败:', error)
      }
    }
  }
})
```

### 在组件中使用 Store

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>{{ counter.name }}</h1>
    <p>计数: {{ counter.count }}</p>
    <p>双倍计数: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">增加</button>
    <button @click="counter.fetchUserData()">获取用户数据</button>
  </div>
</template>

<script setup>
const counter = useCounterStore()

// 在服务端获取数据
await counter.fetchUserData()
</script>
```

### 在 Composables 中使用 Store

```js
// composables/useAuth.js
export const useAuth = () => {
  const authStore = useAuthStore()
  
  const login = async (credentials) => {
    try {
      await authStore.login(credentials)
      await navigateTo('/dashboard')
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: '凭据无效'
      })
    }
  }
  
  const logout = async () => {
    await authStore.logout()
    await navigateTo('/login')
  }
  
  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    login,
    logout
  }
}
```

## 服务端数据获取

### 使用 `useFetch` 与 Store

```js
// stores/posts.js
import { defineStore } from 'pinia'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchPosts() {
      this.loading = true
      this.error = null
      
      try {
        const { data } = await $fetch('/api/posts')
        this.posts = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async fetchPost(id) {
      const { data } = await $fetch(`/api/posts/${id}`)
      const existingPost = this.posts.find(post => post.id === id)
      
      if (existingPost) {
        Object.assign(existingPost, data)
      } else {
        this.posts.push(data)
      }
      
      return data
    }
  }
})
```

```vue
<!-- pages/posts/index.vue -->
<template>
  <div>
    <h1>文章</h1>
    <div v-if="postsStore.loading">加载中...</div>
    <div v-else-if="postsStore.error">错误: {{ postsStore.error }}</div>
    <div v-else>
      <article v-for="post in postsStore.posts" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <NuxtLink :to="`/posts/${post.id}`">阅读更多</NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup>
const postsStore = usePostsStore()

// 在服务端获取文章
await postsStore.fetchPosts()
</script>
```

### 使用 `asyncData`（Nuxt 2）

```vue
<!-- pages/posts/_id.vue -->
<template>
  <div>
    <h1>{{ post.title }}</h1>
    <div v-html="post.content"></div>
  </div>
</template>

<script>
import { usePostsStore } from '~/stores/posts'

export default {
  async asyncData({ params, $pinia }) {
    const postsStore = usePostsStore($pinia)
    const post = await postsStore.fetchPost(params.id)
    
    return {
      post
    }
  }
}
</script>
```

## 状态水合

### 自动水合（Nuxt 3）

使用 `@pinia/nuxt` 模块，状态水合会自动处理。服务端状态会被序列化并发送到客户端，在那里自动恢复。

### 手动水合（Nuxt 2）

对于 Nuxt 2，你可能需要手动处理水合：

```js
// plugins/pinia.client.js
export default ({ app, nuxtState }) => {
  // 从 nuxtState 恢复状态
  if (nuxtState.pinia) {
    app.$pinia.state.value = nuxtState.pinia
  }
}
```

```js
// nuxt.config.js
export default {
  plugins: [
    '~/plugins/pinia.js',
    { src: '~/plugins/pinia.client.js', mode: 'client' }
  ]
}
```

## SSR 认证

### 认证 Store

```js
// stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  
  actions: {
    async login(credentials) {
      this.isLoading = true
      
      try {
        const { data } = await $fetch('/api/auth/login', {
          method: 'POST',
          body: credentials
        })
        
        this.token = data.token
        this.user = data.user
        
        // 为 SSR 设置 cookie
        const tokenCookie = useCookie('auth-token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 天
        })
        tokenCookie.value = data.token
        
      } catch (error) {
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async logout() {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
      } catch (error) {
        console.error('退出登录错误:', error)
      } finally {
        this.user = null
        this.token = null
        
        // 清除 cookie
        const tokenCookie = useCookie('auth-token')
        tokenCookie.value = null
      }
    },
    
    async fetchUser() {
      if (!this.token) return
      
      try {
        const { data } = await $fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        this.user = data
      } catch (error) {
        // token 可能无效，清除认证状态
        this.user = null
        this.token = null
      }
    },
    
    // 从 cookie 初始化认证状态
    initializeAuth() {
      const tokenCookie = useCookie('auth-token')
      if (tokenCookie.value) {
        this.token = tokenCookie.value
        this.fetchUser()
      }
    }
  }
})
```

### 认证插件

```js
// plugins/auth.client.js
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // 在客户端初始化认证状态
  authStore.initializeAuth()
})
```

### 认证中间件

```js
// middleware/auth.js
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

```vue
<!-- pages/dashboard.vue -->
<template>
  <div>
    <h1>仪表板</h1>
    <p>欢迎，{{ authStore.user?.name }}！</p>
    <button @click="authStore.logout()">退出登录</button>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
</script>
```

## 错误处理

### 全局错误处理

```js
// stores/error.js
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', {
  state: () => ({
    errors: []
  }),
  
  actions: {
    addError(error) {
      this.errors.push({
        id: Date.now(),
        message: error.message || '发生了错误',
        type: error.type || 'error',
        timestamp: new Date()
      })
    },
    
    removeError(id) {
      const index = this.errors.findIndex(error => error.id === id)
      if (index > -1) {
        this.errors.splice(index, 1)
      }
    },
    
    clearErrors() {
      this.errors = []
    }
  }
})
```

```js
// plugins/error-handler.js
export default defineNuxtPlugin(() => {
  const errorStore = useErrorStore()
  
  // 处理 Vue 错误
  const vueApp = useNuxtApp().vueApp
  vueApp.config.errorHandler = (error, instance, info) => {
    errorStore.addError({
      message: error.message,
      type: 'vue-error',
      context: info
    })
  }
  
  // 处理未处理的 promise 拒绝
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      errorStore.addError({
        message: event.reason.message || '未处理的 promise 拒绝',
        type: 'promise-rejection'
      })
    })
  }
})
```

## 性能优化

### 懒加载 Store

```js
// composables/useLazyStore.js
export const useLazyStore = (storeFactory) => {
  const store = ref(null)
  
  const loadStore = async () => {
    if (!store.value) {
      store.value = storeFactory()
    }
    return store.value
  }
  
  return {
    store: readonly(store),
    loadStore
  }
}
```

```vue
<!-- pages/heavy-page.vue -->
<template>
  <div>
    <div v-if="!store">加载中...</div>
    <div v-else>
      <!-- 重型组件内容 -->
    </div>
  </div>
</template>

<script setup>
const { store, loadStore } = useLazyStore(() => useHeavyStore())

onMounted(async () => {
  await loadStore()
})
</script>
```

### Store 拆分

```js
// stores/user/profile.js
export const useUserProfileStore = defineStore('userProfile', {
  state: () => ({
    profile: null,
    preferences: null
  }),
  
  actions: {
    async fetchProfile() {
      const { data } = await $fetch('/api/user/profile')
      this.profile = data
    }
  }
})

// stores/user/settings.js
export const useUserSettingsStore = defineStore('userSettings', {
  state: () => ({
    theme: 'light',
    language: 'zh',
    notifications: true
  }),
  
  actions: {
    async updateSettings(settings) {
      await $fetch('/api/user/settings', {
        method: 'PUT',
        body: settings
      })
      Object.assign(this, settings)
    }
  }
})
```

## 使用 Nuxt 进行测试

### 单元测试

```js
// tests/stores/counter.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '~/stores/counter'

describe('计数器 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('增加计数', () => {
    const counter = useCounterStore()
    expect(counter.count).toBe(0)
    
    counter.increment()
    expect(counter.count).toBe(1)
  })
  
  it('计算双倍计数', () => {
    const counter = useCounterStore()
    counter.count = 5
    expect(counter.doubleCount).toBe(10)
  })
})
```

### 集成测试

```js
// tests/pages/index.test.js
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('首页', () => {
  it('正确渲染', async () => {
    const component = await mountSuspended(IndexPage)
    expect(component.text()).toContain('计数: 0')
  })
  
  it('点击按钮时增加计数器', async () => {
    const component = await mountSuspended(IndexPage)
    
    await component.find('button').trigger('click')
    expect(component.text()).toContain('计数: 1')
  })
})
```

## 最佳实践

### 1. Store 组织

```
stores/
├── auth.js          # 认证状态
├── user/
│   ├── profile.js   # 用户资料数据
│   └── settings.js  # 用户偏好
├── products/
│   ├── catalog.js   # 产品列表
│   └── cart.js      # 购物车
└── ui/
    ├── theme.js     # 主题设置
    └── navigation.js # 导航状态
```

### 2. SSR 安全状态

避免在 store 状态中使用浏览器特定的 API：

```js
// ❌ 错误 - 会导致水合不匹配
export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: localStorage.getItem('theme') === 'dark'
  })
})

// ✅ 正确 - 安全初始化
export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false
  }),
  
  actions: {
    initializeTheme() {
      if (process.client) {
        this.isDark = localStorage.getItem('theme') === 'dark'
      }
    }
  }
})
```

### 3. Cookie 管理

```js
// composables/usePersistentStore.js
export const usePersistentStore = (key, defaultValue) => {
  const cookie = useCookie(key, {
    default: () => defaultValue,
    serialize: JSON.stringify,
    deserialize: JSON.parse
  })
  
  return {
    value: cookie,
    update: (newValue) => {
      cookie.value = newValue
    },
    reset: () => {
      cookie.value = defaultValue
    }
  }
}
```

### 4. 类型安全（TypeScript）

```ts
// types/auth.ts
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

// stores/auth.ts
import type { AuthState, User } from '~/types/auth'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isLoading: false
  }),
  
  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isAdmin: (state): boolean => state.user?.role === 'admin'
  },
  
  actions: {
    async login(credentials: LoginCredentials): Promise<void> {
      // 实现
    }
  }
})
```

## 常见模式

### 1. 数据获取模式

```js
// composables/useAsyncData.js
export const useAsyncData = (key, fetcher, options = {}) => {
  const data = ref(null)
  const error = ref(null)
  const pending = ref(false)
  
  const execute = async () => {
    pending.value = true
    error.value = null
    
    try {
      data.value = await fetcher()
    } catch (err) {
      error.value = err
    } finally {
      pending.value = false
    }
  }
  
  // 在服务端执行
  if (process.server || options.immediate !== false) {
    execute()
  }
  
  return {
    data: readonly(data),
    error: readonly(error),
    pending: readonly(pending),
    refresh: execute
  }
}
```

### 2. 乐观更新

```js
// stores/todos.js
export const useTodosStore = defineStore('todos', {
  state: () => ({
    todos: []
  }),
  
  actions: {
    async addTodo(todo) {
      // 乐观更新
      const tempId = Date.now()
      const optimisticTodo = { ...todo, id: tempId, pending: true }
      this.todos.push(optimisticTodo)
      
      try {
        const { data } = await $fetch('/api/todos', {
          method: 'POST',
          body: todo
        })
        
        // 用真实数据替换乐观 todo
        const index = this.todos.findIndex(t => t.id === tempId)
        if (index > -1) {
          this.todos[index] = data
        }
      } catch (error) {
        // 错误时移除乐观 todo
        const index = this.todos.findIndex(t => t.id === tempId)
        if (index > -1) {
          this.todos.splice(index, 1)
        }
        throw error
      }
    }
  }
})
```

## 故障排除

### 常见问题

1. **水合不匹配**
   - 确保服务端和客户端状态相同
   - 避免在初始状态中使用浏览器特定的 API
   - 必要时使用 `process.client` 检查

2. **找不到 Store**
   - 确保 store 正确导入
   - 检查 Pinia 是否正确安装和配置
   - 验证 store ID 是唯一的

3. **状态不持久**
   - 检查 cookie 配置
   - 确保正确的序列化/反序列化
   - 验证 SSR 设置是否正确

### 调试模式

```js
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt'
  ],
  pinia: {
    storesDirs: ['./stores/**'],
    // 在开发环境中启用开发工具
    devtools: process.env.NODE_ENV === 'development'
  }
})
```

## 从 Vuex 迁移

如果你正在将 Nuxt 应用程序从 Vuex 迁移到 Pinia：

```js
// 之前（Vuex）
// store/index.js
export const state = () => ({
  counter: 0
})

export const mutations = {
  increment(state) {
    state.counter++
  }
}

export const actions = {
  async fetchData({ commit }) {
    const data = await this.$axios.$get('/api/data')
    commit('setData', data)
  }
}

// 之后（Pinia）
// stores/counter.js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    counter: 0
  }),
  
  actions: {
    increment() {
      this.counter++
    },
    
    async fetchData() {
      const data = await $fetch('/api/data')
      this.data = data
    }
  }
})
```

## 总结

Pinia 为 Nuxt.js 应用程序提供了出色的 SSR 支持，配置最少。主要优势包括：

- 自动状态水合
- TypeScript 类型安全
- 与 Nuxt 数据获取的无缝集成
- 使用开发工具的更好开发体验
- 与 Vuex 相比简化的 store 结构

有关更高级的模式和示例，请参阅 [Pinia 文档](../guide/) 和 [Nuxt.js 文档](https://nuxt.com/)。