# Vite + TypeScript + Pinia 集成

全面指南：如何使用 Vite 和 TypeScript 设置和使用 Pinia，包含高级类型安全、开发工具和生产优化。

## 功能特性

- ⚡ 使用 Vite 进行闪电般快速的开发
- 🔷 完整的 TypeScript 支持和严格类型检查
- 🎯 高级类型推断和安全性
- 🛠️ 开发工具和调试
- 📦 优化的生产构建
- 🔧 Pinia 自定义 Vite 插件
- 🎨 代码生成和脚手架
- 🧪 使用 Vitest 的测试设置
- 📊 包分析和优化
- 🔄 热模块替换 (HMR)

## 项目设置

### 1. 初始化项目

```bash
# 使用 TypeScript 创建 Vite 项目
npm create vite@latest my-pinia-app -- --template vue-ts
cd my-pinia-app

# 安装依赖
npm install
npm install pinia
npm install -D @types/node
```

### 2. Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// 用于开发的自定义 Pinia 插件
function piniaDevtools() {
  return {
    name: 'pinia-devtools',
    configureServer(server: any) {
      server.middlewares.use('/api/pinia', (req: any, res: any, next: any) => {
        if (req.method === 'GET' && req.url === '/api/pinia/stores') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ stores: [] }))
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    piniaDevtools(),
    // 包分析器（仅在分析模式下）
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  
  // TypeScript 配置
  esbuild: {
    target: 'es2020',
    keepNames: true
  },
  
  // 开发服务器
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // 构建配置
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia'],
          utils: ['lodash-es', 'date-fns']
        }
      }
    },
    
    // 块大小警告限制
    chunkSizeWarningLimit: 1000
  },
  
  // 优化
  optimizeDeps: {
    include: ['vue', 'pinia', 'lodash-es'],
    exclude: ['@vueuse/core']
  }
})
```

### 3. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* 打包器模式 */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    
    /* 路径映射 */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@stores/*": ["src/stores/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    },
    
    /* 类型检查 */
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ],
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

## 高级类型定义

### 核心类型

```typescript
// src/types/index.ts
export interface User {
  readonly id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  roles: readonly Role[]
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  readonly id: string
  name: string
  permissions: readonly Permission[]
}

export interface Permission {
  readonly id: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'es' | 'fr' | 'de' | 'zh'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends'
    activityTracking: boolean
  }
}

// API 响应类型
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: Date
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 错误类型
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: Date
}

export interface ValidationError extends ApiError {
  field: string
  value: unknown
  constraints: string[]
}

// Store 状态类型
export interface LoadingState {
  isLoading: boolean
  loadingMessage?: string
}

export interface ErrorState {
  error: ApiError | null
  hasError: boolean
}

export interface CacheState<T> {
  data: T | null
  lastFetched: Date | null
  isStale: boolean
}

// 工具类型
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Store 操作类型
export type AsyncAction<T extends any[], R> = (
  ...args: T
) => Promise<R>

export type SyncAction<T extends any[], R> = (
  ...args: T
) => R
```

### Store 类型助手

```typescript
// src/types/store.ts
import type { Ref, ComputedRef } from 'vue'
import type { StoreDefinition } from 'pinia'

// 通用 store 状态接口
export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Store getters 类型助手
export type StoreGetters<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? ComputedRef<ReturnType<T[K]>>
    : ComputedRef<T[K]>
}

// Store actions 类型助手
export type StoreActions<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => R
    : never
}

// 类型化 store 定义
export interface TypedStore<
  Id extends string,
  State extends Record<string, any>,
  Getters extends Record<string, any>,
  Actions extends Record<string, any>
> {
  $id: Id
  $state: State
  $getters: StoreGetters<Getters>
  $actions: StoreActions<Actions>
  $patch: (partialState: Partial<State>) => void
  $reset: () => void
  $subscribe: (
    callback: (mutation: any, state: State) => void,
    options?: { detached?: boolean }
  ) => () => void
}

// Store 组合助手
export type StoreComposition<T> = T extends StoreDefinition<
  infer Id,
  infer State,
  infer Getters,
  infer Actions
>
  ? TypedStore<Id, State, Getters, Actions>
  : never

