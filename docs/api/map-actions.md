---
title: mapActions() - Pinia API
description: Complete API reference for the mapActions function. Learn how to map store actions in Options API components.
keywords: Pinia, Vue.js, mapActions, Options API, action mapping, API reference
author: Pinia Team
generator: VitePress
og:title: mapActions() - Pinia API
og:description: Complete API reference for the mapActions function. Learn how to map store actions in Options API components.
og:image: /og-image.svg
og:url: https://allfun.net/api/map-actions
twitter:card: summary_large_image
twitter:title: mapActions() - Pinia API
twitter:description: Complete API reference for the mapActions function. Learn how to map store actions in Options API components.
twitter:image: /og-image.svg
---

# mapActions()

Maps store actions to component methods in Options API components. This allows you to call store actions directly as component methods.

## Function Signature

```ts
function mapActions<T>(
  useStore: () => T,
  keys: (keyof T)[] | Record<string, keyof T>
): Record<string, Function>
```

## Parameters

- **useStore**: The store definition function
- **keys**: Array of action names or custom mapping object

## Returns

An object of methods that can be spread into the component's `methods` option.

## Basic Usage

### Array Syntax

```js
import { mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  methods: {
    // Map this.increment, this.decrement, this.reset
    ...mapActions(useCounterStore, ['increment', 'decrement', 'reset'])
  },
  
  template: `
    <div>
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
      <button @click="reset">Reset</button>
    </div>
  `
}
```

### Object Syntax

```js
import { mapActions } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  methods: {
    // Custom method names
    ...mapActions(useUserStore, {
      signIn: 'login',
      signOut: 'logout',
      updateProfile: 'updateUser'
    })
  },
  
  async mounted() {
    // Use the mapped actions
    await this.signIn({ email: 'user@example.com', password: 'password' })
  },
  
  template: `
    <div>
      <button @click="signOut">Sign Out</button>
      <button @click="updateProfile({ name: 'New Name' })">Update</button>
    </div>
  `
}
```

## Action Parameters

### Single Parameter Actions

```js
// Store definition
export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: []
  }),
  
  actions: {
    addTask(task) {
      this.tasks.push({
        id: Date.now(),
        ...task,
        completed: false
      })
    },
    
    removeTask(taskId) {
      const index = this.tasks.findIndex(task => task.id === taskId)
      if (index > -1) {
        this.tasks.splice(index, 1)
      }
    },
    
    toggleTask(taskId) {
      const task = this.tasks.find(task => task.id === taskId)
      if (task) {
        task.completed = !task.completed
      }
    }
  }
})

// Component
export default {
  methods: {
    ...mapActions(useTaskStore, [
      'addTask',
      'removeTask', 
      'toggleTask'
    ]),
    
    handleAddTask() {
      this.addTask({
        title: this.newTaskTitle,
        description: this.newTaskDescription
      })
      this.newTaskTitle = ''
      this.newTaskDescription = ''
    }
  },
  
  template: `
    <div>
      <form @submit.prevent="handleAddTask">
        <input v-model="newTaskTitle" placeholder="Task title">
        <textarea v-model="newTaskDescription" placeholder="Description"></textarea>
        <button type="submit">Add Task</button>
      </form>
      
      <ul>
        <li v-for="task in tasks" :key="task.id">
          <span @click="toggleTask(task.id)">{{ task.title }}</span>
          <button @click="removeTask(task.id)">Delete</button>
        </li>
      </ul>
    </div>
  `
}
```

### Multiple Parameter Actions

```js
// Store definition
export const useApiStore = defineStore('api', {
  state: () => ({
    loading: false,
    data: null,
    error: null
  }),
  
  actions: {
    async fetchData(endpoint, options = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        this.data = await response.json()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async postData(endpoint, data, options = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: JSON.stringify(data),
          ...options
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        return await response.json()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})

// Component
export default {
  methods: {
    ...mapActions(useApiStore, ['fetchData', 'postData']),
    
    async loadUserData() {
      await this.fetchData('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      })
    },
    
    async saveUserProfile() {
      try {
        await this.postData('/api/users/profile', {
          name: this.profileName,
          email: this.profileEmail
        }, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        })
        
        this.$toast.success('Profile saved successfully!')
      } catch (error) {
        this.$toast.error('Failed to save profile')
      }
    }
  }
}
```

## Async Actions

### Promise-based Actions

