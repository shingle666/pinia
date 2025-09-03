---
title: Composition Stores - Pinia Guide
description: Learn how to create and use composition stores in Pinia with the Composition API for more flexible and reusable state management.
keywords: Pinia, composition stores, Composition API, Vue.js, state management, reactive, computed
author: Pinia Team
generator: VitePress
og:title: Composition Stores - Pinia Guide
og:description: Learn how to create and use composition stores in Pinia with the Composition API for more flexible and reusable state management.
og:image: /og-image.svg
og:url: https://allfun.net/guide/composition-stores
twitter:card: summary_large_image
twitter:title: Composition Stores - Pinia Guide
twitter:description: Learn how to create and use composition stores in Pinia with the Composition API for more flexible and reusable state management.
twitter:image: /og-image.svg
---

# Composition Stores

Composition stores are an alternative way to define Pinia stores using Vue's Composition API. This approach provides more flexibility and allows you to leverage the full power of Vue's reactivity system and composables.

## Basic Syntax

Instead of defining a store with the options object syntax, you can use a setup function similar to Vue's Composition API:

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Eduardo')
  
  // Getters
  const doubleCount = computed(() => count.value * 2)
  
  // Actions
  function increment() {
    count.value++
  }
  
  function reset() {
    count.value = 0
  }
  
  // Return everything that should be exposed
  return {
    count,
    name,
    doubleCount,
    increment,
    reset
  }
})
```

## Mapping to Options API

In composition stores:
- `ref()` becomes **state** properties
- `computed()` becomes **getters**
- `function()` becomes **actions**

```ts
// Options API equivalent
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
    
    reset() {
      this.count = 0
    }
  }
})
```

## Advanced State Management

### Complex State Objects

```ts
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}

export const useUserStore = defineStore('user', () => {
  // Simple reactive state
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Complex reactive state
  const preferences = reactive<UserPreferences>({
    theme: 'light',
    language: 'en',
    notifications: true
  })
  
  // Array state
  const users = ref<User[]>([])
  const selectedUserIds = ref<Set<number>>(new Set())
  
  // Computed properties
  const isLoggedIn = computed(() => !!currentUser.value)
  const userCount = computed(() => users.value.length)
  const selectedUsers = computed(() => 
    users.value.filter(user => selectedUserIds.value.has(user.id))
  )
  
  // Actions
  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const user = await api.login({ email, password })
      currentUser.value = user
      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  function logout() {
    currentUser.value = null
    selectedUserIds.value.clear()
  }
  
  function updatePreferences(newPreferences: Partial<UserPreferences>) {
    Object.assign(preferences, newPreferences)
  }
  
  function toggleUserSelection(userId: number) {
    if (selectedUserIds.value.has(userId)) {
      selectedUserIds.value.delete(userId)
    } else {
      selectedUserIds.value.add(userId)
    }
  }
  
  return {
    // State
    currentUser,
    isLoading,
    error,
    preferences,
    users,
    selectedUserIds,
    
    // Getters
    isLoggedIn,
    userCount,
    selectedUsers,
    
    // Actions
    login,
    logout,
    updatePreferences,
    toggleUserSelection
  }
})
```

### Using Composables

Composition stores can leverage Vue composables for reusable logic:

```ts
// composables/useAsyncState.ts
import { ref } from 'vue'

export function useAsyncState<T>(asyncFn: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await asyncFn()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }
  
  const reset = () => {
    data.value = null
    error.value = null
    loading.value = false
  }
  
  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