// 异步状态包装器
export interface AsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: () => Promise<T>
  refresh: () => Promise<T>
  reset: () => void
}
```

## 高级 Store 实现

### 完整 TypeScript 用户 Store

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  User,
  UserPreferences,
  ApiResponse,
  AsyncAction,
  LoadingState,
  ErrorState
} from '@types'
import { userApi } from '@/api/user'
import { validateEmail } from '@utils/validation'

interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface UpdateProfileData {
  firstName?: string
  lastName?: string
  avatar?: File | string
}

interface UserStoreState extends LoadingState, ErrorState {
  user: User | null
  isAuthenticated: boolean
  sessionExpiry: Date | null
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const state = ref<UserStoreState>({
    user: null,
    isAuthenticated: false,
    sessionExpiry: null,
    isLoading: false,
    error: null,
    hasError: false
  })
  
  // 具有正确类型的计算属性
  const userProfile = computed(() => {
    if (!state.value.user) return null
    
    const { firstName, lastName, email, avatar } = state.value.user
    return {
      fullName: `${firstName} ${lastName}`,
      initials: `${firstName[0]}${lastName[0]}`.toUpperCase(),
      email,
      avatar,
      displayName: firstName || email.split('@')[0]
    } as const
  })
  
  const hasPermission = computed(() => {
    return (resource: string, action: string): boolean => {
      if (!state.value.user) return false
      
      return state.value.user.roles.some(role =>
        role.permissions.some(permission =>
          permission.resource === resource && permission.action === action
        )
      )
    }
  })
  
  const hasRole = computed(() => {
    return (roleName: string): boolean => {
      if (!state.value.user) return false
      return state.value.user.roles.some(role => role.name === roleName)
    }
  })
  
  const isSessionValid = computed(() => {
    if (!state.value.sessionExpiry) return false
    return new Date() < state.value.sessionExpiry
  })
  
  const preferences = computed(() => {
    return state.value.user?.preferences ?? {
      theme: 'auto' as const,
      language: 'zh' as const,
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public' as const,
        activityTracking: true
      }
    }
  })
  
  // 具有正确类型的操作
  const login: AsyncAction<[LoginCredentials], User> = async (credentials) => {
    if (!validateEmail(credentials.email)) {
      throw new Error('邮箱格式无效')
    }
    
    state.value.isLoading = true
    state.value.error = null
    state.value.hasError = false
    
    try {
      const response: ApiResponse<{
        user: User
        token: string
        expiresAt: string
      }> = await userApi.login(credentials)
      
      state.value.user = response.data.user
      state.value.isAuthenticated = true
      state.value.sessionExpiry = new Date(response.data.expiresAt)
      
      // 安全存储 token
      localStorage.setItem('auth_token', response.data.token)
      
      return response.data.user
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败'
      state.value.error = errorMessage
      state.value.hasError = true
      throw error
    } finally {
      state.value.isLoading = false
    }
  }
  
  const logout: AsyncAction<[], void> = async () => {
    state.value.isLoading = true
    
    try {
      await userApi.logout()
    } catch (error) {
      console.warn('登出 API 调用失败:', error)
    } finally {
      // 无论 API 调用结果如何都清除状态
      state.value.user = null
      state.value.isAuthenticated = false
      state.value.sessionExpiry = null
      state.value.error = null
      state.value.hasError = false
      state.value.isLoading = false
      
      localStorage.removeItem('auth_token')
    }
  }
  
  const updateProfile: AsyncAction<[UpdateProfileData], User> = async (updates) => {
    if (!state.value.user) {
      throw new Error('没有用户登录')
    }
    
    state.value.isLoading = true
    state.value.error = null
    
    try {
      const response: ApiResponse<User> = await userApi.updateProfile(updates)
      
      state.value.user = {
        ...state.value.user,
        ...response.data,
        updatedAt: new Date()
      }
      
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新失败'
      state.value.error = errorMessage
      state.value.hasError = true
      throw error
    } finally {
      state.value.isLoading = false
    }
  }
  
  const updatePreferences: AsyncAction<[Partial<UserPreferences>], UserPreferences> = async (updates) => {
    if (!state.value.user) {
      throw new Error('没有用户登录')
    }
    
    state.value.isLoading = true
    
    try {
      const newPreferences = {
        ...state.value.user.preferences,
        ...updates
      }
      
      const response: ApiResponse<UserPreferences> = await userApi.updatePreferences(newPreferences)
      
      state.value.user = {
        ...state.value.user,
        preferences: response.data,
        updatedAt: new Date()
      }
      
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '偏好设置更新失败'
      state.value.error = errorMessage
      state.value.hasError = true
      throw error
    } finally {
      state.value.isLoading = false
    }
  }
  
  const refreshUser: AsyncAction<[], User | null> = async () => {
    if (!state.value.isAuthenticated || !isSessionValid.value) {
      return null
    }
    
    state.value.isLoading = true
    
    try {
      const response: ApiResponse<User> = await userApi.getCurrentUser()
      state.value.user = response.data
      return response.data
    } catch (error) {
      console.error('刷新用户失败:', error)
      await logout()
      return null
    } finally {
      state.value.isLoading = false
    }
  }
  
  const clearError = () => {
    state.value.error = null
    state.value.hasError = false
  }
  
  // 从存储的 token 初始化
  const initializeFromStorage = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await refreshUser()
      } catch (error) {
        console.warn('从存储初始化用户失败:', error)
        localStorage.removeItem('auth_token')
      }
    }
  }
  
  return {
    // 状态（只读）
    user: readonly(computed(() => state.value.user)),
    isAuthenticated: readonly(computed(() => state.value.isAuthenticated)),
    isLoading: readonly(computed(() => state.value.isLoading)),
    error: readonly(computed(() => state.value.error)),
    hasError: readonly(computed(() => state.value.hasError)),
    sessionExpiry: readonly(computed(() => state.value.sessionExpiry)),
    
    // 计算属性
    userProfile,
    hasPermission,
    hasRole,
    isSessionValid,
    preferences,
    
    // 操作
    login,
    logout,
    updateProfile,
    updatePreferences,
    refreshUser,
    clearError,
    initializeFromStorage
  }
})

// 导出类型供外部使用
export type UserStore = ReturnType<typeof useUserStore>
```

