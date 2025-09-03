# Nuxt.js 与 Pinia 集成

全面指南：如何将 Pinia 与 Nuxt.js 集成，涵盖 SSR、水合、中间件、插件和全栈应用的高级模式。

## 功能特性

- 🚀 服务端渲染 (SSR) 支持
- 💧 正确的水合处理
- 🔄 跨导航的状态持久化
- 🛡️ 中间件集成
- 🔌 插件系统集成
- 📱 通用渲染
- 🎯 类型安全的 store 组合
- 🔐 SSR 身份验证
- 📊 SEO 友好的数据获取
- ⚡ 性能优化

## 安装和设置

### 1. 安装依赖

```bash
npm install @pinia/nuxt pinia
# 或
yarn add @pinia/nuxt pinia
```

### 2. Nuxt 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],
  pinia: {
    autoImports: [
      // 自动导入 `defineStore`
      'defineStore',
      // 自动导入 `defineStore` 作为 `definePiniaStore`
      ['defineStore', 'definePiniaStore'],
    ],
  },
  ssr: true, // 启用 SSR
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // 私有密钥（仅在服务端可用）
    apiSecret: process.env.API_SECRET,
    // 公共密钥（暴露给客户端）
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  }
})
```

## Store 定义

### 支持 SSR 的用户 Store

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 计算属性
  const userProfile = computed(() => {
    if (!user.value) return null
    return {
      ...user.value,
      fullName: `${user.value.firstName} ${user.value.lastName}`,
      initials: `${user.value.firstName[0]}${user.value.lastName[0]}`
    }
  })
  
  const hasRole = computed(() => (role: string) => {
    return user.value?.roles?.includes(role) || false
  })
  
  // 操作
  async function fetchUser() {
    if (process.server && !user.value) {
      // 服务端：从 API 或数据库获取
      loading.value = true
      try {
        const { $fetch } = useNuxtApp()
        const userData = await $fetch('/api/user/profile')
        user.value = userData
        isAuthenticated.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : '获取用户失败'
        isAuthenticated.value = false
      } finally {
        loading.value = false
      }
    }
  }
  
  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null
    
    try {
      const { $fetch } = useNuxtApp()
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      isAuthenticated.value = true
      
      // 设置身份验证 cookie
      const token = useCookie('auth-token', {
        default: () => null,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 天
      })
      token.value = response.token
      
      // 重定向到仪表板
      await navigateTo('/dashboard')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function logout() {
    try {
      const { $fetch } = useNuxtApp()
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('登出错误:', err)
    } finally {
      user.value = null
      isAuthenticated.value = false
      
      // 清除身份验证 cookie
      const token = useCookie('auth-token')
      token.value = null
      
      // 重定向到登录页
      await navigateTo('/login')
    }
  }
  
  async function updateProfile(updates: Partial<User>) {
    if (!user.value) return
    
    loading.value = true
    try {
      const { $fetch } = useNuxtApp()
      const updatedUser = await $fetch('/api/user/profile', {
        method: 'PATCH',
        body: updates
      })
      
      user.value = { ...user.value, ...updatedUser }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 在客户端初始化用户
  function initializeUser() {
    if (process.client) {
      const token = useCookie('auth-token')
      if (token.value && !user.value) {
        fetchUser()
      }
    }
  }
  
  return {
    // 状态
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    loading: readonly(loading),
    error: readonly(error),
    
    // 计算属性
    userProfile,
    hasRole,
    
    // 操作
    fetchUser,
    login,
    logout,
    updateProfile,
    initializeUser
  }
})
```

### 支持 SSR 数据获取的文章 Store

