---
title: Component Testing - Pinia Cookbook
description: Learn how to test Vue components that use Pinia stores. Complete guide with examples for unit testing, mocking stores, and testing store interactions.
keywords: Pinia, Vue.js, component testing, unit testing, mocking, Vitest, Jest, testing stores
author: Pinia Team
generator: VitePress
og:title: Component Testing - Pinia Cookbook
og:description: Learn how to test Vue components that use Pinia stores. Complete guide with examples for unit testing, mocking stores, and testing store interactions.
og:image: /og-image.svg
og:url: https://allfun.net/cookbook/component-testing
twitter:card: summary_large_image
twitter:title: Component Testing - Pinia Cookbook
twitter:description: Learn how to test Vue components that use Pinia stores. Complete guide with examples for unit testing, mocking stores, and testing store interactions.
twitter:image: /og-image.svg
---

# Component Testing

Testing Vue components that use Pinia stores requires special consideration to ensure your tests are isolated, reliable, and maintainable. This guide covers various strategies for testing components with Pinia stores.

## Basic Setup

### Test Environment Configuration

First, set up your testing environment with the necessary dependencies:

```bash
npm install -D @vue/test-utils vitest jsdom
# or
npm install -D @vue/test-utils jest @vue/vue3-jest
```

### Vitest Configuration

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

## Testing Strategies

### 1. Testing with Real Stores

For integration-style tests, you can use real stores:

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    }
  }
})
```

```vue
<!-- components/Counter.vue -->
<template>
  <div>
    <span data-testid="count">{{ store.count }}</span>
    <button data-testid="increment" @click="store.increment">+</button>
    <button data-testid="decrement" @click="store.decrement">-</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>
```

```js
// tests/Counter.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('Counter Component', () => {
  let wrapper
  let store

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
    
    wrapper = mount(Counter, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    store = useCounterStore()
  })

  it('displays the current count', () => {
    expect(wrapper.get('[data-testid="count"]').text()).toBe('0')
  })

  it('increments count when increment button is clicked', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
    expect(store.count).toBe(1)
  })

  it('decrements count when decrement button is clicked', async () => {
    store.count = 5 // Set initial state
    await wrapper.vm.$nextTick()
    
    await wrapper.get('[data-testid="decrement"]').trigger('click')
    expect(wrapper.get('[data-testid="count"]').text()).toBe('4')
    expect(store.count).toBe(4)
  })
})
```

### 2. Mocking Stores

For unit tests, you might want to mock stores to isolate component logic:

```js
// tests/Counter.mock.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Counter from '@/components/Counter.vue'

// Mock the store
vi.mock('@/stores/counter', () => ({
  useCounterStore: vi.fn(() => ({
    count: 0,
    increment: vi.fn(),
    decrement: vi.fn()
  }))
}))

describe('Counter Component (Mocked)', () => {
  let wrapper
  let mockStore

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Import after mocking
    const { useCounterStore } = await import('@/stores/counter')
    mockStore = useCounterStore()
    
    wrapper = mount(Counter, {
      global: {
        plugins: [createPinia()]
      }
    })
  })

  it('calls increment when increment button is clicked', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    expect(mockStore.increment).toHaveBeenCalledOnce()
  })

  it('calls decrement when decrement button is clicked', async () => {
    await wrapper.get('[data-testid="decrement"]').trigger('click')
    expect(mockStore.decrement).toHaveBeenCalledOnce()
  })
})
```

### 3. Partial Store Mocking

Sometimes you want to mock only specific parts of a store:

```js
// tests/Counter.partial-mock.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('Counter Component (Partial Mock)', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    
    wrapper = mount(Counter, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    store = useCounterStore()
    
    // Mock specific actions while keeping state reactive
    store.increment = vi.fn(() => {
      store.count++
    })
    store.decrement = vi.fn(() => {
      store.count--
    })
  })

  it('increments count and calls mocked action', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    
    expect(store.increment).toHaveBeenCalledOnce()
    expect(store.count).toBe(1)
    expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
  })
})
```

## Testing Complex Components

### Component with Multiple Stores

```vue
<!-- components/UserProfile.vue -->
<template>
  <div>
    <div v-if="userStore.isLoading">Loading...</div>
    <div v-else-if="userStore.error">Error: {{ userStore.error }}</div>
    <div v-else>
      <h1>{{ userStore.user?.name }}</h1>
      <p>Cart items: {{ cartStore.itemCount }}</p>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const userStore = useUserStore()
const cartStore = useCartStore()

const logout = async () => {
  await userStore.logout()
  cartStore.clearCart()
}
</script>
```

```js
// tests/UserProfile.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import UserProfile from '@/components/UserProfile.vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