```js
// Store definition
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false
  }),
  
  actions: {
    async login(credentials) {
      this.loading = true
      
      try {
        const response = await authApi.login(credentials)
        this.user = response.user
        this.token = response.token
        
        // Store token in localStorage
        localStorage.setItem('auth_token', response.token)
        
        return response
      } catch (error) {
        throw new Error('Login failed: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      this.loading = true
      
      try {
        await authApi.logout()
      } catch (error) {
        console.warn('Logout API call failed:', error)
      } finally {
        this.user = null
        this.token = null
        this.loading = false
        localStorage.removeItem('auth_token')
      }
    },
    
    async refreshToken() {
      try {
        const response = await authApi.refreshToken(this.token)
        this.token = response.token
        localStorage.setItem('auth_token', response.token)
        return response
      } catch (error) {
        // Token refresh failed, logout user
        await this.logout()
        throw error
      }
    }
  }
})

// Component
export default {
  data() {
    return {
      email: '',
      password: '',
      loginError: null
    }
  },
  
  methods: {
    ...mapActions(useAuthStore, ['login', 'logout']),
    
    async handleLogin() {
      this.loginError = null
      
      try {
        await this.login({
          email: this.email,
          password: this.password
        })
        
        // Redirect to dashboard
        this.$router.push('/dashboard')
      } catch (error) {
        this.loginError = error.message
      }
    },
    
    async handleLogout() {
      try {
        await this.logout()
        this.$router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
        // Force logout even if API call fails
        this.$router.push('/login')
      }
    }
  },
  
  template: `
    <form @submit.prevent="handleLogin">
      <div v-if="loginError" class="error">
        {{ loginError }}
      </div>
      
      <input 
        v-model="email" 
        type="email" 
        placeholder="Email"
        required
      >
      
      <input 
        v-model="password" 
        type="password" 
        placeholder="Password"
        required
      >
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
      
      <button type="button" @click="handleLogout">
        Sign Out
      </button>
    </form>
  `
}
```

## Advanced Usage

### Conditional Action Mapping

```js
import { mapActions } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    isAdmin() {
      const userStore = useUserStore()
      return userStore.user?.role === 'admin'
    }
  },
  
  methods: {
    // Always available actions
    ...mapActions(useUserStore, ['updateProfile', 'changePassword']),
    
    // Conditionally map admin actions
    ...(process.env.NODE_ENV === 'development' || true ? 
      mapActions(useAdminStore, ['deleteUser', 'banUser', 'promoteUser']) : 
      {}
    ),
    
    // Wrapper methods for conditional access
    async deleteUserSafely(userId) {
      if (!this.isAdmin) {
        throw new Error('Insufficient permissions')
      }
      return await this.deleteUser(userId)
    }
  }
}
```

### Multiple Store Actions

```js
import { mapActions } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'
import { useUserStore } from '@/stores/user'

export default {
  methods: {
    // Cart actions
    ...mapActions(useCartStore, {
      addToCart: 'addItem',
      removeFromCart: 'removeItem',
      clearCart: 'clear'
    }),
    
    // Product actions
    ...mapActions(useProductStore, {
      loadProducts: 'fetchProducts',
      searchProducts: 'search'
    }),
    
    // User actions
    ...mapActions(useUserStore, {
      saveWishlist: 'updateWishlist'
    }),
    
    // Combined workflow methods
    async addProductToCartAndWishlist(product) {
      // Add to cart
      await this.addToCart(product)
      
      // Add to wishlist
      const userStore = useUserStore()
      const currentWishlist = userStore.wishlist || []
      await this.saveWishlist([...currentWishlist, product.id])
      
      this.$toast.success('Added to cart and wishlist!')
    },
    
    async quickPurchase(product) {
      // Clear cart first
      this.clearCart()
      
      // Add single product
      await this.addToCart(product)
      
      // Navigate to checkout
      this.$router.push('/checkout')
    }
  }
}
```

### Action Composition

```js
import { mapActions } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import { useAnalyticsStore } from '@/stores/analytics'
import { useTaskStore } from '@/stores/task'

export default {
  methods: {
    ...mapActions(useTaskStore, ['addTask', 'updateTask', 'deleteTask']),
    ...mapActions(useNotificationStore, ['showNotification']),
    ...mapActions(useAnalyticsStore, ['trackEvent']),
    
    // Composed action with multiple store interactions
    async createTaskWithNotification(taskData) {
      try {
        // Create the task
        const task = await this.addTask(taskData)
        
        // Show success notification
        this.showNotification({
          type: 'success',
          message: `Task "${task.title}" created successfully!`,
          duration: 3000
        })
        
        // Track analytics event
        this.trackEvent('task_created', {
          task_id: task.id,
          task_category: task.category,
          user_id: this.currentUser.id
        })
        
        return task
      } catch (error) {
        // Show error notification
        this.showNotification({
          type: 'error',
          message: 'Failed to create task. Please try again.',
          duration: 5000
        })
        
        // Track error event
        this.trackEvent('task_creation_failed', {
          error: error.message,
          user_id: this.currentUser.id
        })
        
        throw error
      }
    }
  }
}
```