```typescript
// stores/posts.ts
export const usePostsStore = defineStore('posts', () => {
  // 状态
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // 计算属性
  const publishedPosts = computed(() => {
    return posts.value.filter(post => post.status === 'published')
  })
  
  const postsByCategory = computed(() => (category: string) => {
    return posts.value.filter(post => post.category === category)
  })
  
  // 操作
  async function fetchPosts(options: FetchPostsOptions = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      refresh = false
    } = options
    
    // 避免重复请求
    if (loading.value && !refresh) return
    
    // 在客户端使用缓存数据（如果可用）
    if (process.client && posts.value.length > 0 && !refresh) {
      return posts.value
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { $fetch } = useNuxtApp()
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
        ...(search && { search })
      })
      
      const response = await $fetch(`/api/posts?${query}`)
      
      if (page === 1 || refresh) {
        posts.value = response.posts
      } else {
        // 分页追加
        posts.value.push(...response.posts)
      }
      
      pagination.value = {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages
      }
      
      return response.posts
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文章失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function fetchPostById(id: string) {
    // 检查文章是否已在缓存中
    const cachedPost = posts.value.find(post => post.id === id)
    if (cachedPost && !loading.value) {
      currentPost.value = cachedPost
      return cachedPost
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { $fetch } = useNuxtApp()
      const post = await $fetch(`/api/posts/${id}`)
      
      currentPost.value = post
      
      // 如果文章存在则更新缓存
      const existingIndex = posts.value.findIndex(p => p.id === id)
      if (existingIndex !== -1) {
        posts.value[existingIndex] = post
      } else {
        posts.value.unshift(post)
      }
      
      return post
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文章失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function createPost(postData: CreatePostData) {
    loading.value = true
    error.value = null
    
    try {
      const { $fetch } = useNuxtApp()
      const newPost = await $fetch('/api/posts', {
        method: 'POST',
        body: postData
      })
      
      posts.value.unshift(newPost)
      pagination.value.total += 1
      
      return newPost
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建文章失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function updatePost(id: string, updates: Partial<Post>) {
    loading.value = true
    error.value = null
    
    try {
      const { $fetch } = useNuxtApp()
      const updatedPost = await $fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        body: updates
      })
      
      // 更新缓存
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value = updatedPost
      }
      
      return updatedPost
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新文章失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function deletePost(id: string) {
    loading.value = true
    error.value = null
    
    try {
      const { $fetch } = useNuxtApp()
      await $fetch(`/api/posts/${id}`, { method: 'DELETE' })
      
      // 从缓存中移除
      posts.value = posts.value.filter(post => post.id !== id)
      pagination.value.total -= 1
      
      if (currentPost.value?.id === id) {
        currentPost.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除文章失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  function clearCurrentPost() {
    currentPost.value = null
  }
  
  function resetPagination() {
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  }
  
  return {
    // 状态
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    
    // 计算属性
    publishedPosts,
    postsByCategory,
    
    // 操作
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    clearCurrentPost,
    resetPagination
  }
})
```

## 服务端 API 路由

### 身份验证 API

```typescript
// server/api/auth/login.post.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: '邮箱和密码是必需的'
    })
  }
  
  try {
    // 在数据库中查找用户
    const user = await findUserByEmail(email)
    
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw createError({
        statusCode: 401,
        statusMessage: '无效的凭据'
      })
    }
    
    // 生成 JWT token
    const config = useRuntimeConfig()
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.apiSecret,
      { expiresIn: '7d' }
    )
    
    // 设置安全 cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 天
    })
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles
      },
      token
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '身份验证失败'
    })
  }
})
```

### 文章 API

```typescript
// server/api/posts/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {
    page = 1,
    limit = 10,
    category,
    search
  } = query
  
  try {
    const posts = await fetchPostsFromDatabase({
      page: Number(page),
      limit: Number(limit),
      category: category as string,
      search: search as string
    })
    
    return {
      posts: posts.data,
      page: posts.page,
      limit: posts.limit,
      total: posts.total,
      totalPages: posts.totalPages
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '获取文章失败'
    })
  }
})

// server/api/posts/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 ID 是必需的'
    })
  }
  
  try {
    const post = await findPostById(id)
    
    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: '文章未找到'
      })
    }
    
    return post
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '获取文章失败'
    })
  }
})
```

## 中间件

### 身份验证中间件

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  
  // 在客户端初始化用户
  if (process.client) {
    userStore.initializeUser()
  }
  
  // 检查身份验证
  if (!userStore.isAuthenticated) {
    return navigateTo('/login')
  }
})

// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  
  // 将已认证用户重定向离开访客页面
  if (userStore.isAuthenticated) {
    return navigateTo('/dashboard')
  }
})

// middleware/admin.ts
export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  
  if (!userStore.isAuthenticated) {
    return navigateTo('/login')
  }
  
  if (!userStore.hasRole('admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: '访问被拒绝'
    })
  }
})
```

## 插件

### Pinia 持久化插件

```typescript
// plugins/pinia-persistence.client.ts
import { PiniaPluginContext } from 'pinia'