// stores/products.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { api } from '@/services/api'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const selectedCategory = ref<string>('all')
  
  // Use composable for async state management
  const {
    data: featuredProducts,
    loading: loadingFeatured,
    error: featuredError,
    execute: fetchFeatured
  } = useAsyncState(() => api.getFeaturedProducts())
  
  // Computed properties
  const filteredProducts = computed(() => {
    if (selectedCategory.value === 'all') {
      return products.value
    }
    return products.value.filter(p => p.category === selectedCategory.value)
  })
  
  const categories = computed(() => {
    const cats = new Set(products.value.map(p => p.category))
    return ['all', ...Array.from(cats)]
  })
  
  // Actions
  async function fetchProducts() {
    try {
      products.value = await api.getProducts()
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }
  
  function setCategory(category: string) {
    selectedCategory.value = category
  }
  
  return {
    // State
    products,
    selectedCategory,
    featuredProducts,
    loadingFeatured,
    featuredError,
    
    // Getters
    filteredProducts,
    categories,
    
    // Actions
    fetchProducts,
    fetchFeatured,
    setCategory
  }
})
```

## Cross-Store Composition

Composition stores make it easy to compose multiple stores:

```ts
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductsStore } from './products'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  
  // Access other stores
  const productsStore = useProductsStore()
  const userStore = useUserStore()
  
  // Computed properties that depend on other stores
  const total = computed(() => {
    return items.value.reduce((sum, item) => {
      const product = productsStore.products.find(p => p.id === item.productId)
      return sum + (product?.price || 0) * item.quantity
    }, 0)
  })
  
  const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })
  
  const canCheckout = computed(() => {
    return userStore.isLoggedIn && items.value.length > 0
  })
  
  // Actions
  function addItem(productId: number, quantity: number = 1) {
    const existingItem = items.value.find(item => item.productId === productId)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({ productId, quantity })
    }
  }
  
  function removeItem(productId: number) {
    const index = items.value.findIndex(item => item.productId === productId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }
  
  function updateQuantity(productId: number, quantity: number) {
    const item = items.value.find(item => item.productId === productId)
    if (item) {
      if (quantity <= 0) {
        removeItem(productId)
      } else {
        item.quantity = quantity
      }
    }
  }
  
  function clear() {
    items.value = []
  }
  
  async function checkout() {
    if (!canCheckout.value) {
      throw new Error('Cannot checkout')
    }
    
    try {
      const order = await api.createOrder({
        userId: userStore.currentUser!.id,
        items: items.value
      })
      
      clear()
      return order
    } catch (error) {
      throw new Error('Checkout failed')
    }
  }
  
  return {
    // State
    items,
    
    // Getters
    total,
    itemCount,
    canCheckout,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clear,
    checkout
  }
})
```

## Lifecycle and Watchers

Composition stores can use Vue's lifecycle hooks and watchers:

```ts
import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const language = ref('en')
  const autoSave = ref(true)
  const lastSaved = ref<Date | null>(null)
  
  // Computed
  const isDarkMode = computed(() => theme.value === 'dark')
  
  // Watchers
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    if (autoSave.value) {
      saveSettings()
    }
  })
  
  watch(language, (newLanguage) => {
    document.documentElement.setAttribute('lang', newLanguage)
    if (autoSave.value) {
      saveSettings()
    }
  })
  
  // Actions
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  function setLanguage(lang: string) {
    language.value = lang
  }
  
  async function saveSettings() {
    try {
      await api.saveUserSettings({
        theme: theme.value,
        language: language.value
      })
      lastSaved.value = new Date()
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  async function loadSettings() {
    try {
      const settings = await api.getUserSettings()
      theme.value = settings.theme || 'light'
      language.value = settings.language || 'en'
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
  
  // Lifecycle - runs when store is first used
  onMounted(() => {
    loadSettings()
  })
  
  return {
    // State
    theme,
    language,
    autoSave,
    lastSaved,
    
    // Getters
    isDarkMode,
    
    // Actions
    toggleTheme,
    setLanguage,
    saveSettings,
    loadSettings
  }
})
```

## Advanced Patterns

### Factory Pattern

Create stores dynamically with different configurations:

```ts
// stores/createResourceStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface ResourceStoreOptions<T> {
  name: string
  api: {
    getAll: () => Promise<T[]>
    getById: (id: string) => Promise<T>
    create: (data: Partial<T>) => Promise<T>
    update: (id: string, data: Partial<T>) => Promise<T>
    delete: (id: string) => Promise<void>
  }
}

export function createResourceStore<T extends { id: string }>(
  options: ResourceStoreOptions<T>
) {
  return defineStore(options.name, () => {
    const items = ref<T[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    
    const itemsById = computed(() => {
      return items.value.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {} as Record<string, T>)
    })
    
    async function fetchAll() {
      loading.value = true
      error.value = null
      
      try {
        items.value = await options.api.getAll()
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Fetch failed'
      } finally {
        loading.value = false
      }
    }
    
    async function fetchById(id: string) {
      try {
        const item = await options.api.getById(id)
        const index = items.value.findIndex(i => i.id === id)
        if (index > -1) {
          items.value[index] = item
        } else {
          items.value.push(item)
        }
        return item
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Fetch failed'
        throw err
      }
    }
    
    async function create(data: Partial<T>) {
      try {
        const item = await options.api.create(data)
        items.value.push(item)
        return item
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Create failed'
        throw err
      }
    }
    
    async function update(id: string, data: Partial<T>) {
      try {
        const item = await options.api.update(id, data)
        const index = items.value.findIndex(i => i.id === id)
        if (index > -1) {
          items.value[index] = item
        }
        return item
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Update failed'
        throw err
      }
    }
    
    async function remove(id: string) {
      try {
        await options.api.delete(id)
        const index = items.value.findIndex(i => i.id === id)
        if (index > -1) {
          items.value.splice(index, 1)
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Delete failed'
        throw err
      }
    }
    
    return {
      // State
      items,
      loading,
      error,
      
      // Getters
      itemsById,
      
      // Actions
      fetchAll,
      fetchById,
      create,
      update,
      remove
    }
  })
}

// Usage
interface User {
  id: string
  name: string
  email: string
}

interface Post {
  id: string
  title: string
  content: string
  authorId: string
}

export const useUsersStore = createResourceStore<User>({
  name: 'users',
  api: userApi
})

export const usePostsStore = createResourceStore<Post>({
  name: 'posts',
  api: postApi
})
```

### Plugin Integration

Composition stores work seamlessly with Pinia plugins:

```ts
// stores/persistedStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const usePersistedStore = defineStore('persisted', () => {
  const data = ref({
    user: null,
    preferences: {
      theme: 'light',
      language: 'en'
    }
  })
  
  // Manual persistence (if not using a plugin)
  watch(
    data,
    (newData) => {
      localStorage.setItem('persisted-store', JSON.stringify(newData))
    },
    { deep: true }
  )
  
  // Load from localStorage on initialization
  const saved = localStorage.getItem('persisted-store')
  if (saved) {
    try {
      Object.assign(data.value, JSON.parse(saved))
    } catch (error) {
      console.error('Failed to load persisted data:', error)
    }
  }
  
  function updateUser(user: any) {
    data.value.user = user
  }
  
  function updatePreferences(preferences: any) {
    Object.assign(data.value.preferences, preferences)
  }
  
  return {
    data,
    updateUser,
    updatePreferences
  }
})
```

## Best Practices

### 1. Organize Return Object

Group related properties together for better readability:

```ts
export const useUserStore = defineStore('user', () => {
  // ... setup logic
  
  return {
    // State
    currentUser,
    users,
    loading,
    error,
    
    // Getters
    isLoggedIn,
    userCount,
    activeUsers,
    
    // Actions
    login,
    logout,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  }
})
```

### 2. Use TypeScript Effectively

Define clear interfaces and use proper typing:

```ts
interface UserState {
  currentUser: User | null
  users: User[]
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', (): UserState & {
  // Getters
  isLoggedIn: ComputedRef<boolean>
  userCount: ComputedRef<number>
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<User>
  logout: () => void
  fetchUsers: () => Promise<void>
} => {
  // Implementation
})
```

### 3. Leverage Composables

Extract reusable logic into composables:

```ts
// composables/useApi.ts
export function useApi<T>(endpoint: string) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const fetch = async () => {
    loading.value = true
    try {
      data.value = await api.get(endpoint)
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  return { data, loading, error, fetch }
}

// Use in store
export const useProductsStore = defineStore('products', () => {
  const { data: products, loading, error, fetch } = useApi<Product[]>('/products')
  
  return {
    products,
    loading,
    error,
    fetchProducts: fetch
  }
})
```

### 4. Handle Side Effects Properly

Use watchers and lifecycle hooks appropriately:

```ts
export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('light')
  
  // Apply theme changes to DOM
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
  }, { immediate: true })
  
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  return {
    theme,
    toggleTheme
  }
})
```

## When to Use Composition Stores

**Use composition stores when:**
- You need complex reactive logic
- You want to reuse logic across stores
- You prefer the Composition API syntax
- You need to use Vue composables
- You want more flexibility in store organization

**Use options stores when:**
- You prefer the Options API syntax
- You have simple state management needs
- You want a more structured approach
- You're migrating from Vuex

## Related Links

- [Defining Stores](./defining-stores) - Basic store creation
- [State Management](./state) - Managing state in Pinia
- [Getters](./getters) - Computed properties in stores
- [Actions](./actions) - Store methods and business logic
- [Plugins](./plugins) - Extending store functionality