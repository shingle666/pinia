---
title: Testing - Pinia Guide
description: Learn how to test Pinia stores in your Vue.js applications with unit tests, integration tests, and end-to-end testing strategies.
keywords: Pinia, Vue.js, testing, unit tests, integration tests, Vitest, Jest, Vue Test Utils
author: Pinia Team
generator: VitePress
og:title: Testing - Pinia Guide
og:description: Learn how to test Pinia stores in your Vue.js applications with unit tests, integration tests, and end-to-end testing strategies.
og:image: /og-image.svg
og:url: https://allfun.net/guide/testing
twitter:card: summary_large_image
twitter:title: Testing - Pinia Guide
twitter:description: Learn how to test Pinia stores in your Vue.js applications with unit tests, integration tests, and end-to-end testing strategies.
twitter:image: /og-image.svg
---

# Testing

Testing Pinia stores is straightforward thanks to their simple structure and Vue's excellent testing ecosystem. This guide covers unit testing stores, testing components that use stores, and integration testing strategies.

## Overview

When testing Pinia stores, you'll typically want to test:

- **Store state**: Initial state and state mutations
- **Store getters**: Computed values and their reactivity
- **Store actions**: Business logic and side effects
- **Component integration**: How components interact with stores
- **Store composition**: How multiple stores work together

## Unit Testing Stores

### Basic Store Testing

```ts
// stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    incrementBy(amount: number) {
      this.count += amount
    },
    
    reset() {
      this.count = 0
    }
  }
})
```

```ts
// stores/__tests__/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../counter'

describe('Counter Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })
  
  it('initializes with correct default state', () => {
    const store = useCounterStore()
    
    expect(store.count).toBe(0)
    expect(store.name).toBe('Counter')
  })
  
  it('increments count', () => {
    const store = useCounterStore()
    
    store.increment()
    expect(store.count).toBe(1)
    
    store.increment()
    expect(store.count).toBe(2)
  })
  
  it('decrements count', () => {
    const store = useCounterStore()
    store.count = 5
    
    store.decrement()
    expect(store.count).toBe(4)
  })
  
  it('increments by specific amount', () => {
    const store = useCounterStore()
    
    store.incrementBy(5)
    expect(store.count).toBe(5)
    
    store.incrementBy(3)
    expect(store.count).toBe(8)
  })
  
  it('resets count to zero', () => {
    const store = useCounterStore()
    store.count = 10
    
    store.reset()
    expect(store.count).toBe(0)
  })
  
  describe('getters', () => {
    it('calculates double count correctly', () => {
      const store = useCounterStore()
      
      expect(store.doubleCount).toBe(0)
      
      store.count = 5
      expect(store.doubleCount).toBe(10)
    })
    
    it('determines if count is even', () => {
      const store = useCounterStore()
      
      expect(store.isEven).toBe(true) // 0 is even
      
      store.increment()
      expect(store.isEven).toBe(false) // 1 is odd
      
      store.increment()
      expect(store.isEven).toBe(true) // 2 is even
    })
  })
})
```

