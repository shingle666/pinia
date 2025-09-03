---
title: defineStore() API | Pinia Store Creation
description: Learn how to use defineStore() to create Pinia stores. Complete API reference with examples for Options API and Composition API styles.
keywords: defineStore, Pinia store creation, Vue state management, Pinia API, store definition, Options API, Composition API
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "defineStore() API | Pinia Store Creation" }]
  - ["meta", { property: "og:description", content: "Learn how to use defineStore() to create Pinia stores. Complete API reference with examples for Options API and Composition API styles." }]
  - ["meta", { property: "og:url", content: "https://allfun.net/api/define-store" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "defineStore() API | Pinia Store Creation" }]
  - ["meta", { property: "twitter:description", content: "Learn how to use defineStore() to create Pinia stores. Complete API reference with examples for Options API and Composition API styles." }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/api/define-store" }]
---

# defineStore

`defineStore()` is the main function for creating stores in Pinia.

## Syntax

```js
defineStore(id, options)
defineStore(id, setupFunction)
defineStore(options)
```

## Parameters

### `id` (string)

A unique identifier for the store. This is used for:
- DevTools integration
- Server-side rendering
- Store registration

```js
defineStore('counter', { /* options */ })
```

### `options` (object)

Store configuration object with the following properties:

#### `state` (function)

A function that returns the initial state of the store.

```js
defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo'
  })
})
```

#### `getters` (object)

Computed properties for the store. Each getter receives the state as the first parameter.

```js
defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2,
    
    // Accessing other getters
    quadrupleCount() {
      return this.doubleCount * 2
    },
    
    // With TypeScript
    tripleCount: (state): number => state.count * 3
  }
})
```

#### `actions` (object)

Methods that can modify the state. They have access to the whole store instance via `this`.

```js
defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    },
    
    async fetchData() {
      const data = await api.getData()
      this.count = data.count
    },
    
    incrementBy(amount) {
      this.count += amount
    }
  }
})
```

### `setupFunction` (function)

A function that defines the store using the Composition API style.

```js
import { ref, computed } from 'vue'

defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Eduardo')
  
  // Getters
  const doubleCount = computed(() => count.value * 2)
  
  // Actions
  function increment() {
    count.value++
  }
  
  async function fetchData() {
    const data = await api.getData()
    count.value = data.count
  }
  
  return {
    count,
    name,
    doubleCount,
    increment,
    fetchData
  }
})
```

## Return Value

Returns a function that can be called to get the store instance.

```js
const useCounterStore = defineStore('counter', { /* options */ })

// In a component
const store = useCounterStore()
```

## Examples

### Basic Store

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

### Composition API Style

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, doubleCount, increment }
})
```

### With TypeScript

```ts
import { defineStore } from 'pinia'

interface State {
  count: number
  name: string
}

interface Getters {
  doubleCount: (state: State) => number
}

interface Actions {
  increment(): void
  setName(name: string): void
}

export const useCounterStore = defineStore<'counter', State, Getters, Actions>('counter', {
  state: (): State => ({
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
    
    setName(name: string) {
      this.name = name
    }
  }
})
```

### Advanced Example

```js
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.user,
    userName: (state) => state.user?.name || 'Guest',
    hasError: (state) => !!state.error
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const user = await api.login(credentials)
        this.user = user
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.user = null
      this.error = null
    },
    
    clearError() {
      this.error = null
    }
  }
})
```

## Best Practices

### 1. Use Descriptive IDs

```js
// ✅ Good
defineStore('userProfile', { /* ... */ })
defineStore('shoppingCart', { /* ... */ })

// ❌ Avoid
defineStore('store1', { /* ... */ })
defineStore('data', { /* ... */ })
```

### 2. Keep State Flat

```js
// ✅ Good
state: () => ({
  firstName: '',
  lastName: '',
  email: ''
})

// ❌ Avoid deep nesting
state: () => ({
  user: {
    profile: {
      personal: {
        firstName: '',
        lastName: ''
      }
    }
  }
})
```

### 3. Use Actions for State Mutations

```js
// ✅ Good
actions: {
  updateUser(userData) {
    this.firstName = userData.firstName
    this.lastName = userData.lastName
  }
}

// ❌ Avoid direct state mutation in components
// store.firstName = 'John' // Don't do this
```

### 4. Handle Async Operations Properly

```js
actions: {
  async fetchUser(id) {
    this.loading = true
    this.error = null
    
    try {
      const user = await api.getUser(id)
      this.user = user
    } catch (error) {
      this.error = error.message
    } finally {
      this.loading = false
    }
  }
}
```

## Common Patterns

### Loading States

```js
defineStore('data', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchItems() {
      this.loading = true
      this.error = null
      
      try {
        this.items = await api.getItems()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
```

### Computed Properties

```js
defineStore('todos', {
  state: () => ({
    todos: []
  }),
  
  getters: {
    completedTodos: (state) => state.todos.filter(todo => todo.completed),
    pendingTodos: (state) => state.todos.filter(todo => !todo.completed),
    todoCount: (state) => state.todos.length,
    completionRate() {
      return this.todoCount === 0 ? 0 : this.completedTodos.length / this.todoCount
    }
  }
})
```

### Form Handling

```js
defineStore('form', {
  state: () => ({
    formData: {
      name: '',
      email: '',
      message: ''
    },
    errors: {},
    submitting: false
  }),
  
  actions: {
    updateField(field, value) {
      this.formData[field] = value
      // Clear error when user starts typing
      if (this.errors[field]) {
        delete this.errors[field]
      }
    },
    
    async submitForm() {
      this.submitting = true
      this.errors = {}
      
      try {
        await api.submitForm(this.formData)
        this.resetForm()
      } catch (error) {
        this.errors = error.validationErrors || {}
      } finally {
        this.submitting = false
      }
    },
    
    resetForm() {
      this.formData = { name: '', email: '', message: '' }
      this.errors = {}
    }
  }
})
```

## See Also

- [Store Instance](./store-instance)
- [State Management Guide](../guide/state)
- [Getters Guide](../guide/getters)
- [Actions Guide](../guide/actions)