### 具有高级功能的产品 Store

```typescript
// src/stores/products.ts
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  PaginatedResponse,
  AsyncAction,
  CacheState
} from '@types'
import { productsApi } from '@/api/products'
import { debounce } from '@utils/debounce'

interface Product {
  readonly id: string
  name: string
  description: string
  price: number
  category: string
  tags: readonly string[]
  images: readonly string[]
  inStock: boolean
  stockQuantity: number
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
}

interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  tags?: readonly string[]
  search?: string
}

interface ProductsStoreState {
  products: CacheState<readonly Product[]>
  currentProduct: CacheState<Product>
  filters: ProductFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loading: {
    products: boolean
    currentProduct: boolean
    creating: boolean
    updating: boolean
    deleting: boolean
  }
  errors: {
    products: string | null
    currentProduct: string | null
    mutation: string | null
  }
}

export const useProductsStore = defineStore('products', () => {
  // 状态
  const state = ref<ProductsStoreState>({
    products: {
      data: null,
      lastFetched: null,
      isStale: true
    },
    currentProduct: {
      data: null,
      lastFetched: null,
      isStale: true
    },
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    loading: {
      products: false,
      currentProduct: false,
      creating: false,
      updating: false,
      deleting: false
    },
    errors: {
      products: null,
      currentProduct: null,
      mutation: null
    }
  })
  
  // 计算属性
  const products = computed(() => state.value.products.data ?? [])
  
  const currentProduct = computed(() => state.value.currentProduct.data)
  
  const filteredProducts = computed(() => {
    let filtered = products.value
    const { category, minPrice, maxPrice, inStock, tags, search } = state.value.filters
    
    if (category) {
      filtered = filtered.filter(p => p.category === category)
    }
    
    if (minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= minPrice)
    }
    
    if (maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= maxPrice)
    }
    
    if (inStock !== undefined) {
      filtered = filtered.filter(p => p.inStock === inStock)
    }
    
    if (tags && tags.length > 0) {
      filtered = filtered.filter(p => 
        tags.some(tag => p.tags.includes(tag))
      )
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  })
  
  const categories = computed(() => {
    const categorySet = new Set(products.value.map(p => p.category))
    return Array.from(categorySet).sort()
  })
  
  const allTags = computed(() => {
    const tagSet = new Set(products.value.flatMap(p => p.tags))
    return Array.from(tagSet).sort()
  })
  
  const priceRange = computed(() => {
    if (products.value.length === 0) return { min: 0, max: 0 }
    
    const prices = products.value.map(p => p.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  })
  
  const isLoading = computed(() => {
    return Object.values(state.value.loading).some(Boolean)
  })
  
  const hasErrors = computed(() => {
    return Object.values(state.value.errors).some(Boolean)
  })
  
  // 操作
  const fetchProducts: AsyncAction<[{ page?: number; refresh?: boolean }?], readonly Product[]> = async (options = {}) => {
    const { page = 1, refresh = false } = options
    
    // 如果可用且不过时，使用缓存
    if (!refresh && state.value.products.data && !state.value.products.isStale) {
      return state.value.products.data
    }
    
    state.value.loading.products = true
    state.value.errors.products = null
    
    try {
      const response: PaginatedResponse<Product> = await productsApi.getProducts({
        page,
        limit: state.value.pagination.limit,
        ...state.value.filters
      })
      
      state.value.products = {
        data: response.data,
        lastFetched: new Date(),
        isStale: false
      }
      
      state.value.pagination = {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }
      
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取产品失败'
      state.value.errors.products = errorMessage
      throw error
    } finally {
      state.value.loading.products = false
    }
  }
  
  const fetchProductById: AsyncAction<[string, { refresh?: boolean }?], Product> = async (id, options = {}) => {
    const { refresh = false } = options
    
    // 检查产品是否在缓存中
    const cachedProduct = products.value.find(p => p.id === id)
    if (!refresh && cachedProduct) {
      state.value.currentProduct = {
        data: cachedProduct,
        lastFetched: new Date(),
        isStale: false
      }
      return cachedProduct
    }
    
    state.value.loading.currentProduct = true
    state.value.errors.currentProduct = null
    
    try {
      const response = await productsApi.getProductById(id)
      
      state.value.currentProduct = {
        data: response.data,
        lastFetched: new Date(),
        isStale: false
      }
      
      // 如果产品存在于产品缓存中则更新
      if (state.value.products.data) {
        const index = state.value.products.data.findIndex(p => p.id === id)
        if (index !== -1) {
          state.value.products.data = [
            ...state.value.products.data.slice(0, index),
            response.data,
            ...state.value.products.data.slice(index + 1)
          ]
        }
      }
      
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取产品失败'
      state.value.errors.currentProduct = errorMessage
      throw error
    } finally {
      state.value.loading.currentProduct = false
    }
  }
  
  const setFilters = (filters: Partial<ProductFilters>) => {
    state.value.filters = { ...state.value.filters, ...filters }
    state.value.products.isStale = true
  }
  
  const clearFilters = () => {
    state.value.filters = {}
    state.value.products.isStale = true
  }
  
  const searchProducts = debounce((query: string) => {
    setFilters({ search: query })
    fetchProducts({ refresh: true })
  }, 300)
  
  const invalidateCache = () => {
    state.value.products.isStale = true
    state.value.currentProduct.isStale = true
  }
  
  const clearErrors = () => {
    state.value.errors = {
      products: null,
      currentProduct: null,
      mutation: null
    }
  }
  
  return {
    // 状态（只读）
    products: readonly(products),
    currentProduct: readonly(currentProduct),
    filters: readonly(computed(() => state.value.filters)),
    pagination: readonly(computed(() => state.value.pagination)),
    loading: readonly(computed(() => state.value.loading)),
    errors: readonly(computed(() => state.value.errors)),
    
    // 计算属性
    filteredProducts,
    categories,
    allTags,
    priceRange,
    isLoading,
    hasErrors,
    
    // 操作
    fetchProducts,
    fetchProductById,
    setFilters,
    clearFilters,
    searchProducts,
    invalidateCache,
    clearErrors
  }
})

export type ProductsStore = ReturnType<typeof useProductsStore>
```

