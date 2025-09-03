---
title: TypeScript Best Practices
description: Learn best practices for using TypeScript with Pinia. Comprehensive guide to type-safe state management.
head:
  - [meta, { name: description, content: "Learn best practices for using TypeScript with Pinia. Comprehensive guide to type-safe state management." }]
  - [meta, { name: keywords, content: "Pinia TypeScript, Vue TypeScript, type-safe state management, TypeScript best practices" }]
  - [meta, { property: "og:title", content: "TypeScript Best Practices - Pinia" }]
  - [meta, { property: "og:description", content: "Learn best practices for using TypeScript with Pinia. Comprehensive guide to type-safe state management." }]
---

# TypeScript Best Practices

This guide covers best practices for using TypeScript with Pinia to create type-safe, maintainable state management solutions.

## Project Setup

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*",
    "types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/stores': resolve(__dirname, 'src/stores'),
      '@/types': resolve(__dirname, 'src/types')
    }
  },
  build: {
    sourcemap: true
  }
})
```

## Store Type Definitions

### Basic Store Types

```ts
// types/store.ts
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export interface UserState {
  currentUser: User | null
  users: User[]
  loading: boolean
  error: string | null
  lastFetch: Date | null
}

export interface UserFilters {
  role?: User['role']
  search?: string
  sortBy?: keyof User
  sortOrder?: 'asc' | 'desc'
}
```

### Advanced Store Types

```ts
// types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// types/store-actions.ts
export interface AsyncActionState {
  loading: boolean
  error: ApiError | null
  lastExecuted: Date | null
}

export type AsyncActionResult<T> = Promise<{
  success: boolean
  data?: T
  error?: ApiError
}>
```

## Store Implementation

### Composition API Store

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { 
  User, 
  UserState, 
  UserFilters, 
  AsyncActionResult,
  PaginatedResponse 
} from '@/types'
import { userApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // State
  const state = reactive<UserState>({
    currentUser: null,
    users: [],
    loading: false,
    error: null,
    lastFetch: null
  })

  const filters = ref<UserFilters>({})

  // Getters
  const isAuthenticated = computed((): boolean => {
    return state.currentUser !== null
  })

  const isAdmin = computed((): boolean => {
    return state.currentUser?.role === 'admin'
  })

  const filteredUsers = computed((): User[] => {
    let result = state.users

    if (filters.value.role) {
      result = result.filter(user => user.role === filters.value.role)
    }

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      )
    }

    if (filters.value.sortBy) {
      result = [...result].sort((a, b) => {
        const aValue = a[filters.value.sortBy!]
        const bValue = b[filters.value.sortBy!]
        
        if (aValue < bValue) return filters.value.sortOrder === 'desc' ? 1 : -1
        if (aValue > bValue) return filters.value.sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }

    return result
  })

  const getUserById = computed(() => {
    return (id: number): User | undefined => {
      return state.users.find(user => user.id === id)
    }
  })

  // Actions
  async function fetchUsers(
    page = 1, 
    limit = 10
  ): AsyncActionResult<PaginatedResponse<User>> {
    state.loading = true
    state.error = null

    try {
      const response = await userApi.getUsers({ page, limit })
      
      if (response.success) {
        state.users = response.data
        state.lastFetch = new Date()
        return { success: true, data: response }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const apiError = error as ApiError
      state.error = apiError.message
      return { success: false, error: apiError }
    } finally {
      state.loading = false
    }
  }

  async function createUser(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): AsyncActionResult<User> {
    state.loading = true
    state.error = null

    try {
      const response = await userApi.createUser(userData)
      
      if (response.success) {
        state.users.push(response.data)
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const apiError = error as ApiError
      state.error = apiError.message
      return { success: false, error: apiError }
    } finally {
      state.loading = false
    }
  }

  async function updateUser(
    id: number, 
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): AsyncActionResult<User> {
    state.loading = true
    state.error = null

    try {
      const response = await userApi.updateUser(id, updates)
      
      if (response.success) {
        const index = state.users.findIndex(user => user.id === id)
        if (index !== -1) {
          state.users[index] = response.data
        }
        
        if (state.currentUser?.id === id) {
          state.currentUser = response.data
        }
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const apiError = error as ApiError
      state.error = apiError.message
      return { success: false, error: apiError }
    } finally {
      state.loading = false
    }
  }

  async function deleteUser(id: number): AsyncActionResult<void> {
    state.loading = true
    state.error = null

    try {
      const response = await userApi.deleteUser(id)
      
      if (response.success) {
        state.users = state.users.filter(user => user.id !== id)
        
        if (state.currentUser?.id === id) {
          state.currentUser = null
        }
        
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      const apiError = error as ApiError
      state.error = apiError.message
      return { success: false, error: apiError }
    } finally {
      state.loading = false
    }
  }

  function setCurrentUser(user: User | null): void {
    state.currentUser = user
  }

  function setFilters(newFilters: Partial<UserFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters(): void {
    filters.value = {}
  }

  function clearError(): void {
    state.error = null
  }

  return {
    // State
    ...toRefs(state),
    filters: readonly(filters),
    
    // Getters
    isAuthenticated,
    isAdmin,
    filteredUsers,
    getUserById,
    
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    setFilters,
    clearFilters,
    clearError
  }
})

// Type helper for store instance
export type UserStore = ReturnType<typeof useUserStore>
```

