---
title: Server-Side Rendering (SSR) - Pinia Guide
description: Learn how to use Pinia with Server-Side Rendering frameworks like Nuxt.js, Next.js, and custom SSR setups.
keywords: Pinia, Vue.js, SSR, Server-Side Rendering, Nuxt.js, Next.js, hydration, state management
author: Pinia Team
generator: VitePress
og:title: Server-Side Rendering (SSR) - Pinia Guide
og:description: Learn how to use Pinia with Server-Side Rendering frameworks like Nuxt.js, Next.js, and custom SSR setups.
og:image: /og-image.svg
og:url: https://allfun.net/guide/ssr
twitter:card: summary_large_image
twitter:title: Server-Side Rendering (SSR) - Pinia Guide
twitter:description: Learn how to use Pinia with Server-Side Rendering frameworks like Nuxt.js, Next.js, and custom SSR setups.
twitter:image: /og-image.svg
---

# Server-Side Rendering (SSR)

Pinia supports Server-Side Rendering out of the box. This guide covers how to use Pinia with various SSR frameworks and handle common SSR scenarios like state hydration, data fetching, and store management.

## Overview

When using SSR with Pinia, you need to consider:

- **State Serialization**: Converting store state to JSON for client hydration
- **Store Hydration**: Restoring server state on the client
- **Data Fetching**: Loading data on the server before rendering
- **Store Isolation**: Ensuring stores don't leak between requests

## Nuxt.js Integration

### Installation

Nuxt.js has built-in Pinia support through the `@pinia/nuxt` module:

```bash
npm install pinia @pinia/nuxt
```

### Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt'
  ],
  
  // Optional: Configure Pinia
  pinia: {
    autoImports: [
      // Automatically import `defineStore`
      'defineStore',
      // Automatically import `defineStore` as `definePiniaStore`
      ['defineStore', 'definePiniaStore']
    ]
  }
})
```

### Store Definition

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  }),
  
  actions: {
    async fetchUser() {
      // This will work on both server and client
      const { data } = await $fetch('/api/user')
      this.user = data
    },
    
    async updatePreferences(prefs: Partial<UserPreferences>) {
      this.preferences = { ...this.preferences, ...prefs }
      
      // Save to server
      await $fetch('/api/user/preferences', {
        method: 'POST',
        body: this.preferences
      })
    }
  }
})
```

### Server-Side Data Fetching

```vue
<!-- pages/profile.vue -->
<template>
  <div>
    <h1>User Profile</h1>
    <div v-if="user">
      <p>Name: {{ user.name }}</p>
      <p>Email: {{ user.email }}</p>
      
      <div class="preferences">
        <label>
          Theme:
          <select v-model="preferences.theme" @change="updatePrefs">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        
        <label>
          Language:
          <select v-model="preferences.language" @change="updatePrefs">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </label>
      </div>
    </div>
    
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup>
const userStore = useUserStore()
const { user, preferences } = storeToRefs(userStore)

// Fetch user data on server-side
await userStore.fetchUser()

const updatePrefs = async () => {
  await userStore.updatePreferences(preferences.value)
}
</script>
```

### Nuxt Plugins

```ts
// plugins/pinia.client.ts
export default defineNuxtPlugin(() => {
  // Client-side only initialization
  const userStore = useUserStore()
  
  // Restore user session from localStorage
  const savedSession = localStorage.getItem('user-session')
  if (savedSession) {
    userStore.$patch(JSON.parse(savedSession))
  }
  
  // Save session on changes
  userStore.$subscribe((mutation, state) => {
    localStorage.setItem('user-session', JSON.stringify({
      user: state.user,
      preferences: state.preferences
    }))
  })
})
```

## Next.js Integration

### Setup with App Router

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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Store with Next.js

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
          throw new Error('Failed to fetch posts')
        }
        
        this.posts = await response.json()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
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
        throw new Error('Failed to create post')
      }
      
      const newPost = await response.json()
      this.posts.push(newPost)
      
      return newPost
    }
  }
})
```

### Server Components with Data Fetching

```tsx
// app/posts/page.tsx
import { PostsList } from './posts-list'
import { getInitialPosts } from '@/lib/api'