describe('UserProfile Component', () => {
  let wrapper
  let userStore
  let cartStore

  beforeEach(() => {
    setActivePinia(createPinia())
    
    wrapper = mount(UserProfile, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    userStore = useUserStore()
    cartStore = useCartStore()
    
    // Mock async actions
    userStore.logout = vi.fn().mockResolvedValue()
    cartStore.clearCart = vi.fn()
  })

  it('displays loading state', async () => {
    userStore.isLoading = true
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Loading...')
  })

  it('displays error state', async () => {
    userStore.error = 'Failed to load user'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Error: Failed to load user')
  })

  it('displays user profile when loaded', async () => {
    userStore.user = { name: 'John Doe' }
    cartStore.itemCount = 3
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Cart items: 3')
  })

  it('handles logout correctly', async () => {
    const logoutButton = wrapper.find('button')
    await logoutButton.trigger('click')
    
    expect(userStore.logout).toHaveBeenCalledOnce()
    expect(cartStore.clearCart).toHaveBeenCalledOnce()
  })
})
```

### Testing Async Operations

```vue
<!-- components/ProductList.vue -->
<template>
  <div>
    <button @click="loadProducts" :disabled="store.isLoading">
      {{ store.isLoading ? 'Loading...' : 'Load Products' }}
    </button>
    
    <div v-if="store.error" class="error">
      {{ store.error }}
    </div>
    
    <ul v-if="store.products.length">
      <li v-for="product in store.products" :key="product.id">
        {{ product.name }} - ${{ product.price }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useProductStore } from '@/stores/product'

const store = useProductStore()

const loadProducts = async () => {
  try {
    await store.fetchProducts()
  } catch (error) {
    console.error('Failed to load products:', error)
  }
}
</script>
```

```js
// tests/ProductList.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import ProductList from '@/components/ProductList.vue'
import { useProductStore } from '@/stores/product'

describe('ProductList Component', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    
    wrapper = mount(ProductList, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    store = useProductStore()
  })

  it('loads products successfully', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 10 },
      { id: 2, name: 'Product 2', price: 20 }
    ]
    
    store.fetchProducts = vi.fn().mockImplementation(async () => {
      store.isLoading = true
      await new Promise(resolve => setTimeout(resolve, 100))
      store.products = mockProducts
      store.isLoading = false
    })
    
    const button = wrapper.find('button')
    await button.trigger('click')
    
    // Check loading state
    expect(button.text()).toBe('Loading...')
    expect(button.attributes('disabled')).toBeDefined()
    
    // Wait for async operation
    await vi.runAllTimers()
    await wrapper.vm.$nextTick()
    
    expect(store.fetchProducts).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Product 1 - $10')
    expect(wrapper.text()).toContain('Product 2 - $20')
  })

  it('handles fetch error', async () => {
    const errorMessage = 'Network error'
    
    store.fetchProducts = vi.fn().mockImplementation(async () => {
      store.isLoading = true
      await new Promise(resolve => setTimeout(resolve, 100))
      store.error = errorMessage
      store.isLoading = false
      throw new Error(errorMessage)
    })
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const button = wrapper.find('button')
    await button.trigger('click')
    
    await vi.runAllTimers()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.error').text()).toBe(errorMessage)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load products:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})
```

## Testing with Composition API

### Testing Custom Composables

```js
// composables/useCart.js
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

export function useCart() {
  const cartStore = useCartStore()
  const userStore = useUserStore()
  
  const totalWithDiscount = computed(() => {
    const discount = userStore.user?.isPremium ? 0.1 : 0
    return cartStore.total * (1 - discount)
  })
  
  const addItem = async (product, quantity = 1) => {
    if (!userStore.user) {
      throw new Error('User must be logged in')
    }
    
    await cartStore.addItem(product, quantity)
  }
  
  return {
    items: cartStore.items,
    total: cartStore.total,
    totalWithDiscount,
    addItem
  }
}
```

```js
// tests/useCart.test.js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useCart } from '@/composables/useCart'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

describe('useCart composable', () => {
  let cartStore
  let userStore

  beforeEach(() => {
    setActivePinia(createPinia())
    cartStore = useCartStore()
    userStore = useUserStore()
  })

  it('calculates total with premium discount', () => {
    cartStore.total = 100
    userStore.user = { isPremium: true }
    
    const { totalWithDiscount } = useCart()
    
    expect(totalWithDiscount.value).toBe(90) // 10% discount
  })

  it('calculates total without discount for regular users', () => {
    cartStore.total = 100
    userStore.user = { isPremium: false }
    
    const { totalWithDiscount } = useCart()
    
    expect(totalWithDiscount.value).toBe(100) // No discount
  })

  it('throws error when adding item without user', async () => {
    userStore.user = null
    
    const { addItem } = useCart()
    
    await expect(addItem({ id: 1, name: 'Product' })).rejects.toThrow('User must be logged in')
  })

  it('adds item when user is logged in', async () => {
    userStore.user = { id: 1, name: 'John' }
    cartStore.addItem = vi.fn().mockResolvedValue()
    
    const { addItem } = useCart()
    const product = { id: 1, name: 'Product' }
    
    await addItem(product, 2)
    
    expect(cartStore.addItem).toHaveBeenCalledWith(product, 2)
  })
})
```

## Testing Utilities

### Test Helper Functions

```js
// tests/helpers/pinia-test-utils.js
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

/**
 * Creates a fresh Pinia instance for testing
 */
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Mounts a component with a fresh Pinia instance
 */
export function mountWithPinia(component, options = {}) {
  const pinia = createTestPinia()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      ...options.global
    },
    ...options
  })
}