### Options API Store

```ts
// stores/product.ts
import { defineStore } from 'pinia'
import type { Product, ProductState, ProductFilters } from '@/types'
import { productApi } from '@/api/product'

export const useProductStore = defineStore('product', {
  state: (): ProductState => ({
    products: [],
    categories: [],
    selectedProduct: null,
    loading: false,
    error: null,
    filters: {
      category: undefined,
      priceRange: undefined,
      inStock: undefined
    }
  }),

  getters: {
    filteredProducts(): Product[] {
      let result = this.products

      if (this.filters.category) {
        result = result.filter(p => p.category === this.filters.category)
      }

      if (this.filters.priceRange) {
        const [min, max] = this.filters.priceRange
        result = result.filter(p => p.price >= min && p.price <= max)
      }

      if (this.filters.inStock !== undefined) {
        result = result.filter(p => p.inStock === this.filters.inStock)
      }

      return result
    },

    productsByCategory(): Record<string, Product[]> {
      return this.products.reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = []
        }
        acc[product.category].push(product)
        return acc
      }, {} as Record<string, Product[]>)
    },

    getProductById(): (id: number) => Product | undefined {
      return (id: number) => this.products.find(p => p.id === id)
    },

    averagePrice(): number {
      if (this.products.length === 0) return 0
      const total = this.products.reduce((sum, p) => sum + p.price, 0)
      return total / this.products.length
    }
  },

  actions: {
    async fetchProducts(): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const response = await productApi.getProducts()
        this.products = response.data
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.loading = false
      }
    },

    async createProduct(
      productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Product> {
      this.loading = true
      this.error = null

      try {
        const response = await productApi.createProduct(productData)
        this.products.push(response.data)
        return response.data
      } catch (error) {
        this.error = (error as Error).message
        throw error
      } finally {
        this.loading = false
      }
    },

    updateFilters(filters: Partial<ProductFilters>): void {
      this.filters = { ...this.filters, ...filters }
    },

    clearFilters(): void {
      this.filters = {
        category: undefined,
        priceRange: undefined,
        inStock: undefined
      }
    }
  }
})
```

## Type-Safe Composables

### Store Composables