## TypeScript

### Type-safe Action Mapping

```ts
import { mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import type { ComponentOptions } from 'vue'

interface ComponentMethods {
  increment(): void
  decrement(): void
  incrementBy(amount: number): void
}

export default defineComponent({
  methods: {
    ...mapActions(useCounterStore, [
      'increment',
      'decrement',
      'incrementBy'
    ])
  } as ComponentMethods
})
```

### Generic Action Mapper

```ts
function createActionMapper<
  T extends Record<string, (...args: any[]) => any>,
  K extends keyof T
>(
  useStore: () => T,
  keys: K[]
): Pick<T, K> {
  return mapActions(useStore, keys)
}

// Usage
const userActions = createActionMapper(
  useUserStore,
  ['login', 'logout', 'updateProfile']
)

export default {
  methods: {
    ...userActions
  }
}
```

### Async Action Types

```ts
interface AsyncActionMethods {
  login(credentials: LoginCredentials): Promise<User>
  logout(): Promise<void>
  fetchUserData(userId: string): Promise<UserData>
}

export default defineComponent({
  methods: {
    ...mapActions(useAuthStore, [
      'login',
      'logout', 
      'fetchUserData'
    ]) as AsyncActionMethods,
    
    async handleLogin() {
      try {
        const user = await this.login({
          email: this.email,
          password: this.password
        })
        
        console.log('Logged in user:', user)
      } catch (error) {
        console.error('Login failed:', error)
      }
    }
  }
})
```

## Performance Considerations

### Selective Action Mapping

```js
// ✅ Good - Only map actions you actually use
methods: {
  ...mapActions(useUserStore, [
    'login',    // Used in this component
    'logout'    // Used in this component
  ])
  // Don't map 'updateProfile', 'deleteAccount', etc. if not used
}

// ❌ Less efficient - Mapping all actions
methods: {
  ...mapActions(useUserStore, [
    'login', 'logout', 'updateProfile', 'deleteAccount',
    'changePassword', 'updatePreferences', 'exportData'
  ])
}
```

### Lazy Action Loading

```js
export default {
  methods: {
    // Core actions mapped immediately
    ...mapActions(useUserStore, ['login', 'logout']),
    
    // Heavy actions loaded on demand
    async exportUserData() {
      const { exportData } = mapActions(useUserStore, ['exportData'])
      return await exportData.call(this)
    },
    
    async generateReport() {
      // Dynamically import heavy store
      const { useReportStore } = await import('@/stores/report')
      const { generateReport } = mapActions(useReportStore, ['generateReport'])
      return await generateReport.call(this)
    }
  }
}
```

## Common Patterns

### Form Submission

```js
import { mapActions } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  data() {
    return {
      formData: {
        name: '',
        email: '',
        message: ''
      },
      submitting: false
    }
  },
  
  methods: {
    ...mapActions(useFormStore, ['submitForm', 'validateForm']),
    
    async handleSubmit() {
      this.submitting = true
      
      try {
        // Validate form
        const isValid = await this.validateForm(this.formData)
        if (!isValid) {
          return
        }
        
        // Submit form
        await this.submitForm(this.formData)
        
        // Reset form
        this.formData = { name: '', email: '', message: '' }
        
        this.$toast.success('Form submitted successfully!')
      } catch (error) {
        this.$toast.error('Submission failed: ' + error.message)
      } finally {
        this.submitting = false
      }
    }
  },
  
  template: `
    <form @submit.prevent="handleSubmit">
      <input v-model="formData.name" placeholder="Name" required>
      <input v-model="formData.email" type="email" placeholder="Email" required>
      <textarea v-model="formData.message" placeholder="Message" required></textarea>
      
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
  `
}
```

### CRUD Operations

```js
import { mapActions } from 'pinia'
import { useItemStore } from '@/stores/item'

export default {
  methods: {
    ...mapActions(useItemStore, [
      'createItem',
      'updateItem',
      'deleteItem',
      'fetchItems'
    ]),
    
    async handleCreate(itemData) {
      try {
        await this.createItem(itemData)
        await this.fetchItems() // Refresh list
        this.$toast.success('Item created!')
      } catch (error) {
        this.$toast.error('Failed to create item')
      }
    },
    
    async handleUpdate(itemId, updates) {
      try {
        await this.updateItem(itemId, updates)
        this.$toast.success('Item updated!')
      } catch (error) {
        this.$toast.error('Failed to update item')
      }
    },
    
    async handleDelete(itemId) {
      if (!confirm('Are you sure you want to delete this item?')) {
        return
      }
      
      try {
        await this.deleteItem(itemId)
        this.$toast.success('Item deleted!')
      } catch (error) {
        this.$toast.error('Failed to delete item')
      }
    }
  }
}
```

