---
title: Nuxt.js SSR - Pinia Guide
description: Learn how to use Pinia with Nuxt.js for server-side rendering. Complete guide with setup, configuration, and best practices for SSR applications.
keywords: Pinia, Vue.js, Nuxt.js, SSR, server-side rendering, state management, hydration, universal apps
author: Pinia Team
generator: VitePress
og:title: Nuxt.js SSR - Pinia Guide
og:description: Learn how to use Pinia with Nuxt.js for server-side rendering. Complete guide with setup, configuration, and best practices for SSR applications.
og:image: /og-image.svg
og:url: https://allfun.net/ssr/nuxt
twitter:card: summary_large_image
twitter:title: Nuxt.js SSR - Pinia Guide
twitter:description: Learn how to use Pinia with Nuxt.js for server-side rendering. Complete guide with setup, configuration, and best practices for SSR applications.
twitter:image: /og-image.svg
---

# Nuxt.js SSR

Pinia works seamlessly with Nuxt.js to provide server-side rendering (SSR) capabilities for your Vue applications. This guide covers how to set up and use Pinia in a Nuxt.js environment.

## Installation

### Nuxt 3

For Nuxt 3, install the official Pinia module:

```bash
npm install @pinia/nuxt
```

Add the module to your `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],
})
```

That's it! You can now use Pinia in your Nuxt 3 application without any additional configuration.

### Nuxt 2

For Nuxt 2, you need to install both Pinia and the composition API:

```bash
npm install pinia @nuxtjs/composition-api
```

Create a plugin file:

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

Register the plugin in `nuxt.config.js`:

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

## Basic Usage

### Creating Stores

Create your stores in the `stores` directory:

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo'
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
        console.error('Failed to fetch user data:', error)
      }
    }
  }
})
```

### Using Stores in Components

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>{{ counter.name }}</h1>
    <p>Count: {{ counter.count }}</p>
    <p>Double Count: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">Increment</button>
    <button @click="counter.fetchUserData()">Fetch User Data</button>
  </div>
</template>

<script setup>
const counter = useCounterStore()

// Fetch data on server-side
await counter.fetchUserData()
</script>
```

### Using Stores in Composables

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
        statusMessage: 'Invalid credentials'
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

## Server-Side Data Fetching

### Using `useFetch` with Stores

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
    <h1>Posts</h1>
    <div v-if="postsStore.loading">Loading...</div>
    <div v-else-if="postsStore.error">Error: {{ postsStore.error }}</div>
    <div v-else>
      <article v-for="post in postsStore.posts" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <NuxtLink :to="`/posts/${post.id}`">Read more</NuxtLink>
      </article>
    </div>
  </div>
</template>

<script setup>
const postsStore = usePostsStore()