```ts
// composables/useUserActions.ts
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { User, UserFilters } from '@/types'

export function useUserActions() {
  const userStore = useUserStore()

  const actions = {
    async loadUsers(page = 1, limit = 10) {
      const result = await userStore.fetchUsers(page, limit)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load users')
      }
      return result.data
    },

    async saveUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
      const result = await userStore.createUser(userData)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create user')
      }
      return result.data
    },

    async editUser(
      id: number, 
      updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
    ) {
      const result = await userStore.updateUser(id, updates)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update user')
      }
      return result.data
    },

    async removeUser(id: number) {
      const result = await userStore.deleteUser(id)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete user')
      }
    }
  }

  const filters = {
    setRole(role: User['role'] | undefined) {
      userStore.setFilters({ role })
    },

    setSearch(search: string | undefined) {
      userStore.setFilters({ search })
    },

    setSorting(sortBy: keyof User, sortOrder: 'asc' | 'desc') {
      userStore.setFilters({ sortBy, sortOrder })
    },

    reset() {
      userStore.clearFilters()
    }
  }

  return {
    actions,
    filters,
    // Re-export store state and getters with proper typing
    users: computed(() => userStore.filteredUsers),
    currentUser: computed(() => userStore.currentUser),
    loading: computed(() => userStore.loading),
    error: computed(() => userStore.error),
    isAuthenticated: computed(() => userStore.isAuthenticated),
    isAdmin: computed(() => userStore.isAdmin)
  }
}
```

### Form Composables

```ts
// composables/useForm.ts
import { ref, reactive, computed } from 'vue'
import type { Ref } from 'vue'

export interface FormField<T> {
  value: T
  error: string | null
  touched: boolean
  required: boolean
}

export interface FormValidationRule<T> {
  message: string
  validator: (value: T) => boolean
}

export interface FormConfig<T extends Record<string, any>> {
  initialValues: T
  validationRules?: {
    [K in keyof T]?: FormValidationRule<T[K]>[]
  }
  onSubmit?: (values: T) => Promise<void> | void
}

export function useForm<T extends Record<string, any>>(
  config: FormConfig<T>
) {
  const fields = reactive(
    Object.keys(config.initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: config.initialValues[key],
        error: null,
        touched: false,
        required: false
      }
      return acc
    }, {} as { [K in keyof T]: FormField<T[K]> })
  )

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const values = computed(() => {
    return Object.keys(fields).reduce((acc, key) => {
      acc[key as keyof T] = fields[key as keyof T].value
      return acc
    }, {} as T)
  })

  const errors = computed(() => {
    return Object.keys(fields).reduce((acc, key) => {
      const field = fields[key as keyof T]
      acc[key as keyof T] = field.error
      return acc
    }, {} as { [K in keyof T]: string | null })
  })

  const isValid = computed(() => {
    return Object.values(errors.value).every(error => error === null)
  })

  const isDirty = computed(() => {
    return Object.keys(fields).some(key => {
      const field = fields[key as keyof T]
      return field.value !== config.initialValues[key as keyof T]
    })
  })

  function validateField<K extends keyof T>(fieldName: K): void {
    const field = fields[fieldName]
    const rules = config.validationRules?.[fieldName] || []
    
    field.error = null
    
    for (const rule of rules) {
      if (!rule.validator(field.value)) {
        field.error = rule.message
        break
      }
    }
  }

  function validateAll(): boolean {
    Object.keys(fields).forEach(key => {
      validateField(key as keyof T)
    })
    return isValid.value
  }

  function setFieldValue<K extends keyof T>(fieldName: K, value: T[K]): void {
    fields[fieldName].value = value
    fields[fieldName].touched = true
    validateField(fieldName)
  }

  function setFieldError<K extends keyof T>(
    fieldName: K, 
    error: string | null
  ): void {
    fields[fieldName].error = error
  }

  function touchField<K extends keyof T>(fieldName: K): void {
    fields[fieldName].touched = true
    validateField(fieldName)
  }

  function reset(): void {
    Object.keys(fields).forEach(key => {
      const field = fields[key as keyof T]
      field.value = config.initialValues[key as keyof T]
      field.error = null
      field.touched = false
    })
    submitError.value = null
  }

  async function submit(): Promise<void> {
    if (!validateAll()) {
      return
    }

    if (!config.onSubmit) {
      return
    }

    isSubmitting.value = true
    submitError.value = null

    try {
      await config.onSubmit(values.value)
    } catch (error) {
      submitError.value = (error as Error).message
      throw error
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    fields,
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    submitError,
    setFieldValue,
    setFieldError,
    touchField,
    validateField,
    validateAll,
    reset,
    submit
  }
}
```