## 开发工具

### 用于 Store 生成的自定义 Vite 插件

```typescript
// scripts/generate-store.ts
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

interface StoreConfig {
  name: string
  fields: Array<{
    name: string
    type: string
    optional?: boolean
  }>
  actions: string[]
}

function generateStore(config: StoreConfig): string {
  const { name, fields, actions } = config
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
  
  const interfaceFields = fields
    .map(field => `  ${field.name}${field.optional ? '?' : ''}: ${field.type}`)
    .join('\n')
  
  const stateFields = fields
    .map(field => `    ${field.name}: ${getDefaultValue(field.type)}`)
    .join(',\n')
  
  const actionMethods = actions
    .map(action => generateActionMethod(action))
    .join('\n\n')
  
  return `
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

interface ${capitalizedName} {
${interfaceFields}
}

interface ${capitalizedName}StoreState {
  items: ${capitalizedName}[]
  currentItem: ${capitalizedName} | null
  loading: boolean
  error: string | null
}

export const use${capitalizedName}Store = defineStore('${name}', () => {
  const state = ref<${capitalizedName}StoreState>({
${stateFields}
  })
  
  // 计算属性
  const items = computed(() => state.value.items)
  const currentItem = computed(() => state.value.currentItem)
  const isLoading = computed(() => state.value.loading)
  const hasError = computed(() => !!state.value.error)
  
  // 操作
${actionMethods}
  
  return {
    // 状态
    items: readonly(items),
    currentItem: readonly(currentItem),
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    error: readonly(computed(() => state.value.error)),
    
    // 操作
    ${actions.join(',\n    ')}
  }
})

