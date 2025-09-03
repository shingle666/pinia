---
title: 服务端渲染 (SSR) - Pinia 指南
description: 学习如何在服务端渲染框架（如 Nuxt.js、Next.js 和自定义 SSR 设置）中使用 Pinia。
keywords: Pinia, Vue.js, SSR, 服务端渲染, Nuxt.js, Next.js, 水合, 状态管理
author: Pinia Team
generator: VitePress
og:title: 服务端渲染 (SSR) - Pinia 指南
og:description: 学习如何在服务端渲染框架（如 Nuxt.js、Next.js 和自定义 SSR 设置）中使用 Pinia。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/ssr
twitter:card: summary_large_image
twitter:title: 服务端渲染 (SSR) - Pinia 指南
twitter:description: 学习如何在服务端渲染框架（如 Nuxt.js、Next.js 和自定义 SSR 设置）中使用 Pinia。
twitter:image: /og-image.svg
---

# 服务端渲染 (SSR)

Pinia 开箱即用地支持服务端渲染。本指南涵盖如何在各种 SSR 框架中使用 Pinia，以及处理常见的 SSR 场景，如状态水合、数据获取和 store 管理。

## 概述

在 SSR 中使用 Pinia 时，您需要考虑：

- **状态序列化**：将 store 状态转换为 JSON 以供客户端水合
- **Store 水合**：在客户端恢复服务器状态
- **数据获取**：在渲染前在服务器上加载数据
- **Store 隔离**：确保 store 不会在请求之间泄漏

## Nuxt.js 集成

### 安装

Nuxt.js 通过 `@pinia/nuxt` 模块内置了 Pinia 支持：

```bash
npm install pinia @pinia/nuxt
```

### 配置

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt'
  ],
  
  // 可选：配置 Pinia
  pinia: {
    autoImports: [
      // 自动导入 `defineStore`
      'defineStore',
      // 自动导入 `defineStore` 作为 `definePiniaStore`
      ['defineStore', 'definePiniaStore']
    ]
  }
})
```

### Store 定义

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    preferences: {
      theme: 'light',
      language: 'zh'
    }
  }),
  
  actions: {
    async fetchUser() {
      // 这在服务器和客户端都能工作
      const { data } = await $fetch('/api/user')
      this.user = data
    },
    
    async updatePreferences(prefs: Partial<UserPreferences>) {
      this.preferences = { ...this.preferences, ...prefs }
      
      // 保存到服务器
      await $fetch('/api/user/preferences', {
        method: 'POST',
        body: this.preferences
      })
    }
  }
})
```

### 服务端数据获取

```vue
<!-- pages/profile.vue -->
<template>
  <div>
    <h1>用户资料</h1>
    <div v-if="user">
      <p>姓名: {{ user.name }}</p>
      <p>邮箱: {{ user.email }}</p>
      
      <div class="preferences">
        <label>
          主题:
          <select v-model="preferences.theme" @change="updatePrefs">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </label>
        
        <label>
          语言:
          <select v-model="preferences.language" @change="updatePrefs">
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
      </div>
    </div>
    
    <div v-else>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
const userStore = useUserStore()
const { user, preferences } = storeToRefs(userStore)

// 在服务端获取用户数据
await userStore.fetchUser()

const updatePrefs = async () => {
  await userStore.updatePreferences(preferences.value)
}
</script>
```

### Nuxt 插件

```ts
// plugins/pinia.client.ts
export default defineNuxtPlugin(() => {
  // 仅客户端初始化
  const userStore = useUserStore()
  
  // 从 localStorage 恢复用户会话
  const savedSession = localStorage.getItem('user-session')
  if (savedSession) {
    userStore.$patch(JSON.parse(savedSession))
  }
  
  // 在变化时保存会话
  userStore.$subscribe((mutation, state) => {
    localStorage.setItem('user-session', JSON.stringify({
      user: state.user,
      preferences: state.preferences
    }))
  })
})
```

## Next.js 集成

### 使用 App Router 设置

```tsx
// app/providers.tsx
'use client'

import { createPinia } from 'pinia'
import { PiniaProvider } from 'pinia-react'

const pinia = createPinia()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PiniaProvider pinia={pinia}>
      {children}
    </PiniaProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### 在 Next.js 中使用 Store

```ts
// stores/posts.ts
import { defineStore } from 'pinia'