function createPersistedState() {
  return (context: PiniaPluginContext) => {
    const { store, options } = context
    
    // 只持久化选择加入的 store
    if (!options.persist) return
    
    const storageKey = `pinia-${store.$id}`
    
    // 从 localStorage 恢复状态
    const savedState = localStorage.getItem(storageKey)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        store.$patch(parsedState)
      } catch (error) {
        console.error('恢复状态失败:', error)
        localStorage.removeItem(storageKey)
      }
    }
    
    // 将状态变化保存到 localStorage
    store.$subscribe((mutation, state) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.error('持久化状态失败:', error)
      }
    })
  }
}

export default defineNuxtPlugin(() => {
  const { $pinia } = useNuxtApp()
  $pinia.use(createPersistedState())
})
```

### API 插件

```typescript
// plugins/api.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ request, options }) {
      // 添加身份验证 token
      const token = useCookie('auth-token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    onResponseError({ response }) {
      // 处理身份验证错误
      if (response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
      }
    }
  })
  
  return {
    provide: {
      api
    }
  }
})
```

## 支持 SSR 的页面

### 博客首页

```vue
<!-- pages/blog/index.vue -->
<template>
  <div class="blog-page">
    <Head>
      <Title>博客 - 最新文章</Title>
      <Meta name="description" content="阅读我们最新的博客文章和文章" />
    </Head>
    
    <div class="container">
      <h1>最新文章</h1>
      
      <!-- 搜索和过滤器 -->
      <div class="filters">
        <input 
          v-model="searchQuery"
          placeholder="搜索文章..."
          @input="handleSearch"
        />
        
        <select v-model="selectedCategory" @change="handleCategoryChange">
          <option value="">所有分类</option>
          <option value="tech">技术</option>
          <option value="design">设计</option>
          <option value="business">商业</option>
        </select>
      </div>
      
      <!-- 文章网格 -->
      <div v-if="postsStore.loading" class="loading">
        加载文章中...
      </div>
      
      <div v-else-if="postsStore.error" class="error">
        {{ postsStore.error }}
      </div>
      
      <div v-else class="posts-grid">
        <article 
          v-for="post in postsStore.publishedPosts"
          :key="post.id"
          class="post-card"
        >
          <NuxtLink :to="`/blog/${post.slug}`">
            <img 
              v-if="post.featuredImage"
              :src="post.featuredImage"
              :alt="post.title"
              class="post-image"
            />
            
            <div class="post-content">
              <h2>{{ post.title }}</h2>
              <p>{{ post.excerpt }}</p>
              
              <div class="post-meta">
                <span>{{ formatDate(post.publishedAt) }}</span>
                <span>{{ post.category }}</span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
      
      <!-- 加载更多 -->
      <div v-if="hasMorePosts" class="load-more">
        <button 
          @click="loadMorePosts"
          :disabled="postsStore.loading"
        >
          {{ postsStore.loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const postsStore = usePostsStore()

// 响应式状态
const searchQuery = ref('')
const selectedCategory = ref('')
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// 计算属性
const hasMorePosts = computed(() => {
  const { page, totalPages } = postsStore.pagination
  return page < totalPages
})

// 服务端数据获取
await postsStore.fetchPosts({
  page: 1,
  limit: 12
})

// 方法
function handleSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    postsStore.fetchPosts({
      page: 1,
      search: searchQuery.value,
      category: selectedCategory.value,
      refresh: true
    })
  }, 300)
}

function handleCategoryChange() {
  postsStore.fetchPosts({
    page: 1,
    category: selectedCategory.value,
    search: searchQuery.value,
    refresh: true
  })
}

