---
title: 组合式 Stores - Pinia 指南
description: 学习如何在 Pinia 中使用组合式 API 创建和使用组合式 stores，实现更灵活和可重用的状态管理。
keywords: Pinia, 组合式 stores, 组合式 API, Vue.js, 状态管理, 响应式, 计算属性
author: Pinia Team
generator: VitePress
og:title: 组合式 Stores - Pinia 指南
og:description: 学习如何在 Pinia 中使用组合式 API 创建和使用组合式 stores，实现更灵活和可重用的状态管理。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/composition-stores
twitter:card: summary_large_image
twitter:title: 组合式 Stores - Pinia 指南
twitter:description: 学习如何在 Pinia 中使用组合式 API 创建和使用组合式 stores，实现更灵活和可重用的状态管理。
twitter:image: /og-image.svg
---

# 组合式 Stores

组合式 stores 是使用 Vue 组合式 API 定义 Pinia stores 的另一种方式。这种方法提供了更多的灵活性，并允许您充分利用 Vue 响应式系统和组合式函数的强大功能。

## 基本语法

您可以使用类似于 Vue 组合式 API 的 setup 函数来定义 store，而不是使用选项对象语法：

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // 状态
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
  
  // 返回所有应该暴露的内容
  return {
    count,
    name,
    doubleCount,
    increment,
    reset
  }
})
```

## 映射到选项式 API

在组合式 stores 中：
- `ref()` 成为 **state** 属性
- `computed()` 成为 **getters**
- `function()` 成为 **actions**

```ts
// 选项式 API 等价写法
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

## 高级状态管理

### 复杂状态对象

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
  // 简单响应式状态
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 复杂响应式状态
  const preferences = reactive<UserPreferences>({
    theme: 'light',
    language: 'zh',
    notifications: true
  })
  
  // 数组状态
  const users = ref<User[]>([])
  const selectedUserIds = ref<Set<number>>(new Set())
  
  // 计算属性
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
      error.value = err instanceof Error ? err.message : '登录失败'
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
    // 状态
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

### 使用组合式函数

组合式 stores 可以利用 Vue 组合式函数来实现可重用的逻辑：

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
      error.value = err instanceof Error ? err.message : '未知错误'
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
  
  // 使用组合式函数进行异步状态管理
  const {
    data: featuredProducts,
    loading: loadingFeatured,
    error: featuredError,
    execute: fetchFeatured
  } = useAsyncState(() => api.getFeaturedProducts())
  
  // 计算属性
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
      console.error('获取产品失败:', error)
    }
  }
  
  function setCategory(category: string) {
    selectedCategory.value = category
  }
  
  return {
    // 状态
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

## 跨 Store 组合

组合式 stores 使得组合多个 stores 变得容易：

```ts
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductsStore } from './products'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  
  // 访问其他 stores
  const productsStore = useProductsStore()
  const userStore = useUserStore()
  
  // 依赖其他 stores 的计算属性
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
      throw new Error('无法结账')
    }
    
    try {
      const order = await api.createOrder({
        userId: userStore.currentUser!.id,
        items: items.value
      })
      
      clear()
      return order
    } catch (error) {
      throw new Error('结账失败')
    }
  }
  
  return {
    // 状态
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

## 生命周期和监听器

组合式 stores 可以使用 Vue 的生命周期钩子和监听器：

```ts
import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const language = ref('zh')
  const autoSave = ref(true)
  const lastSaved = ref<Date | null>(null)
  
  // 计算属性
  const isDarkMode = computed(() => theme.value === 'dark')
  
  // 监听器
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
      console.error('保存设置失败:', error)
    }
  }
  
  async function loadSettings() {
    try {
      const settings = await api.getUserSettings()
      theme.value = settings.theme || 'light'
      language.value = settings.language || 'zh'
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
  
  // 生命周期 - 在 store 首次使用时运行
  onMounted(() => {
    loadSettings()
  })
  
  return {
    // 状态
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

## 高级模式

### 工厂模式

使用不同配置动态创建 stores：

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
        error.value = err instanceof Error ? err.message : '获取失败'
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
        error.value = err instanceof Error ? err.message : '获取失败'
        throw err
      }
    }
    
    async function create(data: Partial<T>) {
      try {
        const item = await options.api.create(data)
        items.value.push(item)
        return item
      } catch (err) {
        error.value = err instanceof Error ? err.message : '创建失败'
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
        error.value = err instanceof Error ? err.message : '更新失败'
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
        error.value = err instanceof Error ? err.message : '删除失败'
        throw err
      }
    }
    
    return {
      // 状态
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

// 使用
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

### 插件集成

组合式 stores 与 Pinia 插件无缝协作：

```ts
// stores/persistedStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const usePersistedStore = defineStore('persisted', () => {
  const data = ref({
    user: null,
    preferences: {
      theme: 'light',
      language: 'zh'
    }
  })
  
  // 手动持久化（如果不使用插件）
  watch(
    data,
    (newData) => {
      localStorage.setItem('persisted-store', JSON.stringify(newData))
    },
    { deep: true }
  )
  
  // 初始化时从 localStorage 加载
  const saved = localStorage.getItem('persisted-store')
  if (saved) {
    try {
      Object.assign(data.value, JSON.parse(saved))
    } catch (error) {
      console.error('加载持久化数据失败:', error)
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

## 最佳实践

### 1. 组织返回对象

将相关属性分组在一起以提高可读性：

```ts
export const useUserStore = defineStore('user', () => {
  // ... 设置逻辑
  
  return {
    // 状态
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

### 2. 有效使用 TypeScript

定义清晰的接口并使用适当的类型：

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
  // 实现
})
```

### 3. 利用组合式函数

将可重用逻辑提取到组合式函数中：

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

// 在 store 中使用
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

### 4. 正确处理副作用

适当使用监听器和生命周期钩子：

```ts
export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('light')
  
  // 将主题变更应用到 DOM
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

## 何时使用组合式 Stores

**使用组合式 stores 当：**
- 您需要复杂的响应式逻辑
- 您想要在 stores 之间重用逻辑
- 您更喜欢组合式 API 语法
- 您需要使用 Vue 组合式函数
- 您想要在 store 组织方面有更多灵活性

**使用选项式 stores 当：**
- 您更喜欢选项式 API 语法
- 您有简单的状态管理需求
- 您想要更结构化的方法
- 您正在从 Vuex 迁移

## 相关链接

- [定义 Stores](./defining-stores) - 基本 store 创建
- [状态管理](./state) - 在 Pinia 中管理状态
- [Getters](./getters) - Store 中的计算属性
- [Actions](./actions) - Store 方法和业务逻辑
- [插件](./plugins) - 扩展 store 功能