---
title: TypeScript - Pinia Guide
description: Learn how to use Pinia with TypeScript for type-safe state management. Discover store typing, type inference, and advanced TypeScript patterns.
keywords: Pinia, Vue.js, TypeScript, type safety, store typing, type inference
author: Pinia Team
generator: VitePress
og:title: TypeScript - Pinia Guide
og:description: Learn how to use Pinia with TypeScript for type-safe state management. Discover store typing, type inference, and advanced TypeScript patterns.
og:image: /og-image.svg
og:url: https://allfun.net/guide/typescript
twitter:card: summary_large_image
twitter:title: TypeScript - Pinia Guide
twitter:description: Learn how to use Pinia with TypeScript for type-safe state management. Discover store typing, type inference, and advanced TypeScript patterns.
twitter:image: /og-image.svg
---

# TypeScript

Pinia provides first-class TypeScript support out of the box. This guide covers how to leverage TypeScript with Pinia for type-safe state management.

## Basic Setup

Pinia is written in TypeScript and provides excellent type inference without additional configuration:

```ts
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
    }
  }
})
```

## Type Inference

Pinia automatically infers types for your stores:

```ts
const store = useCounterStore()

// TypeScript knows these types:
store.count // number
store.name // string
store.doubleCount // number (getter)
store.increment() // void (action)
```

## Typing State

### Basic State Types

```ts
interface UserInfo {
  name: string
  email: string
  age?: number
}

export const useUserStore = defineStore('user', {
  state: (): { user: UserInfo | null; isLoading: boolean } => ({
    user: null,
    isLoading: false
  })
})
```

### Complex State Types

```ts
interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  discountCode?: string
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    total: 0,
    discountCode: undefined
  })
})
```

## Typing Getters

Getters are automatically typed based on their return values:

```ts
export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    total: 0
  }),
  getters: {
    // Automatically inferred as number
    itemCount: (state) => state.items.length,
    
    // Explicitly typed getter
    expensiveItems: (state): CartItem[] => {
      return state.items.filter(item => item.price > 100)
    },
    
    // Getter with parameter (returns a function)
    getItemById: (state) => {
      return (id: string): CartItem | undefined => {
        return state.items.find(item => item.id === id)
      }
    }
  }
})
```

## Typing Actions

Actions are automatically typed based on their parameters and return values:

```ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as UserInfo | null,
    isLoading: false
  }),
  actions: {
    // Async action with typed parameters
    async fetchUser(userId: string): Promise<UserInfo> {
      this.isLoading = true
      try {
        const response = await fetch(`/api/users/${userId}`)
        const user = await response.json() as UserInfo
        this.user = user
        return user
      } finally {
        this.isLoading = false
      }
    },
    
    // Action with typed parameters
    updateUser(updates: Partial<UserInfo>): void {
      if (this.user) {
        this.user = { ...this.user, ...updates }
      }
    }
  }
})
```

## Composition API Stores

With the Composition API, TypeScript inference works seamlessly:

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface Todo {
  id: string
  text: string
  completed: boolean
}

export const useTodoStore = defineStore('todo', () => {
  // State
  const todos = ref<Todo[]>([])
  const filter = ref<'all' | 'active' | 'completed'>('all')
  
  // Getters
  const filteredTodos = computed(() => {
    switch (filter.value) {
      case 'active':
        return todos.value.filter(todo => !todo.completed)
      case 'completed':
        return todos.value.filter(todo => todo.completed)
      default:
        return todos.value
    }
  })
  
  const completedCount = computed(() => 
    todos.value.filter(todo => todo.completed).length
  )
  
  // Actions
  function addTodo(text: string): void {
    todos.value.push({
      id: Date.now().toString(),
      text,
      completed: false
    })
  }
  
  function toggleTodo(id: string): void {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }
  
  function removeTodo(id: string): void {
    const index = todos.value.findIndex(t => t.id === id)
    if (index > -1) {
      todos.value.splice(index, 1)
    }
  }
  
  return {
    // State
    todos,
    filter,
    // Getters
    filteredTodos,
    completedCount,
    // Actions
    addTodo,
    toggleTodo,
    removeTodo
  }
})
```

## Store Type Utilities

Pinia provides utility types for extracting store types:

```ts
import type { Store } from 'pinia'

// Extract the store type
type CounterStore = ReturnType<typeof useCounterStore>

// Or use the Store utility type
type CounterStoreType = Store<
  'counter',
  { count: number; name: string },
  { doubleCount: number },
  { increment(): void }
>
```

## Typing Plugins

When creating plugins, you can type the context:

```ts
import type { PiniaPluginContext } from 'pinia'

