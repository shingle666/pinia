# Vite + TypeScript + Pinia Integration

A comprehensive guide to setting up and using Pinia with Vite and TypeScript, featuring advanced type safety, development tools, and production optimizations.

## Features

- ⚡ Lightning-fast development with Vite
- 🔷 Full TypeScript support with strict typing
- 🎯 Advanced type inference and safety
- 🛠️ Development tools and debugging
- 📦 Optimized production builds
- 🔧 Custom Vite plugins for Pinia
- 🎨 Code generation and scaffolding
- 🧪 Testing setup with Vitest
- 📊 Bundle analysis and optimization
- 🔄 Hot Module Replacement (HMR)

## Project Setup

### 1. Initialize Project

```bash
# Create Vite project with TypeScript
npm create vite@latest my-pinia-app -- --template vue-ts
cd my-pinia-app

# Install dependencies
npm install
npm install pinia
npm install -D @types/node
```

### 2. Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Custom Pinia plugin for development
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
    // Bundle analyzer (only in analyze mode)
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
  
  // TypeScript configuration
  esbuild: {
    target: 'es2020',
    keepNames: true
  },
  
  // Development server
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
  
  // Build configuration
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
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['vue', 'pinia', 'lodash-es'],
    exclude: ['@vueuse/core']
  }
})
```

### 3. TypeScript Configuration

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
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    
    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@stores/*": ["src/stores/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    },
    
    /* Type checking */
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

## Advanced Type Definitions

### Core Types

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

// API Response types
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

// Error types
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

// Store state types
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

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Store action types
export type AsyncAction<T extends any[], R> = (
  ...args: T
) => Promise<R>

export type SyncAction<T extends any[], R> = (
  ...args: T
) => R
```

### Store Type Helpers

```typescript
// src/types/store.ts
import type { Ref, ComputedRef } from 'vue'
import type { StoreDefinition } from 'pinia'

// Generic store state interface
export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Store getters type helper
export type StoreGetters<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? ComputedRef<ReturnType<T[K]>>
    : ComputedRef<T[K]>
}

// Store actions type helper
export type StoreActions<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => R
    : never
}

// Typed store definition
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

// Store composition helper
export type StoreComposition<T> = T extends StoreDefinition<
  infer Id,
  infer State,
  infer Getters,
  infer Actions
>
  ? TypedStore<Id, State, Getters, Actions>
  : never

// Async state wrapper
export interface AsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: () => Promise<T>
  refresh: () => Promise<T>
  reset: () => void
}
```

## Advanced Store Implementation

### User Store with Full TypeScript

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
  // State
  const state = ref<UserStoreState>({
    user: null,
    isAuthenticated: false,
    sessionExpiry: null,
    isLoading: false,
    error: null,
    hasError: false
  })
  
  // Getters with proper typing
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
      language: 'en' as const,
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
  
  // Actions with proper typing
  const login: AsyncAction<[LoginCredentials], User> = async (credentials) => {
    if (!validateEmail(credentials.email)) {
      throw new Error('Invalid email format')
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
      
      // Store token securely
      localStorage.setItem('auth_token', response.data.token)
      
      return response.data.user
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
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
      console.warn('Logout API call failed:', error)
    } finally {
      // Clear state regardless of API call result
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
      throw new Error('No user logged in')
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
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      state.value.error = errorMessage
      state.value.hasError = true
      throw error
    } finally {
      state.value.isLoading = false
    }
  }
  
  const updatePreferences: AsyncAction<[Partial<UserPreferences>], UserPreferences> = async (updates) => {
    if (!state.value.user) {
      throw new Error('No user logged in')
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
      const errorMessage = error instanceof Error ? error.message : 'Preferences update failed'
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
      console.error('Failed to refresh user:', error)
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
  
  // Initialize from stored token
  const initializeFromStorage = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await refreshUser()
      } catch (error) {
        console.warn('Failed to initialize user from storage:', error)
        localStorage.removeItem('auth_token')
      }
    }
  }
  
  return {
    // State (readonly)
    user: readonly(computed(() => state.value.user)),
    isAuthenticated: readonly(computed(() => state.value.isAuthenticated)),
    isLoading: readonly(computed(() => state.value.isLoading)),
    error: readonly(computed(() => state.value.error)),
    hasError: readonly(computed(() => state.value.hasError)),
    sessionExpiry: readonly(computed(() => state.value.sessionExpiry)),
    
    // Getters
    userProfile,
    hasPermission,
    hasRole,
    isSessionValid,
    preferences,
    
    // Actions
    login,
    logout,
    updateProfile,
    updatePreferences,
    refreshUser,
    clearError,
    initializeFromStorage
  }
})