export type ${capitalizedName}Store = ReturnType<typeof use${capitalizedName}Store>
`
}

function getDefaultValue(type: string): string {
  switch (type) {
    case 'string': return "''"
    case 'number': return '0'
    case 'boolean': return 'false'
    case 'Date': return 'new Date()'
    default: return 'null'
  }
}

function generateActionMethod(action: string): string {
  return `  const ${action} = async () => {
    state.value.loading = true
    state.value.error = null
    
    try {
      // TODO: 实现 ${action}
      console.log('${action} 被调用')
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '未知错误'
      throw error
    } finally {
      state.value.loading = false
    }
  }`
}

// CLI 使用
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: StoreConfig = {
    name: process.argv[2] || 'example',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'createdAt', type: 'Date' }
    ],
    actions: ['fetchItems', 'createItem', 'updateItem', 'deleteItem']
  }
  
  const storeCode = generateStore(config)
  const storePath = resolve(`src/stores/${config.name}.ts`)
  
  mkdirSync('src/stores', { recursive: true })
  writeFileSync(storePath, storeCode)
  
  console.log(`Store 已生成: ${storePath}`)
}
```

## 测试设置

### Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  }
})
```

### Store 测试工具

```typescript
// src/test/store-utils.ts
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { beforeEach, afterEach, vi } from 'vitest'

export function setupStoreTest() {
  let pinia: Pinia
  
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  return {
    get pinia() {
      return pinia
    }
  }
}

export function createMockApi<T extends Record<string, any>>(methods: T): T {
  const mock = {} as T
  
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      mock[key as keyof T] = vi.fn(value) as T[keyof T]
    } else {
      mock[key as keyof T] = value
    }
  }
  
  return mock
}