interface Post {
  id: number
  title: string
  content: string
  author: string
}

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [] as Post[],
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchPosts() {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch('/api/posts')
        if (!response.ok) {
          throw new Error('获取文章失败')
        }
        
        this.posts = await response.json()
      } catch (error) {
        this.error = error instanceof Error ? error.message : '未知错误'
      } finally {
        this.loading = false
      }
    },
    
    async createPost(post: Omit<Post, 'id'>) {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(post)
      })
      
      if (!response.ok) {
        throw new Error('创建文章失败')
      }
      
      const newPost = await response.json()
      this.posts.push(newPost)
      
      return newPost
    }
  }
})
```

### 带数据获取的服务器组件

```tsx
// app/posts/page.tsx
import { PostsList } from './posts-list'
import { getInitialPosts } from '@/lib/api'

export default async function PostsPage() {
  // 在服务器上获取数据
  const initialPosts = await getInitialPosts()
  
  return (
    <div>
      <h1>文章</h1>
      <PostsList initialPosts={initialPosts} />
    </div>
  )
}
```

```tsx
// app/posts/posts-list.tsx
'use client'

import { useEffect } from 'react'
import { usePostsStore } from '@/stores/posts'

interface PostsListProps {
  initialPosts: Post[]
}

export function PostsList({ initialPosts }: PostsListProps) {
  const postsStore = usePostsStore()
  
  // 用服务器数据水合 store
  useEffect(() => {
    postsStore.$patch({ posts: initialPosts })
  }, [initialPosts])
  
  const handleCreatePost = async () => {
    await postsStore.createPost({
      title: '新文章',
      content: '文章内容...',
      author: '当前用户'
    })
  }
  
  return (
    <div>
      <button onClick={handleCreatePost}>
        创建文章
      </button>
      
      {postsStore.loading && <p>加载中...</p>}
      {postsStore.error && <p>错误: {postsStore.error}</p>}
      
      <ul>
        {postsStore.posts.map(post => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <small>作者 {post.author}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## 自定义 SSR 设置

### 服务器入口点

```ts
// server.ts
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'

export async function render(url: string, manifest: any) {
  const app = createSSRApp(App)
  const pinia = createPinia()
  
  app.use(pinia)
  
  // 为路由预获取数据
  const router = createRouter()
  app.use(router)
  
  await router.push(url)
  await router.isReady()
  
  // 获取匹配的路由组件
  const matchedComponents = router.currentRoute.value.matched
    .flatMap(record => Object.values(record.components || {}))
  
  // 在匹配的组件上调用 asyncData
  await Promise.all(
    matchedComponents.map(async (component: any) => {
      if (component.asyncData) {
        await component.asyncData({ pinia, route: router.currentRoute.value })
      }
    })
  )
  
  // 渲染应用
  const html = await renderToString(app)
  
  // 序列化 store 状态
  const state = JSON.stringify(pinia.state.value)
  
  return {
    html,
    state
  }
}
```

### 客户端入口点

```ts
// client.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// 水合 store 状态
if (window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.use(pinia)
app.mount('#app')
```

### HTML 模板

```html
<!DOCTYPE html>
<html>
<head>
  <title>SSR 应用</title>
</head>
<body>
  <div id="app"><!--ssr-outlet--></div>
  
  <script>
    window.__PINIA_STATE__ = {{{state}}}
  </script>
  
  <script type="module" src="/client.js"></script>
</body>
</html>
```

## 状态水合

### 自动水合

```ts
// stores/app.ts
export const useAppStore = defineStore('app', {
  state: () => ({
    user: null,
    theme: 'light',
    locale: 'zh'
  }),
  
  actions: {
    // 这将在服务器和客户端都被调用
    async initialize() {
      // 获取初始数据
      if (process.server) {
        // 服务端初始化
        await this.fetchServerData()
      } else {
        // 客户端初始化
        await this.fetchClientData()
      }
    },
    
    async fetchServerData() {
      // 获取仅在服务器上可用的数据
      const userData = await getServerSideUserData()
      this.user = userData
    },
    
    async fetchClientData() {
      // 获取仅在客户端可用的数据
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.theme = savedTheme
      }
    }
  }
})
```

### 手动水合

```ts
// composables/useHydration.ts
export function useHydration() {
  const isHydrated = ref(false)
  
  const hydrate = (storeData: any) => {
    const pinia = getActivePinia()
    if (!pinia) return
    
    // 水合每个 store
    Object.keys(storeData).forEach(storeId => {
      const store = pinia._s.get(storeId)
      if (store) {
        store.$patch(storeData[storeId])
      }
    })
    
    isHydrated.value = true
  }
  
  return {
    isHydrated: readonly(isHydrated),
    hydrate
  }
}
```

```vue
<!-- App.vue -->
<template>
  <div v-if="isHydrated">
    <!-- 应用内容 -->
    <router-view />
  </div>
  <div v-else>
    <!-- 加载状态 -->
    <p>加载中...</p>
  </div>
</template>

<script setup>
const { isHydrated, hydrate } = useHydration()

onMounted(() => {
  // 从服务器状态水合
  if (window.__PINIA_STATE__) {
    hydrate(window.__PINIA_STATE__)
  }
})
</script>
```

## 数据获取模式

### 路由级数据获取

```ts
// stores/product.ts
export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[],
    currentProduct: null as Product | null,
    loading: false
  }),
  
  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const products = await api.getProducts()
        this.products = products
      } finally {
        this.loading = false
      }
    },
    
    async fetchProduct(id: string) {
      this.loading = true
      try {
        const product = await api.getProduct(id)
        this.currentProduct = product
      } finally {
        this.loading = false
      }
    }
  }
})
```

```vue
<!-- pages/products/[id].vue -->
<template>
  <div>
    <div v-if="currentProduct">
      <h1>{{ currentProduct.name }}</h1>
      <p>{{ currentProduct.description }}</p>
      <p>价格: ¥{{ currentProduct.price }}</p>
    </div>
    <div v-else-if="loading">
      <p>加载产品中...</p>
    </div>
    <div v-else>
      <p>未找到产品</p>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const productStore = useProductStore()
const { currentProduct, loading } = storeToRefs(productStore)

// 获取产品数据
const productId = route.params.id as string

// 这将在服务器和客户端都运行
if (!currentProduct.value || currentProduct.value.id !== productId) {
  await productStore.fetchProduct(productId)
}
</script>
```

### 组件级数据获取

```vue
<!-- components/UserProfile.vue -->
<template>
  <div class="user-profile">
    <div v-if="user">
      <img :src="user.avatar" :alt="user.name">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
      
      <div class="stats">
        <div>文章: {{ user.postsCount }}</div>
        <div>关注者: {{ user.followersCount }}</div>
      </div>
    </div>
    
    <div v-else-if="loading">
      <div class="skeleton">加载中...</div>
    </div>
    
    <div v-else>
      <p>未找到用户</p>
    </div>
  </div>
</template>

<script setup>
interface Props {
  userId: string
}

const props = defineProps<Props>()
const userStore = useUserStore()
const { user, loading } = storeToRefs(userStore)

// 当组件挂载或 userId 变化时获取用户数据
watchEffect(async () => {
  if (props.userId) {
    await userStore.fetchUser(props.userId)
  }
})
</script>
```

## 错误处理

### 全局错误处理

```ts
// stores/error.ts
export const useErrorStore = defineStore('error', {
  state: () => ({
    errors: [] as AppError[],
    globalError: null as string | null
  }),
  
  actions: {
    addError(error: AppError) {
      this.errors.push(error)
      
      // 5秒后自动移除
      setTimeout(() => {
        this.removeError(error.id)
      }, 5000)
    },
    
    removeError(id: string) {
      const index = this.errors.findIndex(e => e.id === id)
      if (index > -1) {
        this.errors.splice(index, 1)
      }
    },
    
    setGlobalError(message: string) {
      this.globalError = message
    },
    
    clearGlobalError() {
      this.globalError = null
    }
  }
})
```

```ts
// plugins/error-handler.ts
export default defineNuxtPlugin(() => {
  const errorStore = useErrorStore()
  
  // 处理全局错误
  window.addEventListener('error', (event) => {
    errorStore.addError({
      id: Date.now().toString(),
      message: event.message,
      type: 'javascript',
      timestamp: new Date()
    })
  })
  
  // 处理未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    errorStore.addError({
      id: Date.now().toString(),
      message: event.reason?.message || '未处理的 Promise 拒绝',
      type: 'promise',
      timestamp: new Date()
    })
  })
})
```

### Store 级错误处理

```ts
// stores/api.ts
export const useApiStore = defineStore('api', {
  state: () => ({
    loading: false,
    error: null as ApiError | null
  }),
  
  actions: {
    async apiCall<T>(fn: () => Promise<T>): Promise<T | null> {
      this.loading = true
      this.error = null
      
      try {
        const result = await fn()
        return result
      } catch (error) {
        this.error = {
          message: error instanceof Error ? error.message : '未知错误',
          code: error.code || 'UNKNOWN',
          timestamp: new Date()
        }
        
        // 在服务器上记录错误
        if (process.server) {
          console.error('API 错误:', error)
        }
        
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
```

## 性能优化

### 懒加载 Store

```ts
// composables/useLazyStore.ts
export function useLazyStore<T>(storeFactory: () => T): Ref<T | null> {
  const store = ref<T | null>(null)
  
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
<!-- components/HeavyComponent.vue -->
<template>
  <div>
    <button @click="loadData" :disabled="loading">
      加载重型数据
    </button>
    
    <div v-if="heavyStore && heavyStore.data">
      <!-- 重型数据内容 -->
    </div>
  </div>
</template>

<script setup>
const { store: heavyStore, loadStore } = useLazyStore(() => useHeavyDataStore())
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const store = await loadStore()
    await store.fetchHeavyData()
  } finally {
    loading.value = false
  }
}
</script>
```

### 使用 Store 进行代码分割

```ts
// router/index.ts
const routes = [
  {
    path: '/admin',
    component: () => import('@/pages/Admin.vue'),
    beforeEnter: async () => {
      // 懒加载管理员 store
      const { useAdminStore } = await import('@/stores/admin')
      const adminStore = useAdminStore()
      
      // 预获取管理员数据
      await adminStore.fetchAdminData()
    }
  }
]
```

## 最佳实践

### 1. Store 隔离

```ts
// 确保 store 不会在请求之间泄漏
export function createServerPinia() {
  const pinia = createPinia()
  
  // 添加服务器特定插件
  pinia.use(({ store }) => {
    // 向 store 添加请求上下文
    store.$request = getCurrentRequest()
  })
  
  return pinia
}
```

### 2. 状态序列化

```ts
// utils/serialization.ts
export function serializeState(state: any): string {
  return JSON.stringify(state, (key, value) => {
    // 处理特殊类型
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    if (value instanceof Map) {
      return { __type: 'Map', value: Array.from(value.entries()) }
    }
    if (value instanceof Set) {
      return { __type: 'Set', value: Array.from(value) }
    }
    return value
  })
}

export function deserializeState(serialized: string): any {
  return JSON.parse(serialized, (key, value) => {
    if (value && typeof value === 'object' && value.__type) {
      switch (value.__type) {
        case 'Date':
          return new Date(value.value)
        case 'Map':
          return new Map(value.value)
        case 'Set':
          return new Set(value.value)
      }
    }
    return value
  })
}
```

### 3. SEO 优化

```vue
<!-- pages/blog/[slug].vue -->
<template>
  <div>
    <Head>
      <title>{{ post?.title || '加载中...' }}</title>
      <meta name="description" :content="post?.excerpt" />
      <meta property="og:title" :content="post?.title" />
      <meta property="og:description" :content="post?.excerpt" />
      <meta property="og:image" :content="post?.featuredImage" />
    </Head>
    
    <article v-if="post">
      <h1>{{ post.title }}</h1>
      <div v-html="post.content"></div>
    </article>
  </div>
</template>

<script setup>
const route = useRoute()
const blogStore = useBlogStore()
const { post } = storeToRefs(blogStore)

// 为 SEO 获取文章数据
const slug = route.params.slug as string
await blogStore.fetchPost(slug)

// 处理 404
if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '文章未找到'
  })
}
</script>
```

### 4. 渐进增强

```vue
<!-- components/InteractiveChart.vue -->
<template>
  <div>
    <!-- SSR 的静态内容 -->
    <div v-if="!isClient" class="chart-placeholder">
      <p>启用 JavaScript 后图表将加载</p>
      <noscript>
        <img :src="staticChartUrl" alt="图表数据">
      </noscript>
    </div>
    
    <!-- 客户端的交互内容 -->
    <div v-else>
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
const isClient = process.client
const chartCanvas = ref<HTMLCanvasElement>()
const chartStore = useChartStore()

// 仅在客户端运行
if (isClient) {
  onMounted(async () => {
    await chartStore.initializeChart(chartCanvas.value)
  })
}
</script>
```

## 故障排除

### 常见问题

1. **水合不匹配**
   ```ts
   // 确保服务器和客户端之间状态一致
   const store = useStore()
   
   // 使用 process.client 避免水合问题
   if (process.client) {
     store.initializeClientOnlyFeatures()
   }
   ```

2. **内存泄漏**
   ```ts
   // 在服务器上清理 store
   export function cleanupStores() {
     const pinia = getActivePinia()
     if (pinia) {
       pinia._s.clear()
     }
   }
   ```

3. **状态持久化**
   ```ts
   // 小心处理状态持久化
   const store = useStore()
   
   // 仅在客户端访问 localStorage
   if (process.client) {
     const saved = localStorage.getItem('store-state')
     if (saved) {
       store.$patch(JSON.parse(saved))
     }
   }
   ```

## 相关链接

- [Nuxt.js 文档](https://nuxt.com/docs/getting-started/state-management)
- [Next.js 文档](https://nextjs.org/docs/basic-features/data-fetching)
- [Vue SSR 指南](https://cn.vuejs.org/guide/scaling-up/ssr.html)
- [Pinia 插件](./plugins) - 创建自定义插件
- [测试指南](./testing) - 测试 SSR 应用程序