## Component Integration

### Type-Safe Component Props

```vue
<!-- components/UserCard.vue -->
<template>
  <div class="user-card">
    <div class="user-avatar">
      <img :src="user.avatar" :alt="user.name" />
    </div>
    <div class="user-info">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <span class="user-role" :class="roleClass">{{ user.role }}</span>
    </div>
    <div class="user-actions">
      <button @click="handleEdit" :disabled="!canEdit">Edit</button>
      <button @click="handleDelete" :disabled="!canDelete">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types'
import { useUserStore } from '@/stores/user'

interface Props {
  user: User
  editable?: boolean
  deletable?: boolean
}

interface Emits {
  edit: [user: User]
  delete: [userId: number]
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  deletable: true
})

const emit = defineEmits<Emits>()

const userStore = useUserStore()

const roleClass = computed(() => {
  return `role-${props.user.role}`
})

const canEdit = computed(() => {
  return props.editable && (
    userStore.isAdmin || 
    userStore.currentUser?.id === props.user.id
  )
})

const canDelete = computed(() => {
  return props.deletable && 
    userStore.isAdmin && 
    userStore.currentUser?.id !== props.user.id
})

function handleEdit() {
  if (canEdit.value) {
    emit('edit', props.user)
  }
}

function handleDelete() {
  if (canDelete.value) {
    emit('delete', props.user.id)
  }
}
</script>
```

### Form Components

```vue
<!-- components/UserForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="user-form">
    <div class="form-group">
      <label for="name">Name *</label>
      <input
        id="name"
        v-model="form.fields.name.value"
        @blur="form.touchField('name')"
        type="text"
        :class="{ error: form.fields.name.error }"
      />
      <span v-if="form.fields.name.error" class="error-message">
        {{ form.fields.name.error }}
      </span>
    </div>

    <div class="form-group">
      <label for="email">Email *</label>
      <input
        id="email"
        v-model="form.fields.email.value"
        @blur="form.touchField('email')"
        type="email"
        :class="{ error: form.fields.email.error }"
      />
      <span v-if="form.fields.email.error" class="error-message">
        {{ form.fields.email.error }}
      </span>
    </div>

    <div class="form-group">
      <label for="role">Role *</label>
      <select
        id="role"
        v-model="form.fields.role.value"
        @blur="form.touchField('role')"
        :class="{ error: form.fields.role.error }"
      >
        <option value="">Select a role</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
        <option value="guest">Guest</option>
      </select>
      <span v-if="form.fields.role.error" class="error-message">
        {{ form.fields.role.error }}
      </span>
    </div>

    <div class="form-actions">
      <button type="button" @click="form.reset()">Reset</button>
      <button 
        type="submit" 
        :disabled="!form.isValid || form.isSubmitting"
      >
        {{ form.isSubmitting ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <div v-if="form.submitError" class="error-message">
      {{ form.submitError }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from '@/composables/useForm'
import { useUserActions } from '@/composables/useUserActions'
import type { User } from '@/types'

interface Props {
  initialUser?: Partial<User>
  mode: 'create' | 'edit'
}

interface Emits {
  success: [user: User]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  initialUser: () => ({})
})

const emit = defineEmits<Emits>()

const { actions } = useUserActions()

const form = useForm({
  initialValues: {
    name: props.initialUser.name || '',
    email: props.initialUser.email || '',
    role: props.initialUser.role || '' as User['role']
  },
  validationRules: {
    name: [
      {
        message: 'Name is required',
        validator: (value: string) => value.trim().length > 0
      },
      {
        message: 'Name must be at least 2 characters',
        validator: (value: string) => value.trim().length >= 2
      }
    ],
    email: [
      {
        message: 'Email is required',
        validator: (value: string) => value.trim().length > 0
      },
      {
        message: 'Invalid email format',
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      }
    ],
    role: [
      {
        message: 'Role is required',
        validator: (value: string) => ['admin', 'user', 'guest'].includes(value)
      }
    ]
  },
  async onSubmit(values) {
    try {
      let user: User
      
      if (props.mode === 'create') {
        user = await actions.saveUser({
          name: values.name,
          email: values.email,
          role: values.role,
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              sms: false
            }
          }
        })
      } else {
        user = await actions.editUser(props.initialUser.id!, {
          name: values.name,
          email: values.email,
          role: values.role
        })
      }
      
      emit('success', user)
    } catch (error) {
      // Error is handled by the form composable
      throw error
    }
  }
})

function handleSubmit() {
  form.submit()
}
</script>
```