export function waitForStoreAction(fn: () => Promise<any>, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Store 操作在 ${timeout}ms 后超时`))
    }, timeout)
    
    fn().then(() => {
      clearTimeout(timer)
      resolve()
    }).catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}
```

### Store 测试

```typescript
// src/stores/__tests__/user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@stores/user'
import { setupStoreTest, createMockApi } from '@/test/store-utils'
import type { User, ApiResponse } from '@types'

// 模拟 API
const mockUserApi = createMockApi({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  updatePreferences: vi.fn()
})

vi.mock('@/api/user', () => ({
  userApi: mockUserApi
}))

describe('用户 Store', () => {
  setupStoreTest()
  
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: [],
    preferences: {
      theme: 'light',
      language: 'zh',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public',
        activityTracking: true
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  beforeEach(() => {
    localStorage.clear()
  })
  
  it('应该使用默认状态初始化', () => {
    const store = useUserStore()
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })
  
  it('应该处理成功登录', async () => {
    const store = useUserStore()
    const mockResponse: ApiResponse<{
      user: User
      token: string
      expiresAt: string
    }> = {
      data: {
        user: mockUser,
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      },
      message: '登录成功',
      success: true,
      timestamp: new Date()
    }
    
    mockUserApi.login.mockResolvedValue(mockResponse)
    
    const result = await store.login({
      email: 'test@example.com',
      password: 'password'
    })
    
    expect(result).toEqual(mockUser)
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isLoading).toBe(false)
    expect(localStorage.getItem('auth_token')).toBe('mock-token')
  })
  
  it('应该处理登录失败', async () => {
    const store = useUserStore()
    const error = new Error('无效凭据')
    
    mockUserApi.login.mockRejectedValue(error)
    
    await expect(store.login({
      email: 'test@example.com',
      password: 'wrong-password'
    })).rejects.toThrow('无效凭据')
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.hasError).toBe(true)
    expect(store.error).toBe('无效凭据')
  })
  
  it('应该验证邮箱格式', async () => {
    const store = useUserStore()
    
    await expect(store.login({
      email: 'invalid-email',
      password: 'password'
    })).rejects.toThrow('邮箱格式无效')
  })
  
  it('应该正确计算用户资料', () => {
    const store = useUserStore()
    
    // 模拟已认证状态
    store.login({
      email: 'test@example.com',
      password: 'password'
    })
    
    mockUserApi.login.mockResolvedValue({
      data: {
        user: mockUser,
        token: 'token',
        expiresAt: new Date().toISOString()
      },
      message: '',
      success: true,
      timestamp: new Date()
    })
    
    expect(store.userProfile?.fullName).toBe('John Doe')
    expect(store.userProfile?.initials).toBe('JD')
    expect(store.userProfile?.displayName).toBe('John')
  })
  
  it('应该处理登出', async () => {
    const store = useUserStore()
    
    // 设置初始已认证状态
    localStorage.setItem('auth_token', 'mock-token')
    
    await store.logout()
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(mockUserApi.logout).toHaveBeenCalled()
  })
})
```

## 生产优化

### 包分析脚本

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "build:analyze": "ANALYZE=true npm run build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "type-check": "vue-tsc --noEmit",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "generate:store": "tsx scripts/generate-store.ts"
  }
}
```

### 性能监控

```typescript
// src/utils/performance.ts
export class StorePerformanceMonitor {
  private static instance: StorePerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  static getInstance(): StorePerformanceMonitor {
    if (!this.instance) {
      this.instance = new StorePerformanceMonitor()
    }
    return this.instance
  }
  
  measureAction<T>(storeName: string, actionName: string, action: () => T): T {
    const start = performance.now()
    
    try {
      const result = action()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          this.recordMetric(storeName, actionName, start)
        }) as T
      } else {
        this.recordMetric(storeName, actionName, start)
        return result
      }
    } catch (error) {
      this.recordMetric(storeName, actionName, start)
      throw error
    }
  }
  
  private recordMetric(storeName: string, actionName: string, startTime: number) {
    const duration = performance.now() - startTime
    const key = `${storeName}.${actionName}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    this.metrics.get(key)!.push(duration)
    
    // 只保留最近 100 次测量
    const measurements = this.metrics.get(key)!
    if (measurements.length > 100) {
      measurements.shift()
    }
    
    // 在开发环境中记录慢操作
    if (import.meta.env.DEV && duration > 100) {
      console.warn(`慢 store 操作: ${key} 耗时 ${duration.toFixed(2)}ms`)
    }
  }
  
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    for (const [key, measurements] of this.metrics.entries()) {
      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
      const min = Math.min(...measurements)
      const max = Math.max(...measurements)
      
      result[key] = { avg, min, max, count: measurements.length }
    }
    
    return result
  }
  
  clearMetrics() {
    this.metrics.clear()
  }
}
```

这个全面的 Vite + TypeScript + Pinia 设置为构建可扩展的 Vue.js 应用程序提供了坚实的基础，具有出色的开发体验、类型安全和生产就绪的优化。