export default async function PostsPage() {
  // Fetch data on server
  const initialPosts = await getInitialPosts()
  
  return (
    <div>
      <h1>Posts</h1>
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
  
  // Hydrate store with server data
  useEffect(() => {
    postsStore.$patch({ posts: initialPosts })
  }, [initialPosts])
  
  const handleCreatePost = async () => {
    await postsStore.createPost({
      title: 'New Post',
      content: 'Post content...',
      author: 'Current User'
    })
  }
  
  return (
    <div>
      <button onClick={handleCreatePost}>
        Create Post
      </button>
      
      {postsStore.loading && <p>Loading...</p>}
      {postsStore.error && <p>Error: {postsStore.error}</p>}
      
      <ul>
        {postsStore.posts.map(post => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <small>By {post.author}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Custom SSR Setup

### Server Entry Point

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
  
  // Pre-fetch data for the route
  const router = createRouter()
  app.use(router)
  
  await router.push(url)
  await router.isReady()
  
  // Get the matched route components
  const matchedComponents = router.currentRoute.value.matched
    .flatMap(record => Object.values(record.components || {}))
  
  // Call asyncData on matched components
  await Promise.all(
    matchedComponents.map(async (component: any) => {
      if (component.asyncData) {
        await component.asyncData({ pinia, route: router.currentRoute.value })
      }
    })
  )
  
  // Render the app
  const html = await renderToString(app)
  
  // Serialize the store state
  const state = JSON.stringify(pinia.state.value)
  
  return {
    html,
    state
  }
}
```

### Client Entry Point

```ts
// client.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// Hydrate the store state
if (window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.use(pinia)
app.mount('#app')
```

### HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>SSR App</title>
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

## State Hydration

### Automatic Hydration

```ts
// stores/app.ts
export const useAppStore = defineStore('app', {
  state: () => ({
    user: null,
    theme: 'light',
    locale: 'en'
  }),
  
  actions: {
    // This will be called on both server and client
    async initialize() {
      // Fetch initial data
      if (process.server) {
        // Server-side initialization
        await this.fetchServerData()
      } else {
        // Client-side initialization
        await this.fetchClientData()
      }
    },
    
    async fetchServerData() {
      // Fetch data that's only available on server
      const userData = await getServerSideUserData()
      this.user = userData
    },
    
    async fetchClientData() {
      // Fetch data that's only available on client
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        this.theme = savedTheme
      }
    }
  }
})
```

### Manual Hydration

```ts
// composables/useHydration.ts
export function useHydration() {
  const isHydrated = ref(false)
  
  const hydrate = (storeData: any) => {
    const pinia = getActivePinia()
    if (!pinia) return
    
    // Hydrate each store
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
    <!-- App content -->
    <router-view />
  </div>
  <div v-else>
    <!-- Loading state -->
    <p>Loading...</p>
  </div>
</template>

<script setup>
const { isHydrated, hydrate } = useHydration()

onMounted(() => {
  // Hydrate from server state
  if (window.__PINIA_STATE__) {
    hydrate(window.__PINIA_STATE__)
  }
})
</script>
```

## Data Fetching Patterns

### Route-Level Data Fetching

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
      <p>Price: ${{ currentProduct.price }}</p>
    </div>
    <div v-else-if="loading">
      <p>Loading product...</p>
    </div>
    <div v-else>
      <p>Product not found</p>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const productStore = useProductStore()
const { currentProduct, loading } = storeToRefs(productStore)

// Fetch product data
const productId = route.params.id as string

// This will run on both server and client
if (!currentProduct.value || currentProduct.value.id !== productId) {
  await productStore.fetchProduct(productId)
}
</script>
```

### Component-Level Data Fetching

```vue
<!-- components/UserProfile.vue -->
<template>
  <div class="user-profile">
    <div v-if="user">
      <img :src="user.avatar" :alt="user.name">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
      
      <div class="stats">
        <div>Posts: {{ user.postsCount }}</div>
        <div>Followers: {{ user.followersCount }}</div>
      </div>
    </div>
    
    <div v-else-if="loading">
      <div class="skeleton">Loading...</div>
    </div>
    
    <div v-else>
      <p>User not found</p>
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

// Fetch user data when component mounts or userId changes
watchEffect(async () => {
  if (props.userId) {
    await userStore.fetchUser(props.userId)
  }
})
</script>
```

## Error Handling

### Global Error Handling

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
      
      // Auto-remove after 5 seconds
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
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    errorStore.addError({
      id: Date.now().toString(),
      message: event.message,
      type: 'javascript',
      timestamp: new Date()
    })
  })
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorStore.addError({
      id: Date.now().toString(),
      message: event.reason?.message || 'Unhandled promise rejection',
      type: 'promise',
      timestamp: new Date()
    })
  })
})
```

### Store-Level Error Handling

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
          message: error instanceof Error ? error.message : 'Unknown error',
          code: error.code || 'UNKNOWN',
          timestamp: new Date()
        }
        
        // Log error on server
        if (process.server) {
          console.error('API Error:', error)
        }
        
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
```

