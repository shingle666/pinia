---
title: Core Concepts - Pinia Guide
description: Learn the fundamental concepts of Pinia state management including stores, state, getters, and actions. Master the building blocks of Pinia.
keywords: Pinia, Vue.js, core concepts, stores, state, getters, actions, state management
author: Pinia Team
generator: VitePress
og:title: Core Concepts - Pinia Guide
og:description: Learn the fundamental concepts of Pinia state management including stores, state, getters, and actions. Master the building blocks of Pinia.
og:image: /og-image.svg
og:url: https://allfun.net/guide/core-concepts
twitter:card: summary_large_image
twitter:title: Core Concepts - Pinia Guide
twitter:description: Learn the fundamental concepts of Pinia state management including stores, state, getters, and actions. Master the building blocks of Pinia.
twitter:image: /og-image.svg
---

# Core Concepts

Pinia is built around four core concepts that work together to provide a powerful and intuitive state management solution. Understanding these concepts is essential for effectively using Pinia in your Vue.js applications.

## What is a Store?

A store is a reactive entity that holds state, getters, and actions. Think of it as a component that can be used anywhere in your application. Stores are defined using the `defineStore()` function and can be used in any component, composable, or even other stores.

```js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

### Store Naming

The first argument to `defineStore()` is a unique identifier for the store. This ID is used by Pinia to connect the store to the devtools and for server-side rendering.

```js
// ✅ Good naming conventions
const useUserStore = defineStore('user', { /* ... */ })
const useCartStore = defineStore('cart', { /* ... */ })
const useProductStore = defineStore('product', { /* ... */ })

// ❌ Avoid generic names
const useStore = defineStore('store', { /* ... */ })
const useDataStore = defineStore('data', { /* ... */ })
```

## State

State is the central part of your store. It represents the reactive data that your application needs to manage. In Pinia, state is defined as a function that returns an object.

### Defining State

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    // User information
    user: null,
    isAuthenticated: false,
    
    // UI state
    isLoading: false,
    error: null,
    
    // Application data
    preferences: {
      theme: 'light',
      language: 'en'
    },
    
    // Collections
    notifications: [],
    recentActivity: []
  })
})
```

### Accessing State

State can be accessed directly from the store instance:

```js
// In a component
const userStore = useUserStore()

// Direct access
console.log(userStore.user)
console.log(userStore.isAuthenticated)

// Reactive access in template
// <template>
//   <div v-if="userStore.isAuthenticated">
//     Welcome, {{ userStore.user.name }}!
//   </div>
// </template>
```

### Mutating State

State can be mutated directly:

```js
const userStore = useUserStore()

// Direct mutation
userStore.isLoading = true
userStore.user = { name: 'John', email: 'john@example.com' }

// Mutating nested objects
userStore.preferences.theme = 'dark'
userStore.notifications.push({ id: 1, message: 'Welcome!' })
```

### Resetting State

You can reset the state to its initial value:

```js
const userStore = useUserStore()

// Reset the entire store
userStore.$reset()
```

## Getters

Getters are computed properties for your store. They allow you to derive state and cache the results. Getters receive the state as their first argument and can access other getters.

### Basic Getters

```js
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    tax: 0.1
  }),
  getters: {
    // Simple getter
    itemCount: (state) => state.items.length,
    
    // Getter with calculation
    subtotal: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    },
    
    // Getter accessing other getters
    total() {
      return this.subtotal * (1 + this.tax)
    },
    
    // Getter with type annotation (TypeScript)
    expensiveItems: (state): CartItem[] => {
      return state.items.filter(item => item.price > 100)
    }
  }
})
```

### Getters with Parameters

Getters can return functions to accept parameters:

```js
export const useProductStore = defineStore('product', {
  state: () => ({
    products: []
  }),
  getters: {
    getProductById: (state) => {
      return (productId) => {
        return state.products.find(product => product.id === productId)
      }
    },
    
    getProductsByCategory: (state) => {
      return (category) => {
        return state.products.filter(product => product.category === category)
      }
    },
    
    searchProducts: (state) => {
      return (query) => {
        return state.products.filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase())
        )
      }
    }
  }
})

// Usage
const productStore = useProductStore()
const product = productStore.getProductById('123')
const electronics = productStore.getProductsByCategory('electronics')
const searchResults = productStore.searchProducts('laptop')
```

### Accessing Other Stores in Getters

```js
export const useCartStore = defineStore('cart', {
  getters: {
    cartSummary() {
      const userStore = useUserStore()
      const productStore = useProductStore()
      
      return {
        items: this.items.map(item => ({
          ...item,
          product: productStore.getProductById(item.productId)
        })),
        user: userStore.user,
        total: this.total
      }
    }
  }
})
```

## Actions