// Type export for external use
export type UserStore = ReturnType<typeof useUserStore>
```

### Products Store with Advanced Features

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
  // State
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
  
  // Getters
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
  
  // Actions
  const fetchProducts: AsyncAction<[{ page?: number; refresh?: boolean }?], readonly Product[]> = async (options = {}) => {
    const { page = 1, refresh = false } = options
    
    // Use cache if available and not stale
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products'
      state.value.errors.products = errorMessage
      throw error
    } finally {
      state.value.loading.products = false
    }
  }
  
  const fetchProductById: AsyncAction<[string, { refresh?: boolean }?], Product> = async (id, options = {}) => {
    const { refresh = false } = options
    
    // Check if product is in cache
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
      
      // Update products cache if product exists there
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product'
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
    // State (readonly)
    products: readonly(products),
    currentProduct: readonly(currentProduct),
    filters: readonly(computed(() => state.value.filters)),
    pagination: readonly(computed(() => state.value.pagination)),
    loading: readonly(computed(() => state.value.loading)),
    errors: readonly(computed(() => state.value.errors)),
    
    // Getters
    filteredProducts,
    categories,
    allTags,
    priceRange,
    isLoading,
    hasErrors,
    
    // Actions
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

## Development Tools

### Custom Vite Plugin for Store Generation

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
  
  // Getters
  const items = computed(() => state.value.items)
  const currentItem = computed(() => state.value.currentItem)
  const isLoading = computed(() => state.value.loading)
  const hasError = computed(() => !!state.value.error)
  
  // Actions
${actionMethods}
  
  return {
    // State
    items: readonly(items),
    currentItem: readonly(currentItem),
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    error: readonly(computed(() => state.value.error)),
    
    // Actions
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
      // TODO: Implement ${action}
      console.log('${action} called')
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      state.value.loading = false
    }
  }`
}

// CLI usage
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
  
  console.log(`Store generated: ${storePath}`)
}
```

## Testing Setup

### Vitest Configuration

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

### Store Testing Utilities

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
      reject(new Error(`Store action timeout after ${timeout}ms`))
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

### Store Tests

```typescript
// src/stores/__tests__/user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@stores/user'
import { setupStoreTest, createMockApi } from '@/test/store-utils'
import type { User, ApiResponse } from '@types'

// Mock API
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

describe('User Store', () => {
  setupStoreTest()
  
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: [],
    preferences: {
      theme: 'light',
      language: 'en',
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
  
  it('should initialize with default state', () => {
    const store = useUserStore()
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })
  
  it('should handle successful login', async () => {
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
      message: 'Login successful',
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
  
  it('should handle login failure', async () => {
    const store = useUserStore()
    const error = new Error('Invalid credentials')
    
    mockUserApi.login.mockRejectedValue(error)
    
    await expect(store.login({
      email: 'test@example.com',
      password: 'wrong-password'
    })).rejects.toThrow('Invalid credentials')
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.hasError).toBe(true)
    expect(store.error).toBe('Invalid credentials')
  })
  
  it('should validate email format', async () => {
    const store = useUserStore()
    
    await expect(store.login({
      email: 'invalid-email',
      password: 'password'
    })).rejects.toThrow('Invalid email format')
  })
  
  it('should compute user profile correctly', () => {
    const store = useUserStore()
    
    // Mock authenticated state
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
  
  it('should handle logout', async () => {
    const store = useUserStore()
    
    // Set initial authenticated state
    localStorage.setItem('auth_token', 'mock-token')
    
    await store.logout()
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(mockUserApi.logout).toHaveBeenCalled()
  })
})
```

## Production Optimizations

### Bundle Analysis Script

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

### Performance Monitoring

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
    
    // Keep only last 100 measurements
    const measurements = this.metrics.get(key)!
    if (measurements.length > 100) {
      measurements.shift()
    }
    
    // Log slow actions in development
    if (import.meta.env.DEV && duration > 100) {
      console.warn(`Slow store action: ${key} took ${duration.toFixed(2)}ms`)
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

This comprehensive Vite + TypeScript + Pinia setup provides a robust foundation for building scalable Vue.js applications with excellent developer experience, type safety, and production-ready optimizations.