/**
 * Creates a mock store with default implementations
 */
export function createMockStore(storeName, initialState = {}) {
  return {
    $id: storeName,
    $state: { ...initialState },
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn(),
    $onAction: vi.fn()
  }
}
```

### Using Test Helpers

```js
// tests/Counter.helper.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'
import { mountWithPinia } from './helpers/pinia-test-utils'

describe('Counter Component (with helpers)', () => {
  let wrapper
  let store

  beforeEach(() => {
    wrapper = mountWithPinia(Counter)
    store = useCounterStore()
  })

  it('displays the current count', () => {
    expect(wrapper.get('[data-testid="count"]').text()).toBe('0')
  })

  it('increments count when increment button is clicked', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    expect(store.count).toBe(1)
  })
})
```

## Best Practices

### 1. Isolate Tests

Always create a fresh Pinia instance for each test:

```js
beforeEach(() => {
  setActivePinia(createPinia())
})
```

### 2. Test Behavior, Not Implementation

Focus on what the component does, not how it does it:

```js
// ✅ Good - tests behavior
it('displays user name when logged in', async () => {
  userStore.user = { name: 'John Doe' }
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('John Doe')
})

// ❌ Avoid - tests implementation details
it('calls useUserStore', () => {
  expect(useUserStore).toHaveBeenCalled()
})
```

### 3. Use Data Test IDs

Use `data-testid` attributes for reliable element selection:

```vue
<template>
  <button data-testid="submit-button" @click="submit">
    Submit
  </button>
</template>
```

```js
const submitButton = wrapper.get('[data-testid="submit-button"]')
```

### 4. Mock External Dependencies

Mock API calls and external services:

```js
// Mock fetch globally
global.fetch = vi.fn()

// Or mock specific modules
vi.mock('@/api/products', () => ({
  fetchProducts: vi.fn().mockResolvedValue([])
}))
```

### 5. Test Error States

Don't forget to test error scenarios:

```js
it('displays error message when fetch fails', async () => {
  store.fetchProducts = vi.fn().mockRejectedValue(new Error('Network error'))
  
  await wrapper.find('button').trigger('click')
  await wrapper.vm.$nextTick()
  
  expect(wrapper.find('.error').exists()).toBe(true)
})
```

## Common Patterns

### Testing Store Subscriptions

```js
it('reacts to store changes', async () => {
  const callback = vi.fn()
  store.$subscribe(callback)
  
  store.count = 5
  await wrapper.vm.$nextTick()
  
  expect(callback).toHaveBeenCalled()
  expect(wrapper.get('[data-testid="count"]').text()).toBe('5')
})
```

### Testing Store Actions with Side Effects

```js
it('updates UI after successful API call', async () => {
  const mockUser = { id: 1, name: 'John Doe' }
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockUser)
  })
  
  await store.fetchUser(1)
  await wrapper.vm.$nextTick()
  
  expect(wrapper.text()).toContain('John Doe')
  expect(store.user).toEqual(mockUser)
})
```

### Testing Computed Properties

```js
it('updates computed values when dependencies change', async () => {
  store.items = [
    { price: 10, quantity: 2 },
    { price: 20, quantity: 1 }
  ]
  
  await wrapper.vm.$nextTick()
  
  expect(wrapper.get('[data-testid="total"]').text()).toBe('40')
  
  store.items[0].quantity = 3
  await wrapper.vm.$nextTick()
  
  expect(wrapper.get('[data-testid="total"]').text()).toBe('50')
})
```

## Conclusion

Testing components with Pinia stores requires careful consideration of isolation, mocking strategies, and test organization. By following these patterns and best practices, you can create reliable, maintainable tests that give you confidence in your application's behavior.

Remember to:
- Always use fresh Pinia instances for each test
- Test behavior rather than implementation details
- Mock external dependencies appropriately
- Test both success and error scenarios
- Use helper functions to reduce boilerplate

For more testing strategies, see:
- [E2E Testing](./e2e-testing) - End-to-end testing with Pinia
- [Store Testing](../guide/testing) - Testing stores in isolation