### Batch Operations

```js
import { mapActions } from 'pinia'
import { useTaskStore } from '@/stores/task'

export default {
  data() {
    return {
      selectedTasks: []
    }
  },
  
  methods: {
    ...mapActions(useTaskStore, [
      'deleteTask',
      'updateTask',
      'batchUpdate'
    ]),
    
    async deleteSelectedTasks() {
      if (this.selectedTasks.length === 0) {
        this.$toast.warning('No tasks selected')
        return
      }
      
      const confirmed = confirm(
        `Delete ${this.selectedTasks.length} selected tasks?`
      )
      
      if (!confirmed) return
      
      try {
        // Delete tasks in parallel
        await Promise.all(
          this.selectedTasks.map(taskId => this.deleteTask(taskId))
        )
        
        this.selectedTasks = []
        this.$toast.success('Selected tasks deleted!')
      } catch (error) {
        this.$toast.error('Failed to delete some tasks')
      }
    },
    
    async markSelectedAsCompleted() {
      if (this.selectedTasks.length === 0) return
      
      try {
        await this.batchUpdate(
          this.selectedTasks,
          { completed: true }
        )
        
        this.selectedTasks = []
        this.$toast.success('Tasks marked as completed!')
      } catch (error) {
        this.$toast.error('Failed to update tasks')
      }
    }
  }
}
```

## Best Practices

### 1. Use Descriptive Method Names

```js
// ✅ Good - Clear method names
methods: {
  ...mapActions(useAuthStore, {
    signIn: 'login',
    signOut: 'logout',
    registerUser: 'register'
  })
}

// ❌ Confusing - Generic names
methods: {
  ...mapActions(useAuthStore, {
    action1: 'login',
    action2: 'logout',
    action3: 'register'
  })
}
```

### 2. Group Related Actions

```js
// ✅ Good - Logical grouping
methods: {
  // Authentication actions
  ...mapActions(useAuthStore, ['login', 'logout', 'register']),
  
  // User profile actions
  ...mapActions(useUserStore, ['updateProfile', 'uploadAvatar']),
  
  // Notification actions
  ...mapActions(useNotificationStore, ['showNotification'])
}
```

### 3. Handle Errors Appropriately

```js
methods: {
  ...mapActions(useApiStore, ['fetchData']),
  
  async loadData() {
    try {
      await this.fetchData('/api/data')
    } catch (error) {
      // Handle specific error types
      if (error.status === 401) {
        this.$router.push('/login')
      } else if (error.status === 403) {
        this.$toast.error('Access denied')
      } else {
        this.$toast.error('Failed to load data')
      }
    }
  }
}
```

### 4. Combine with Other Options API Features

```js
export default {
  computed: {
    ...mapState(useUserStore, ['user', 'loading'])
  },
  
  methods: {
    ...mapActions(useUserStore, ['updateUser']),
    
    async saveProfile() {
      if (this.loading) return
      
      await this.updateUser({
        name: this.user.name,
        email: this.user.email
      })
    }
  },
  
  watch: {
    'user.email'(newEmail) {
      // Validate email when it changes
      this.validateEmail(newEmail)
    }
  }
}
```

## Migration from Vuex

### Vuex Actions

```js
// Vuex
methods: {
  ...mapActions([
    'increment',
    'decrement',
    'incrementBy'
  ]),
  
  // Or with namespace
  ...mapActions('counter', [
    'increment',
    'decrement'
  ])
}

// Pinia
methods: {
  ...mapActions(useCounterStore, [
    'increment',
    'decrement',
    'incrementBy'
  ])
}
```

### Vuex Action with Payload

```js
// Vuex
methods: {
  async addTodo() {
    await this.$store.dispatch('todos/addTodo', {
      text: this.newTodoText,
      category: this.selectedCategory
    })
  }
}

// Pinia
methods: {
  ...mapActions(useTodoStore, ['addTodo']),
  
  async addTodo() {
    await this.addTodo({
      text: this.newTodoText,
      category: this.selectedCategory
    })
  }
}
```

## Related Links

- [mapState()](./map-state) - Map store state to computed properties
- [mapWritableState()](./map-writable-state) - Map writable store state
- [mapStores()](./map-stores) - Map entire stores
- [Store Instance](./store-instance) - Store instance API
- [Options API Guide](../guide/options-api) - Using Pinia with Options API