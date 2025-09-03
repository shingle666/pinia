# Nuxt.js Integration with Pinia

A comprehensive guide to integrating Pinia with Nuxt.js, covering SSR, hydration, middleware, plugins, and advanced patterns for full-stack applications.

## Features

- 🚀 Server-Side Rendering (SSR) support
- 💧 Proper hydration handling
- 🔄 State persistence across navigation
- 🛡️ Middleware integration
- 🔌 Plugin system integration
- 📱 Universal rendering
- 🎯 Type-safe store composition
- 🔐 Authentication with SSR
- 📊 SEO-friendly data fetching
- ⚡ Performance optimizations

## Installation and Setup

### 1. Install Dependencies

```bash
npm install @pinia/nuxt pinia
# or
yarn add @pinia/nuxt pinia
```

### 2. Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],
  pinia: {
    autoImports: [
      // automatically imports `defineStore`
      'defineStore',
      // automatically imports `defineStore` as `definePiniaStore`
      ['defineStore', 'definePiniaStore'],
    ],
  },
  ssr: true, // Enable SSR
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Private keys (only available on server-side)
    apiSecret: process.env.API_SECRET,
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  }
})
```

## Store Definitions

### User Store with SSR Support

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Getters
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
  
  // Actions
  async function fetchUser() {
    if (process.server && !user.value) {
      // Server-side: fetch from API or database
      loading.value = true
      try {
        const { $fetch } = useNuxtApp()
        const userData = await $fetch('/api/user/profile')
        user.value = userData
        isAuthenticated.value = true
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch user'
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
      
      // Set authentication cookie
      const token = useCookie('auth-token', {
        default: () => null,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      token.value = response.token
      
      // Redirect to dashboard
      await navigateTo('/dashboard')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
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
      console.error('Logout error:', err)
    } finally {
      user.value = null
      isAuthenticated.value = false
      
      // Clear authentication cookie
      const token = useCookie('auth-token')
      token.value = null
      
      // Redirect to login
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
      error.value = err instanceof Error ? err.message : 'Update failed'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Initialize user on client-side
  function initializeUser() {
    if (process.client) {
      const token = useCookie('auth-token')
      if (token.value && !user.value) {
        fetchUser()
      }
    }
  }
  
  return {
    // State
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    loading: readonly(loading),
    error: readonly(error),
    
    // Getters
    userProfile,
    hasRole,
    
    // Actions
    fetchUser,
    login,
    logout,
    updateProfile,
    initializeUser
  }
})
```

### Posts Store with SSR Data Fetching

```typescript
// stores/posts.ts
export const usePostsStore = defineStore('posts', () => {
  // State
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
  
  // Getters
  const publishedPosts = computed(() => {
    return posts.value.filter(post => post.status === 'published')
  })
  
  const postsByCategory = computed(() => (category: string) => {
    return posts.value.filter(post => post.category === category)
  })
  
  // Actions
  async function fetchPosts(options: FetchPostsOptions = {}) {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      refresh = false
    } = options
    
    // Avoid duplicate requests
    if (loading.value && !refresh) return
    
    // Use cached data on client-side if available
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
        // Append for pagination
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
      error.value = err instanceof Error ? err.message : 'Failed to fetch posts'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function fetchPostById(id: string) {
    // Check if post is already in cache
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
      
      // Update cache if post exists
      const existingIndex = posts.value.findIndex(p => p.id === id)
      if (existingIndex !== -1) {
        posts.value[existingIndex] = post
      } else {
        posts.value.unshift(post)
      }
      
      return post
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch post'
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
      error.value = err instanceof Error ? err.message : 'Failed to create post'
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
      
      // Update in cache
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      
      if (currentPost.value?.id === id) {
        currentPost.value = updatedPost
      }
      
      return updatedPost
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update post'
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
      
      // Remove from cache
      posts.value = posts.value.filter(post => post.id !== id)
      pagination.value.total -= 1
      
      if (currentPost.value?.id === id) {
        currentPost.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete post'
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
    // State
    posts: readonly(posts),
    currentPost: readonly(currentPost),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    
    // Getters
    publishedPosts,
    postsByCategory,
    
    // Actions
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

## Server API Routes

### Authentication API

```typescript
// server/api/auth/login.post.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required'
    })
  }
  
  try {
    // Find user in database
    const user = await findUserByEmail(email)
    
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }
    
    // Generate JWT token
    const config = useRuntimeConfig()
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.apiSecret,
      { expiresIn: '7d' }
    )
    
    // Set secure cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
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
      statusMessage: 'Authentication failed'
    })
  }
})
```

### Posts API

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
      statusMessage: 'Failed to fetch posts'
    })
  }
})

// server/api/posts/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Post ID is required'
    })
  }
  
  try {
    const post = await findPostById(id)
    
    if (!post) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }
    
    return post
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch post'
    })
  }
})
```

## Middleware