## Performance Optimization

### Lazy Store Loading

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
      Load Heavy Data
    </button>
    
    <div v-if="heavyStore && heavyStore.data">
      <!-- Heavy data content -->
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

### Code Splitting with Stores

```ts
// router/index.ts
const routes = [
  {
    path: '/admin',
    component: () => import('@/pages/Admin.vue'),
    beforeEnter: async () => {
      // Lazy load admin store
      const { useAdminStore } = await import('@/stores/admin')
      const adminStore = useAdminStore()
      
      // Pre-fetch admin data
      await adminStore.fetchAdminData()
    }
  }
]
```

## Best Practices

### 1. Store Isolation

```ts
// Ensure stores don't leak between requests
export function createServerPinia() {
  const pinia = createPinia()
  
  // Add server-specific plugins
  pinia.use(({ store }) => {
    // Add request context to stores
    store.$request = getCurrentRequest()
  })
  
  return pinia
}
```

### 2. State Serialization

```ts
// utils/serialization.ts
export function serializeState(state: any): string {
  return JSON.stringify(state, (key, value) => {
    // Handle special types
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

### 3. SEO Optimization

```vue
<!-- pages/blog/[slug].vue -->
<template>
  <div>
    <Head>
      <title>{{ post?.title || 'Loading...' }}</title>
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

// Fetch post data for SEO
const slug = route.params.slug as string
await blogStore.fetchPost(slug)

// Handle 404
if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found'
  })
}
</script>
```

### 4. Progressive Enhancement

```vue
<!-- components/InteractiveChart.vue -->
<template>
  <div>
    <!-- Static content for SSR -->
    <div v-if="!isClient" class="chart-placeholder">
      <p>Chart will load when JavaScript is enabled</p>
      <noscript>
        <img :src="staticChartUrl" alt="Chart data">
      </noscript>
    </div>
    
    <!-- Interactive content for client -->
    <div v-else>
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
const isClient = process.client
const chartCanvas = ref<HTMLCanvasElement>()
const chartStore = useChartStore()

// Only run on client
if (isClient) {
  onMounted(async () => {
    await chartStore.initializeChart(chartCanvas.value)
  })
}
</script>
```

## Troubleshooting

### Common Issues

1. **Hydration Mismatch**
   ```ts
   // Ensure consistent state between server and client
   const store = useStore()
   
   // Use process.client to avoid hydration issues
   if (process.client) {
     store.initializeClientOnlyFeatures()
   }
   ```

2. **Memory Leaks**
   ```ts
   // Clean up stores on server
   export function cleanupStores() {
     const pinia = getActivePinia()
     if (pinia) {
       pinia._s.clear()
     }
   }
   ```

3. **State Persistence**
   ```ts
   // Handle state persistence carefully
   const store = useStore()
   
   // Only access localStorage on client
   if (process.client) {
     const saved = localStorage.getItem('store-state')
     if (saved) {
       store.$patch(JSON.parse(saved))
     }
   }
   ```

## Related Links

- [Nuxt.js Documentation](https://nuxt.com/docs/getting-started/state-management)
- [Next.js Documentation](https://nextjs.org/docs/basic-features/data-fetching)
- [Vue SSR Guide](https://vuejs.org/guide/scaling-up/ssr.html)
- [Pinia Plugins](./plugins) - Creating custom plugins
- [Testing Guide](./testing) - Testing SSR applications