## Testing

### Store Testing

```ts
// tests/stores/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import type { User } from '@/types'
import * as userApi from '@/api/user'

// Mock the API
vi.mock('@/api/user')
const mockedUserApi = vi.mocked(userApi)

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const store = useUserStore()
    
    expect(store.currentUser).toBeNull()
    expect(store.users).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isAdmin).toBe(false)
  })

  it('should fetch users successfully', async () => {
    const mockUsers: User[] = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: { email: true, push: true, sms: false }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    mockedUserApi.getUsers.mockResolvedValue({
      success: true,
      data: mockUsers,
      message: 'Success',
      timestamp: new Date().toISOString()
    })

    const store = useUserStore()
    const result = await store.fetchUsers()

    expect(result.success).toBe(true)
    expect(store.users).toEqual(mockUsers)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should handle fetch users error', async () => {
    const errorMessage = 'Failed to fetch users'
    mockedUserApi.getUsers.mockRejectedValue(new Error(errorMessage))

    const store = useUserStore()
    const result = await store.fetchUsers()

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe(errorMessage)
    expect(store.users).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(errorMessage)
  })

  it('should filter users correctly', () => {
    const store = useUserStore()
    
    // Set up test data
    store.users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        preferences: { theme: 'light', language: 'en', notifications: { email: true, push: true, sms: false } },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        preferences: { theme: 'dark', language: 'en', notifications: { email: true, push: false, sms: false } },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Test role filter
    store.setFilters({ role: 'admin' })
    expect(store.filteredUsers).toHaveLength(1)
    expect(store.filteredUsers[0].name).toBe('John Doe')

    // Test search filter
    store.setFilters({ role: undefined, search: 'jane' })
    expect(store.filteredUsers).toHaveLength(1)
    expect(store.filteredUsers[0].name).toBe('Jane Smith')
  })
})
```

### Component Testing

```ts
// tests/components/UserCard.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserCard from '@/components/UserCard.vue'
import { useUserStore } from '@/stores/user'
import type { User } from '@/types'

const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: { email: true, push: true, sms: false }
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('UserCard', () => {
  beforeEach(() => {
    // Reset any mocks
  })

  it('should render user information correctly', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser },
      global: {
        plugins: [createTestingPinia()]
      }
    })

    expect(wrapper.find('h3').text()).toBe('John Doe')
    expect(wrapper.find('p').text()).toBe('john@example.com')
    expect(wrapper.find('.user-role').text()).toBe('user')
  })

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser, editable: true },
      global: {
        plugins: [createTestingPinia({
          initialState: {
            user: {
              currentUser: { ...mockUser, role: 'admin' },
              isAdmin: true
            }
          }
        })]
      }
    })

    await wrapper.find('button:first-child').trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([mockUser])
  })

  it('should disable edit button when user cannot edit', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser, editable: true },
      global: {
        plugins: [createTestingPinia({
          initialState: {
            user: {
              currentUser: { ...mockUser, id: 2, role: 'user' },
              isAdmin: false
            }
          }
        })]
      }
    })

    const editButton = wrapper.find('button:first-child')
    expect(editButton.attributes('disabled')).toBeDefined()
  })
})
```