### Authentication Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  
  // Initialize user on client-side
  if (process.client) {
    userStore.initializeUser()
  }
  
  // Check authentication
  if (!userStore.isAuthenticated) {
    return navigateTo('/login')
  }
})

// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  
  // Redirect authenticated users away from guest pages
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
      statusMessage: 'Access denied'
    })
  }
})
```

## Plugins

### Pinia Persistence Plugin

```typescript
// plugins/pinia-persistence.client.ts
import { PiniaPluginContext } from 'pinia'

function createPersistedState() {
  return (context: PiniaPluginContext) => {
    const { store, options } = context
    
    // Only persist stores that opt-in
    if (!options.persist) return
    
    const storageKey = `pinia-${store.$id}`
    
    // Restore state from localStorage
    const savedState = localStorage.getItem(storageKey)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        store.$patch(parsedState)
      } catch (error) {
        console.error('Failed to restore state:', error)
        localStorage.removeItem(storageKey)
      }
    }
    
    // Save state changes to localStorage
    store.$subscribe((mutation, state) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to persist state:', error)
      }
    })
  }
}

export default defineNuxtPlugin(() => {
  const { $pinia } = useNuxtApp()
  $pinia.use(createPersistedState())
})
```

### API Plugin

```typescript
// plugins/api.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ request, options }) {
      // Add authentication token
      const token = useCookie('auth-token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    onResponseError({ response }) {
      // Handle authentication errors
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

## Pages with SSR

### Blog Index Page

```vue
<!-- pages/blog/index.vue -->
<template>
  <div class="blog-page">
    <Head>
      <Title>Blog - Latest Posts</Title>
      <Meta name="description" content="Read our latest blog posts and articles" />
    </Head>
    
    <div class="container">
      <h1>Latest Posts</h1>
      
      <!-- Search and Filters -->
      <div class="filters">
        <input 
          v-model="searchQuery"
          placeholder="Search posts..."
          @input="handleSearch"
        />
        
        <select v-model="selectedCategory" @change="handleCategoryChange">
          <option value="">All Categories</option>
          <option value="tech">Technology</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
        </select>
      </div>
      
      <!-- Posts Grid -->
      <div v-if="postsStore.loading" class="loading">
        Loading posts...
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
      
      <!-- Load More -->
      <div v-if="hasMorePosts" class="load-more">
        <button 
          @click="loadMorePosts"
          :disabled="postsStore.loading"
        >
          {{ postsStore.loading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const postsStore = usePostsStore()

// Reactive state
const searchQuery = ref('')
const selectedCategory = ref('')
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Computed
const hasMorePosts = computed(() => {
  const { page, totalPages } = postsStore.pagination
  return page < totalPages
})

// Server-side data fetching
await postsStore.fetchPosts({
  page: 1,
  limit: 12
})

// Methods
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
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// SEO
useHead({
  title: 'Blog - Latest Posts',
  meta: [
    {
      name: 'description',
      content: 'Read our latest blog posts and articles about technology, design, and business.'
    },
    {
      property: 'og:title',
      content: 'Blog - Latest Posts'
    },
    {
      property: 'og:description',
      content: 'Read our latest blog posts and articles about technology, design, and business.'
    }
  ]
})
</script>
```

### Blog Post Page

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
            <span>Published {{ formatDate(post.publishedAt) }}</span>
            <span>{{ post.readingTime }} min read</span>
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
            Share on Twitter
          </button>
          <button @click="sharePost('facebook')">
            Share on Facebook
          </button>
          <button @click="copyLink">
            Copy Link
          </button>
        </div>
      </footer>
    </article>
    
    <div v-else-if="postsStore.loading" class="loading">
      Loading post...
    </div>
    
    <div v-else class="error">
      Post not found
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const postsStore = usePostsStore()

// Get post slug from route
const slug = route.params.slug as string

// Server-side data fetching
const post = await postsStore.fetchPostById(slug)

if (!post) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found'
  })
}

// Methods
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
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
    // Show success message
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

// SEO and meta tags
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

## Testing

```typescript
// tests/stores/user.nuxt.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: vi.fn()
  }),
  useCookie: vi.fn(() => ({ value: null })),
  navigateTo: vi.fn()
}))

describe('User Store (Nuxt)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should handle login correctly', async () => {
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

  it('should handle SSR user fetching', async () => {
    // Mock server environment
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

## Key Features

### 1. SSR Support
- Server-side data fetching
- Proper hydration handling
- SEO-friendly rendering
- Meta tag management

### 2. Authentication
- JWT token management
- Secure cookie handling
- Route protection middleware
- Role-based access control

### 3. Data Management
- Efficient caching strategies
- Optimistic updates
- Error handling
- Pagination support

### 4. Performance
- Code splitting
- Lazy loading
- State persistence
- Request deduplication

### 5. Developer Experience
- Type safety
- Auto-imports
- Hot module replacement
- Comprehensive testing

This Nuxt.js integration demonstrates how to build full-stack applications with Pinia, providing server-side rendering, authentication, and optimal performance while maintaining a great developer experience.