Actions are methods that can contain arbitrary logic, including asynchronous operations. They are the equivalent of methods in components and are where you should place business logic.

### Synchronous Actions

```js
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
    },
    
    incrementBy(amount) {
      this.count += amount
    },
    
    reset() {
      this.count = 0
    }
  }
})
```

### Asynchronous Actions

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isLoading: false,
    error: null
  }),
  actions: {
    async fetchUser(userId) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }
        this.user = await response.json()
      } catch (error) {
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },
    
    async updateUser(userData) {
      this.isLoading = true
      
      try {
        const response = await fetch(`/api/users/${this.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to update user')
        }
        
        this.user = await response.json()
      } catch (error) {
        this.error = error.message
        throw error // Re-throw to allow component to handle
      } finally {
        this.isLoading = false
      }
    }
  }
})
```

### Actions Calling Other Actions

```js
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null
  }),
  actions: {
    async login(credentials) {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      this.token = data.token
      
      // Call another action
      await this.fetchUserProfile()
    },
    
    async fetchUserProfile() {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })
      
      this.user = await response.json()
    },
    
    logout() {
      this.token = null
      this.user = null
      
      // Call action from another store
      const cartStore = useCartStore()
      cartStore.clearCart()
    }
  }
})
```

## Store Composition

Stores can use other stores, enabling powerful composition patterns:

```js
// User store
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    preferences: {}
  }),
  actions: {
    async fetchUser(id) {
      // Fetch user logic
    }
  }
})

// Cart store that uses user store
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  getters: {
    cartWithUserInfo() {
      const userStore = useUserStore()
      return {
        items: this.items,
        user: userStore.user,
        appliedDiscounts: this.calculateDiscounts(userStore.user)
      }
    }
  },
  actions: {
    calculateDiscounts(user) {
      // Calculate discounts based on user data
      if (user?.isPremium) {
        return 0.1 // 10% discount for premium users
      }
      return 0
    },
    
    async checkout() {
      const userStore = useUserStore()
      
      if (!userStore.user) {
        throw new Error('User must be logged in to checkout')
      }
      
      // Checkout logic
    }
  }
})
```

## Using Stores in Components

### Options API

```js
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment', 'incrementBy'])
  }
}
```

### Composition API

```js
import { useCounterStore } from '@/stores/counter'

export default {
  setup() {
    const counterStore = useCounterStore()
    
    return {
      // Direct access
      counterStore,
      
      // Destructured (loses reactivity)
      // count: counterStore.count,
      
      // Use storeToRefs for reactive destructuring
      ...storeToRefs(counterStore)
    }
  }
}
```

### Script Setup

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, incrementBy } = counterStore
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+1</button>
    <button @click="incrementBy(5)">+5</button>
  </div>
</template>
```

## Best Practices

### 1. Keep Stores Focused

Each store should have a single responsibility:

```js
// ✅ Good - focused stores
const useUserStore = defineStore('user', { /* user-related state */ })
const useCartStore = defineStore('cart', { /* cart-related state */ })
const useProductStore = defineStore('product', { /* product-related state */ })

// ❌ Avoid - monolithic store
const useAppStore = defineStore('app', {
  state: () => ({
    user: {},
    cart: {},
    products: {},
    ui: {},
    // ... everything
  })
})
```

### 2. Use Actions for Business Logic

```js
// ✅ Good - business logic in actions
actions: {
  async addToCart(product, quantity = 1) {
    // Validation
    if (quantity <= 0) {
      throw new Error('Quantity must be positive')
    }
    
    // Check inventory
    const productStore = useProductStore()
    if (!productStore.isInStock(product.id, quantity)) {
      throw new Error('Insufficient inventory')
    }
    
    // Add to cart
    const existingItem = this.items.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      this.items.push({ ...product, quantity })
    }
    
    // Update inventory
    productStore.decreaseStock(product.id, quantity)
  }
}

// ❌ Avoid - business logic in components
// Component should just call the action
```

### 3. Use Getters for Computed Values

```js
// ✅ Good - computed values as getters
getters: {
  totalPrice: (state) => {
    return state.items.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  },
  
  formattedTotal() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this.totalPrice)
  }
}

// ❌ Avoid - computing in components repeatedly
```

### 4. Handle Errors Gracefully

```js
actions: {
  async fetchData() {
    this.isLoading = true
    this.error = null
    
    try {
      const data = await api.fetchData()
      this.data = data
    } catch (error) {
      this.error = error.message
      console.error('Failed to fetch data:', error)
    } finally {
      this.isLoading = false
    }
  }
}
```

## Next Steps

Now that you understand the core concepts, explore:

- [State Management](./state) - Advanced state management patterns
- [TypeScript](./typescript) - Using Pinia with TypeScript
- [Plugins](./plugins) - Extending Pinia with custom functionality
- [Testing](./testing) - Testing your stores effectively