function myPlugin(context: PiniaPluginContext) {
  const { store, app, pinia, options } = context
  
  // Add typed properties to stores
  store.$customProperty = 'Hello'
}

// Extend the PiniaCustomProperties interface
declare module 'pinia' {
  export interface PiniaCustomProperties {
    $customProperty: string
  }
}
```

## Advanced Typing Patterns

### Generic Stores

```ts
function createResourceStore<T>(name: string) {
  return defineStore(name, {
    state: () => ({
      items: [] as T[],
      loading: false,
      error: null as string | null
    }),
    actions: {
      async fetchItems(): Promise<T[]> {
        this.loading = true
        this.error = null
        try {
          const response = await fetch(`/api/${name}`)
          const items = await response.json() as T[]
          this.items = items
          return items
        } catch (error) {
          this.error = error instanceof Error ? error.message : 'Unknown error'
          throw error
        } finally {
          this.loading = false
        }
      }
    }
  })
}

// Usage
interface User {
  id: string
  name: string
  email: string
}

const useUserStore = createResourceStore<User>('users')
```

### Strict State Types

```ts
// Define strict interfaces
interface StrictUserState {
  readonly id: string | null
  readonly profile: UserProfile | null
  readonly preferences: UserPreferences
  readonly lastLoginAt: Date | null
}

interface UserProfile {
  readonly name: string
  readonly email: string
  readonly avatar?: string
}

interface UserPreferences {
  readonly theme: 'light' | 'dark'
  readonly language: 'en' | 'es' | 'fr'
  readonly notifications: boolean
}

export const useUserStore = defineStore('user', {
  state: (): StrictUserState => ({
    id: null,
    profile: null,
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    },
    lastLoginAt: null
  })
})
```

### Typed Store Composition

```ts
// Base store interface
interface BaseStore {
  loading: boolean
  error: string | null
}

// Mixin for loading states
function withLoading<T extends Record<string, any>>(store: T) {
  return {
    ...store,
    loading: false,
    error: null as string | null,
    
    setLoading(loading: boolean) {
      this.loading = loading
    },
    
    setError(error: string | null) {
      this.error = error
    }
  }
}

// Usage
export const useApiStore = defineStore('api', () => {
  const baseStore = withLoading({
    data: ref<any[]>([]),
    
    async fetchData() {
      this.setLoading(true)
      this.setError(null)
      try {
        // Fetch logic
      } catch (error) {
        this.setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        this.setLoading(false)
      }
    }
  })
  
  return baseStore
})
```

## Best Practices

### 1. Define Interfaces

Always define interfaces for complex state:

```ts
// ✅ Good
interface UserState {
  user: User | null
  isAuthenticated: boolean
}

// ❌ Avoid
const state = {
  user: null,
  isAuthenticated: false
}
```

### 2. Use Type Assertions Carefully

```ts
// ✅ Good - with validation
async fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()
  
  // Validate the data structure
  if (isValidUser(data)) {
    this.user = data as User
  } else {
    throw new Error('Invalid user data')
  }
}

// ❌ Avoid - blind assertion
async fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`)
  this.user = await response.json() as User
}
```

### 3. Leverage Type Guards

```ts
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string'
}

// Usage in actions
actions: {
  setUser(userData: unknown) {
    if (isUser(userData)) {
      this.user = userData
    } else {
      throw new Error('Invalid user data')
    }
  }
}
```

### 4. Export Store Types

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  // ... store definition
})

// Export the store type for use in other files
export type UserStore = ReturnType<typeof useUserStore>
```

## Common TypeScript Issues

### Issue: State Type Inference

```ts
// ❌ Problem: TypeScript can't infer the correct type
state: () => ({
  user: null, // inferred as null, not User | null
  items: [] // inferred as never[], not Item[]
})

// ✅ Solution: Explicit typing
state: (): { user: User | null; items: Item[] } => ({
  user: null,
  items: []
})
```

### Issue: Getter Return Types

```ts
// ❌ Problem: Complex getter without explicit return type
getters: {
  complexCalculation(state) {
    // Complex logic that TypeScript can't infer
    return someComplexCalculation(state)
  }
}

// ✅ Solution: Explicit return type
getters: {
  complexCalculation(state): CalculationResult {
    return someComplexCalculation(state)
  }
}
```

## Next Steps

Now that you understand TypeScript with Pinia, explore:

- [Core Concepts](./core-concepts) - Understand Pinia's fundamental concepts
- [Plugins](./plugins) - Extend Pinia with custom functionality
- [Testing](./testing) - Test your typed stores effectively