async function loadMorePosts() {
  const nextPage = postsStore.pagination.page + 1
  await postsStore.fetchPosts({
    page: nextPage,
    category: selectedCategory.value,
    search: searchQuery.value
  })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// SEO
useHead({
  title: '博客 - 最新文章',
  meta: [
    {
      name: 'description',
      content: '阅读我们关于技术、设计和商业的最新博客文章和文章。'
    },
    {
      property: 'og:title',
      content: '博客 - 最新文章'
    },
    {
      property: 'og:description',
      content: '阅读我们关于技术、设计和商业的最新博客文章和文章。'
    }
  ]
})
</script>
```

### 博客文章页面

```vue
<!-- pages/blog/[slug].vue -->
<template>
  <div class="post-page">
    <Head v-if="post">
      <Title>{{ post.title }}</Title>
      <Meta name="description" :content="post.excerpt" />
      <Meta property="og:title" :content="post.title" />
      <Meta property="og:description" :content="post.excerpt" />
      <Meta property="og:image" :content="post.featuredImage" />
    </Head>
    
    <article v-if="post" class="post">
      <header class="post-header">
        <img 
          v-if="post.featuredImage"
          :src="post.featuredImage"
          :alt="post.title"
          class="featured-image"
        />
        
        <div class="post-meta">
          <h1>{{ post.title }}</h1>
          <p class="excerpt">{{ post.excerpt }}</p>
          
          <div class="meta-info">
            <span>发布于 {{ formatDate(post.publishedAt) }}</span>
            <span>{{ post.readingTime }} 分钟阅读</span>
            <span class="category">{{ post.category }}</span>
          </div>
        </div>
      </header>
      
      <div class="post-content" v-html="post.content"></div>
      
      <footer class="post-footer">
        <div class="tags">
          <span 
            v-for="tag in post.tags"
            :key="tag"
            class="tag"
          >
            #{{ tag }}
          </span>
        </div>
        
        <div class="share-buttons">
          <button @click="sharePost('twitter')">
            分享到 Twitter
          </button>
          <button @click="sharePost('facebook')">
            分享到 Facebook
          </button>
          <button @click="copyLink">
            复制链接
          </button>
        </div>
      </footer>
    </article>
    
    <div v-else-if="postsStore.loading" class="loading">
      加载文章中...
    </div>
    
    <div v-else class="error">
      文章未找到
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const postsStore = usePostsStore()

// 从路由获取文章 slug
const slug = route.params.slug as string

// 服务端数据获取
const post = await postsStore.fetchPostById(slug)

if (!post) {
  throw createError({
    statusCode: 404,
    statusMessage: '文章未找到'
  })
}

// 方法
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function sharePost(platform: string) {
  const url = window.location.href
  const title = post.title
  
  let shareUrl = ''
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      break
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    // 显示成功消息
  } catch (err) {
    console.error('复制链接失败:', err)
  }
}

// SEO 和 meta 标签
useHead({
  title: post.title,
  meta: [
    {
      name: 'description',
      content: post.excerpt
    },
    {
      property: 'og:title',
      content: post.title
    },
    {
      property: 'og:description',
      content: post.excerpt
    },
    {
      property: 'og:image',
      content: post.featuredImage
    },
    {
      property: 'og:type',
      content: 'article'
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    }
  ]
})
</script>
```

## 测试

```typescript
// tests/stores/user.nuxt.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// 模拟 Nuxt 组合式函数
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn()
  }),
  useCookie: vi.fn(() => ({ value: null })),
  navigateTo: vi.fn()
}))

describe('用户 Store (Nuxt)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该正确处理登录', async () => {
    const store = useUserStore()
    const mockFetch = vi.fn().mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'mock-token'
    })
    
    vi.mocked(useNuxtApp).mockReturnValue({
      $fetch: mockFetch
    })
    
    await store.login({
      email: 'test@example.com',
      password: 'password'
    })
    
    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.email).toBe('test@example.com')
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password'
      }
    })
  })

  it('应该处理 SSR 用户获取', async () => {
    // 模拟服务端环境
    Object.defineProperty(global, 'process', {
      value: { server: true }
    })
    
    const store = useUserStore()
    const mockFetch = vi.fn().mockResolvedValue({
      id: '1',
      email: 'test@example.com'
    })
    
    vi.mocked(useNuxtApp).mockReturnValue({
      $fetch: mockFetch
    })
    
    await store.fetchUser()
    
    expect(store.user?.email).toBe('test@example.com')
    expect(mockFetch).toHaveBeenCalledWith('/api/user/profile')
  })
})
```

## 核心功能

### 1. SSR 支持
- 服务端数据获取
- 正确的水合处理
- SEO 友好的渲染
- Meta 标签管理

### 2. 身份验证
- JWT token 管理
- 安全 cookie 处理
- 路由保护中间件
- 基于角色的访问控制

### 3. 数据管理
- 高效的缓存策略
- 乐观更新
- 错误处理
- 分页支持

### 4. 性能
- 代码分割
- 懒加载
- 状态持久化
- 请求去重

### 5. 开发体验
- 类型安全
- 自动导入
- 热模块替换
- 全面测试

这个 Nuxt.js 集成演示了如何使用 Pinia 构建全栈应用程序，提供服务端渲染、身份验证和最佳性能，同时保持出色的开发体验。