// Fetch posts on server-side
await postsStore.fetchPosts()
</script>
```

### Using `asyncData` (Nuxt 2)

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

## State Hydration

### Automatic Hydration (Nuxt 3)

With the `@pinia/nuxt` module, state hydration is handled automatically. The server-side state is serialized and sent to the client, where it's automatically restored.

### Manual Hydration (Nuxt 2)

For Nuxt 2, you might need to handle hydration manually:

```js
// plugins/pinia.client.js
export default ({ app, nuxtState }) => {
  // Restore state from nuxtState
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

## Authentication with SSR

### Auth Store

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
        
        // Set cookie for SSR
        const tokenCookie = useCookie('auth-token', {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 days
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
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.token = null
        
        // Clear cookie
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
        // Token might be invalid, clear auth state
        this.user = null
        this.token = null
      }
    },
    
    // Initialize auth state from cookie
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

### Auth Plugin

```js
// plugins/auth.client.js
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize auth state on client-side
  authStore.initializeAuth()
})
```

### Auth Middleware

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
    <h1>Dashboard</h1>
    <p>Welcome, {{ authStore.user?.name }}!</p>
    <button @click="authStore.logout()">Logout</button>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
</script>
```

## Error Handling

### Global Error Handling

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
        message: error.message || 'An error occurred',
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
  
  // Handle Vue errors
  const vueApp = useNuxtApp().vueApp
  vueApp.config.errorHandler = (error, instance, info) => {
    errorStore.addError({
      message: error.message,
      type: 'vue-error',
      context: info
    })
  }
  
  // Handle unhandled promise rejections
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      errorStore.addError({
        message: event.reason.message || 'Unhandled promise rejection',
        type: 'promise-rejection'
      })
    })
  }
})
```

## Performance Optimization

### Lazy Loading Stores

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
    <div v-if="!store">Loading...</div>
    <div v-else>
      <!-- Heavy component content -->
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

### Store Splitting

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
    language: 'en',
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

## Testing with Nuxt

### Unit Testing

```js
// tests/stores/counter.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '~/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('increments count', () => {
    const counter = useCounterStore()
    expect(counter.count).toBe(0)
    
    counter.increment()
    expect(counter.count).toBe(1)
  })
  
  it('computes double count', () => {
    const counter = useCounterStore()
    counter.count = 5
    expect(counter.doubleCount).toBe(10)
  })
})
```

### Integration Testing

```js
// tests/pages/index.test.js
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('Index Page', () => {
  it('renders correctly', async () => {
    const component = await mountSuspended(IndexPage)
    expect(component.text()).toContain('Count: 0')
  })
  
  it('increments counter on button click', async () => {
    const component = await mountSuspended(IndexPage)
    
    await component.find('button').trigger('click')
    expect(component.text()).toContain('Count: 1')
  })
})
```

## Best Practices

### 1. Store Organization

```
stores/
├── auth.js          # Authentication state
├── user/
│   ├── profile.js   # User profile data
│   └── settings.js  # User preferences
├── products/
│   ├── catalog.js   # Product listings
│   └── cart.js      # Shopping cart
└── ui/
    ├── theme.js     # Theme settings
    └── navigation.js # Navigation state
```

### 2. SSR-Safe State

Avoid browser-specific APIs in store state:

```js
// ❌ Bad - will cause hydration mismatch
export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: localStorage.getItem('theme') === 'dark'
  })
})

// ✅ Good - initialize safely
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

### 3. Cookie Management

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

### 4. Type Safety (TypeScript)

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
      // Implementation
    }
  }
})
```

## Common Patterns

### 1. Data Fetching Pattern

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
  
  // Execute on server-side
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

### 2. Optimistic Updates

```js
// stores/todos.js
export const useTodosStore = defineStore('todos', {
  state: () => ({
    todos: []
  }),
  
  actions: {
    async addTodo(todo) {
      // Optimistic update
      const tempId = Date.now()
      const optimisticTodo = { ...todo, id: tempId, pending: true }
      this.todos.push(optimisticTodo)
      
      try {
        const { data } = await $fetch('/api/todos', {
          method: 'POST',
          body: todo
        })
        
        // Replace optimistic todo with real data
        const index = this.todos.findIndex(t => t.id === tempId)
        if (index > -1) {
          this.todos[index] = data
        }
      } catch (error) {
        // Remove optimistic todo on error
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

## Troubleshooting

### Common Issues

1. **Hydration Mismatch**
   - Ensure server and client state are identical
   - Avoid browser-specific APIs in initial state
   - Use `process.client` checks when necessary

2. **Store Not Found**
   - Ensure stores are properly imported
   - Check that Pinia is correctly installed and configured
   - Verify store IDs are unique

3. **State Not Persisting**
   - Check cookie configuration
   - Ensure proper serialization/deserialization
   - Verify SSR setup is correct

### Debug Mode

```js
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt'
  ],
  pinia: {
    storesDirs: ['./stores/**'],
    // Enable devtools in development
    devtools: process.env.NODE_ENV === 'development'
  }
})
```

## Migration from Vuex

If you're migrating from Vuex to Pinia in a Nuxt application:

```js
// Before (Vuex)
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

// After (Pinia)
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

## Conclusion

Pinia provides excellent SSR support for Nuxt.js applications with minimal configuration. The key benefits include:

- Automatic state hydration
- Type safety with TypeScript
- Seamless integration with Nuxt's data fetching
- Better developer experience with devtools
- Simplified store structure compared to Vuex

For more advanced patterns and examples, refer to the [Pinia documentation](../guide/) and [Nuxt.js documentation](https://nuxt.com/).