### Testing Async Actions

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { api } from '@/services/api'

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    currentUser: null as User | null,
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null
      
      try {
        const users = await api.getUsers()
        this.users = users
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },
    
    async createUser(userData: Omit<User, 'id'>) {
      this.loading = true
      this.error = null
      
      try {
        const newUser = await api.createUser(userData)
        this.users.push(newUser)
        return newUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async deleteUser(id: number) {
      this.loading = true
      this.error = null
      
      try {
        await api.deleteUser(id)
        this.users = this.users.filter(user => user.id !== id)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

```ts
// stores/__tests__/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'
import { api } from '@/services/api'

// Mock the API
vi.mock('@/services/api', () => ({
  api: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    deleteUser: vi.fn()
  }
}))

const mockApi = vi.mocked(api)

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  describe('fetchUsers', () => {
    it('fetches users successfully', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ]
      
      mockApi.getUsers.mockResolvedValue(mockUsers)
      
      const store = useUserStore()
      
      expect(store.loading).toBe(false)
      
      const promise = store.fetchUsers()
      expect(store.loading).toBe(true)
      
      await promise
      
      expect(store.loading).toBe(false)
      expect(store.users).toEqual(mockUsers)
      expect(store.error).toBe(null)
      expect(mockApi.getUsers).toHaveBeenCalledOnce()
    })
    
    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch users'
      mockApi.getUsers.mockRejectedValue(new Error(errorMessage))
      
      const store = useUserStore()
      
      await store.fetchUsers()
      
      expect(store.loading).toBe(false)
      expect(store.users).toEqual([])
      expect(store.error).toBe(errorMessage)
    })
  })
  
  describe('createUser', () => {
    it('creates user successfully', async () => {
      const userData = { name: 'New User', email: 'new@example.com' }
      const createdUser = { id: 3, ...userData }
      
      mockApi.createUser.mockResolvedValue(createdUser)
      
      const store = useUserStore()
      
      const result = await store.createUser(userData)
      
      expect(result).toEqual(createdUser)
      expect(store.users).toContain(createdUser)
      expect(store.error).toBe(null)
      expect(mockApi.createUser).toHaveBeenCalledWith(userData)
    })
    
    it('handles create error', async () => {
      const userData = { name: 'New User', email: 'new@example.com' }
      const errorMessage = 'Failed to create user'
      
      mockApi.createUser.mockRejectedValue(new Error(errorMessage))
      
      const store = useUserStore()
      
      await expect(store.createUser(userData)).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
      expect(store.users).toEqual([])
    })
  })
  
  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      const store = useUserStore()
      store.users = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' }
      ]
      
      mockApi.deleteUser.mockResolvedValue(undefined)
      
      await store.deleteUser(1)
      
      expect(store.users).toHaveLength(1)
      expect(store.users[0].id).toBe(2)
      expect(mockApi.deleteUser).toHaveBeenCalledWith(1)
    })
  })
})
```

### Testing Store Composition

```ts
// stores/cart.ts
import { defineStore } from 'pinia'
import { useProductStore } from './product'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),
  
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    
    totalPrice(): number {
      const productStore = useProductStore()
      
      return this.items.reduce((sum, item) => {
        const product = productStore.getProductById(item.productId)
        return sum + (product?.price || 0) * item.quantity
      }, 0)
    }
  },
  
  actions: {
    addItem(productId: number, quantity = 1) {
      const existingItem = this.items.find(item => item.productId === productId)
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({ productId, quantity })
      }
    },
    
    removeItem(productId: number) {
      const index = this.items.findIndex(item => item.productId === productId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    },
    
    updateQuantity(productId: number, quantity: number) {
      const item = this.items.find(item => item.productId === productId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(productId)
        } else {
          item.quantity = quantity
        }
      }
    }
  }
})
```

```ts
// stores/__tests__/cart.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart'
import { useProductStore } from '../product'

describe('Cart Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Setup product store with test data
    const productStore = useProductStore()
    productStore.products = [
      { id: 1, name: 'Product 1', price: 10 },
      { id: 2, name: 'Product 2', price: 20 },
      { id: 3, name: 'Product 3', price: 30 }
    ]
  })
  
  it('adds items to cart', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toEqual({ productId: 1, quantity: 2 })
    
    store.addItem(2, 1)
    expect(store.items).toHaveLength(2)
  })
  
  it('increases quantity for existing items', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.addItem(1, 3)
    
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(5)
  })
  
  it('calculates total items correctly', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.addItem(2, 3)
    
    expect(store.totalItems).toBe(5)
  })
  
  it('calculates total price correctly', () => {
    const store = useCartStore()
    
    store.addItem(1, 2) // 2 * $10 = $20
    store.addItem(2, 1) // 1 * $20 = $20
    
    expect(store.totalPrice).toBe(40)
  })
  
  it('removes items from cart', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.addItem(2, 1)
    
    store.removeItem(1)
    
    expect(store.items).toHaveLength(1)
    expect(store.items[0].productId).toBe(2)
  })
  
  it('updates item quantity', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.updateQuantity(1, 5)
    
    expect(store.items[0].quantity).toBe(5)
  })
  
  it('removes item when quantity is set to 0', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.updateQuantity(1, 0)
    
    expect(store.items).toHaveLength(0)
  })
})
```

## Testing Components with Stores

### Basic Component Testing

```vue
<!-- components/Counter.vue -->
<template>
  <div class="counter">
    <h2>{{ store.name }}</h2>
    <p>Count: {{ store.count }}</p>
    <p>Double: {{ store.doubleCount }}</p>
    <p>Is Even: {{ store.isEven ? 'Yes' : 'No' }}</p>
    
    <div class="controls">
      <button @click="store.decrement" :disabled="store.count <= 0">
        -
      </button>
      <button @click="store.increment">
        +
      </button>
      <button @click="store.reset">
        Reset
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>
```

```ts
// components/__tests__/Counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Counter from '../Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('Counter Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('renders counter state correctly', () => {
    const wrapper = mount(Counter)
    
    expect(wrapper.text()).toContain('Count: 0')
    expect(wrapper.text()).toContain('Double: 0')
    expect(wrapper.text()).toContain('Is Even: Yes')
  })
  
  it('increments count when + button is clicked', async () => {
    const wrapper = mount(Counter)
    const incrementButton = wrapper.find('button:nth-child(2)')
    
    await incrementButton.trigger('click')
    
    expect(wrapper.text()).toContain('Count: 1')
    expect(wrapper.text()).toContain('Double: 2')
    expect(wrapper.text()).toContain('Is Even: No')
  })
  
  it('decrements count when - button is clicked', async () => {
    const wrapper = mount(Counter)
    const store = useCounterStore()
    
    // Set initial count
    store.count = 5
    await wrapper.vm.$nextTick()
    
    const decrementButton = wrapper.find('button:nth-child(1)')
    await decrementButton.trigger('click')
    
    expect(wrapper.text()).toContain('Count: 4')
  })
  
  it('resets count when reset button is clicked', async () => {
    const wrapper = mount(Counter)
    const store = useCounterStore()
    
    // Set initial count
    store.count = 10
    await wrapper.vm.$nextTick()
    
    const resetButton = wrapper.find('button:nth-child(3)')
    await resetButton.trigger('click')
    
    expect(wrapper.text()).toContain('Count: 0')
  })
  
  it('disables decrement button when count is 0', () => {
    const wrapper = mount(Counter)
    const decrementButton = wrapper.find('button:nth-child(1)')
    
    expect(decrementButton.attributes('disabled')).toBeDefined()
  })
  
  it('enables decrement button when count is greater than 0', async () => {
    const wrapper = mount(Counter)
    const store = useCounterStore()
    
    store.count = 1
    await wrapper.vm.$nextTick()
    
    const decrementButton = wrapper.find('button:nth-child(1)')
    expect(decrementButton.attributes('disabled')).toBeUndefined()
  })
})
```

### Testing with Mock Stores

```ts
// components/__tests__/UserList.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import UserList from '../UserList.vue'
import { useUserStore } from '@/stores/user'

// Create a mock store
const createMockUserStore = (overrides = {}) => {
  return {
    users: [],
    loading: false,
    error: null,
    fetchUsers: vi.fn(),
    createUser: vi.fn(),
    deleteUser: vi.fn(),
    ...overrides
  }
}

describe('UserList Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('displays loading state', () => {
    const mockStore = createMockUserStore({ loading: true })
    
    // Mock the store
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    const wrapper = mount(UserList)
    
    expect(wrapper.text()).toContain('Loading...')
  })
  
  it('displays error state', () => {
    const mockStore = createMockUserStore({ 
      error: 'Failed to load users' 
    })
    
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    const wrapper = mount(UserList)
    
    expect(wrapper.text()).toContain('Failed to load users')
  })
  
  it('displays users list', () => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
    
    const mockStore = createMockUserStore({ users: mockUsers })
    
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    const wrapper = mount(UserList)
    
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('jane@example.com')
  })
  
  it('calls fetchUsers on mount', () => {
    const mockStore = createMockUserStore()
    
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    mount(UserList)
    
    expect(mockStore.fetchUsers).toHaveBeenCalledOnce()
  })
})
```

### Testing with Real Stores

```ts
// components/__tests__/ProductCard.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductCard from '../ProductCard.vue'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'

describe('ProductCard Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Setup test data
    const productStore = useProductStore()
    productStore.products = [
      { id: 1, name: 'Test Product', price: 29.99, description: 'A test product' }
    ]
  })
  
  it('adds product to cart when button is clicked', async () => {
    const wrapper = mount(ProductCard, {
      props: {
        productId: 1
      }
    })
    
    const cartStore = useCartStore()
    const addButton = wrapper.find('[data-testid="add-to-cart"]')
    
    await addButton.trigger('click')
    
    expect(cartStore.items).toHaveLength(1)
    expect(cartStore.items[0]).toEqual({ productId: 1, quantity: 1 })
  })
  
  it('shows correct quantity in cart', async () => {
    const wrapper = mount(ProductCard, {
      props: {
        productId: 1
      }
    })
    
    const cartStore = useCartStore()
    cartStore.addItem(1, 3)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('In cart: 3')
  })
})
```

## Integration Testing

### Testing Store Interactions

```ts
// tests/integration/shopping-flow.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/product'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'

describe('Shopping Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('completes full shopping flow', async () => {
    const productStore = useProductStore()
    const cartStore = useCartStore()
    const userStore = useUserStore()
    const orderStore = useOrderStore()
    
    // Setup products
    productStore.products = [
      { id: 1, name: 'Product 1', price: 10, stock: 5 },
      { id: 2, name: 'Product 2', price: 20, stock: 3 }
    ]
    
    // Setup user
    userStore.currentUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    }
    
    // Add items to cart
    cartStore.addItem(1, 2)
    cartStore.addItem(2, 1)
    
    expect(cartStore.totalItems).toBe(3)
    expect(cartStore.totalPrice).toBe(50) // (2 * 10) + (1 * 20)
    
    // Create order
    const order = await orderStore.createOrder({
      userId: userStore.currentUser.id,
      items: cartStore.items
    })
    
    expect(order).toBeDefined()
    expect(order.total).toBe(50)
    expect(order.items).toHaveLength(2)
    
    // Verify stock was updated
    expect(productStore.getProductById(1)?.stock).toBe(3) // 5 - 2
    expect(productStore.getProductById(2)?.stock).toBe(2) // 3 - 1
    
    // Verify cart was cleared
    expect(cartStore.items).toHaveLength(0)
  })
  
  it('handles insufficient stock', async () => {
    const productStore = useProductStore()
    const cartStore = useCartStore()
    const orderStore = useOrderStore()
    
    // Setup product with limited stock
    productStore.products = [
      { id: 1, name: 'Limited Product', price: 10, stock: 1 }
    ]
    
    // Try to add more than available
    cartStore.addItem(1, 3)
    
    // Order should fail
    await expect(
      orderStore.createOrder({
        userId: 1,
        items: cartStore.items
      })
    ).rejects.toThrow('Insufficient stock')
    
    // Stock should remain unchanged
    expect(productStore.getProductById(1)?.stock).toBe(1)
  })
})
```

### Testing with Vue Router

```ts
// tests/integration/navigation.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/profile', component: { template: '<div>Profile</div>' }, meta: { requiresAuth: true } }
  ]
})

describe('Navigation with Auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('redirects to login when accessing protected route without auth', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)
    
    await router.push('/profile')
    
    expect(router.currentRoute.value.path).toBe('/login')
  })
  
  it('allows access to protected route when authenticated', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    
    const authStore = useAuthStore()
    authStore.user = { id: 1, name: 'Test User' }
    
    await router.push('/profile')
    
    expect(router.currentRoute.value.path).toBe('/profile')
  })
})
```

## Testing Utilities

### Custom Test Helpers

```ts
// tests/utils/test-helpers.ts
import { setActivePinia, createPinia, type Pinia } from 'pinia'
import type { App } from 'vue'
import { createApp } from 'vue'

/**
 * Creates a fresh Pinia instance for testing
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Creates a test app with Pinia
 */
export function createTestApp() {
  const app = createApp({})
  const pinia = createTestPinia()
  app.use(pinia)
  return { app, pinia }
}

/**
 * Waits for all pending promises to resolve
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Creates a mock store with default implementations
 */
export function createMockStore<T extends Record<string, any>>(
  defaults: Partial<T> = {}
): T {
  return {
    $id: 'mock-store',
    $state: {},
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn(),
    $onAction: vi.fn(),
    $dispose: vi.fn(),
    ...defaults
  } as T
}

/**
 * Asserts that a store action was called with specific arguments
 */
export function expectActionCalled(
  action: any,
  ...args: any[]
) {
  expect(action).toHaveBeenCalledWith(...args)
}

/**
 * Asserts that a store state matches expected values
 */
export function expectStoreState<T>(
  store: T,
  expectedState: Partial<T>
) {
  Object.keys(expectedState).forEach(key => {
    expect((store as any)[key]).toEqual((expectedState as any)[key])
  })
}
```

### Test Setup

```ts
// tests/setup.ts
import { beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createTestPinia } from './utils/test-helpers'

// Global test setup
beforeEach(() => {
  // Create fresh Pinia instance for each test
  createTestPinia()
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks()
})

// Configure Vue Test Utils
config.global.plugins = []
```

## Best Practices

### 1. Test Structure

```ts
// Good: Organized test structure
describe('UserStore', () => {
  describe('state', () => {
    it('initializes with correct defaults', () => {
      // Test initial state
    })
  })
  
  describe('getters', () => {
    it('computes fullName correctly', () => {
      // Test getters
    })
  })
  
  describe('actions', () => {
    describe('fetchUser', () => {
      it('fetches user successfully', () => {
        // Test successful case
      })
      
      it('handles fetch error', () => {
        // Test error case
      })
    })
  })
})
```

### 2. Mock External Dependencies

```ts
// Good: Mock API calls
vi.mock('@/services/api', () => ({
  api: {
    getUsers: vi.fn(),
    createUser: vi.fn()
  }
}))

// Good: Mock complex dependencies
vi.mock('@/utils/analytics', () => ({
  track: vi.fn(),
  identify: vi.fn()
}))
```

### 3. Test Real Behavior

```ts
// Good: Test actual store behavior
it('updates user preferences', async () => {
  const store = useUserStore()
  
  await store.updatePreferences({ theme: 'dark' })
  
  expect(store.preferences.theme).toBe('dark')
  expect(mockApi.updatePreferences).toHaveBeenCalledWith({ theme: 'dark' })
})

// Avoid: Testing implementation details
it('calls internal method', () => {
  const store = useUserStore()
  const spy = vi.spyOn(store, '_internalMethod')
  
  store.publicMethod()
  
  expect(spy).toHaveBeenCalled() // Don't test this
})
```

### 4. Use Descriptive Test Names

```ts
// Good: Descriptive test names
it('increments count when increment action is called')
it('throws error when trying to delete non-existent user')
it('filters products by category and price range')

// Avoid: Vague test names
it('works correctly')
it('handles error')
it('updates state')
```

### 5. Test Edge Cases

```ts
describe('CartStore', () => {
  it('handles adding item with zero quantity', () => {
    const store = useCartStore()
    
    store.addItem(1, 0)
    
    expect(store.items).toHaveLength(0)
  })
  
  it('handles removing non-existent item', () => {
    const store = useCartStore()
    
    expect(() => store.removeItem(999)).not.toThrow()
    expect(store.items).toHaveLength(0)
  })
  
  it('handles empty cart checkout', async () => {
    const store = useCartStore()
    
    await expect(store.checkout()).rejects.toThrow('Cart is empty')
  })
})
```

## Related Links

- [Vue Test Utils](https://test-utils.vuejs.org/) - Official Vue testing utilities
- [Vitest](https://vitest.dev/) - Fast unit testing framework
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/) - Simple testing utilities
- [Component Testing](../cookbook/component-testing) - Advanced component testing patterns
- [E2E Testing](../cookbook/e2e-testing) - End-to-end testing strategies