## Performance Optimization

### Lazy Loading Stores

```ts
// stores/index.ts
import type { App } from 'vue'
import { createPinia } from 'pinia'

// Core stores that are always needed
import { useUserStore } from './user'
import { useAppStore } from './app'

// Lazy-loaded stores
const lazyStores = {
  product: () => import('./product').then(m => m.useProductStore),
  order: () => import('./order').then(m => m.useOrderStore),
  analytics: () => import('./analytics').then(m => m.useAnalyticsStore)
}

export function setupStores(app: App) {
  const pinia = createPinia()
  app.use(pinia)
  
  // Initialize core stores
  useUserStore()
  useAppStore()
  
  return pinia
}

export async function useStore<K extends keyof typeof lazyStores>(
  storeName: K
): Promise<ReturnType<Awaited<ReturnType<typeof lazyStores[K]>>>> {
  const storeFactory = await lazyStores[storeName]()
  return storeFactory()
}

// Re-export core stores
export { useUserStore, useAppStore }
```

### Computed Optimization

```ts
// stores/optimized.ts
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { Product } from '@/types'

export const useOptimizedStore = defineStore('optimized', () => {
  // Use shallowRef for large arrays to avoid deep reactivity
  const products = shallowRef<Product[]>([])
  
  // Memoized expensive computations
  const expensiveComputation = computed(() => {
    // Only recalculate when products array reference changes
    return products.value.reduce((acc, product) => {
      // Expensive calculation here
      return acc + product.price * product.quantity
    }, 0)
  })
  
  // Use computed for derived state instead of getters in options API
  const productsByCategory = computed(() => {
    const map = new Map<string, Product[]>()
    
    for (const product of products.value) {
      const category = product.category
      if (!map.has(category)) {
        map.set(category, [])
      }
      map.get(category)!.push(product)
    }
    
    return map
  })
  
  return {
    products,
    expensiveComputation,
    productsByCategory
  }
})
```

## Error Handling

### Global Error Handler

```ts
// utils/errorHandler.ts
import type { ApiError } from '@/types'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message,
      details: error.details
    }
  }
  
  if (error instanceof Error) {
    return {
      code: 'GENERIC_ERROR',
      message: error.message
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred'
  }
}

export function createErrorHandler(storeName: string) {
  return (error: unknown): ApiError => {
    const apiError = handleApiError(error)
    
    // Log error for debugging
    console.error(`[${storeName}] Error:`, apiError)
    
    // Report to error tracking service
    if (import.meta.env.PROD) {
      // reportError(apiError)
    }
    
    return apiError
  }
}
```

## Best Practices Summary

### 1. Type Safety
- Always define interfaces for your state, actions, and API responses
- Use strict TypeScript configuration
- Leverage type inference where possible
- Create type-safe composables

### 2. Store Organization
- Keep stores focused and cohesive
- Use composition API for complex logic
- Implement proper error handling
- Use async/await for better error propagation

### 3. Performance
- Use `shallowRef` for large data structures
- Implement lazy loading for non-critical stores
- Optimize computed properties
- Avoid unnecessary reactivity

### 4. Testing
- Write comprehensive unit tests for stores
- Use testing utilities like `@pinia/testing`
- Mock external dependencies
- Test both success and error scenarios

### 5. Code Quality
- Follow consistent naming conventions
- Document complex logic
- Use ESLint and Prettier
- Implement proper error boundaries

## Related Resources

- [Advanced TypeScript Patterns](./advanced-typescript.md)
- [TypeScript API Reference](../api/typescript.md)
- [Plugin Development](./plugin-development.md)
- [Testing Guide](../guide/testing.md)