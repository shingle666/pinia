---
title: Migration from Vuex - Pinia Guide
description: Complete guide for migrating from Vuex to Pinia with step-by-step instructions, code examples, and best practices.
keywords: Pinia, Vuex, migration, Vue.js, state management, upgrade guide
author: Pinia Team
generator: VitePress
og:title: Migration from Vuex - Pinia Guide
og:description: Complete guide for migrating from Vuex to Pinia with step-by-step instructions, code examples, and best practices.
og:image: /og-image.svg
og:url: https://allfun.net/guide/migration-from-vuex
twitter:card: summary_large_image
twitter:title: Migration from Vuex - Pinia Guide
twitter:description: Complete guide for migrating from Vuex to Pinia with step-by-step instructions, code examples, and best practices.
twitter:image: /og-image.svg
---

# Migration from Vuex

This guide will help you migrate your existing Vuex store to Pinia. We'll cover the differences between the two libraries, provide step-by-step migration instructions, and show you how to take advantage of Pinia's improved features.

## Why Migrate to Pinia?

Pinia offers several advantages over Vuex:

- **Better TypeScript support**: Full type safety without complex type gymnastics
- **Simpler API**: No mutations, less boilerplate code
- **Modular by design**: Each store is independent
- **DevTools support**: Enhanced debugging experience
- **Tree-shaking**: Better bundle optimization
- **Server-side rendering**: Built-in SSR support
- **Hot module replacement**: Better development experience

## Key Differences

### Store Structure

**Vuex:**
```js
// store/index.js
import { createStore } from 'vuex'
import user from './modules/user'
import cart from './modules/cart'

export default createStore({
  modules: {
    user,
    cart
  }
})
```

**Pinia:**
```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  // store definition
})

// stores/cart.ts
export const useCartStore = defineStore('cart', {
  // store definition
})
```

### State Management

**Vuex:**
```js
// Mutations required for state changes
const mutations = {
  SET_USER(state, user) {
    state.user = user
  },
  INCREMENT_COUNT(state) {
    state.count++
  }
}

const actions = {
  async fetchUser({ commit }, id) {
    const user = await api.getUser(id)
    commit('SET_USER', user)
  }
}
```

**Pinia:**
```ts
// Direct state mutations in actions
const actions = {
  async fetchUser(id: number) {
    const user = await api.getUser(id)
    this.user = user // Direct mutation
  },
  
  increment() {
    this.count++ // Direct mutation
  }
}
```

## Migration Steps

### Step 1: Install Pinia

```bash
npm uninstall vuex
npm install pinia
```

### Step 2: Update Main Application

**Before (Vuex):**
```js
// main.js
import { createApp } from 'vue'
import { createStore } from 'vuex'
import App from './App.vue'
import store from './store'

const app = createApp(App)
app.use(store)
app.mount('#app')
```

**After (Pinia):**
```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### Step 3: Convert Store Modules

Let's migrate a typical Vuex module to Pinia:

**Vuex Module:**
```js
// store/modules/user.js
const state = {
  user: null,
  users: [],
  loading: false,
  error: null
}

const getters = {
  isLoggedIn: (state) => !!state.user,
  userCount: (state) => state.users.length,
  getUserById: (state) => (id) => {
    return state.users.find(user => user.id === id)
  }
}

const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_USERS(state, users) {
    state.users = users
  },
  ADD_USER(state, user) {
    state.users.push(user)
  },
  UPDATE_USER(state, updatedUser) {
    const index = state.users.findIndex(user => user.id === updatedUser.id)
    if (index !== -1) {
      state.users[index] = updatedUser
    }
  },
  REMOVE_USER(state, userId) {
    state.users = state.users.filter(user => user.id !== userId)
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  async login({ commit }, credentials) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    
    try {
      const user = await api.login(credentials)
      commit('SET_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async fetchUsers({ commit }) {
    commit('SET_LOADING', true)
    try {
      const users = await api.getUsers()
      commit('SET_USERS', users)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async createUser({ commit }, userData) {
    try {
      const user = await api.createUser(userData)
      commit('ADD_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  async updateUser({ commit }, user) {
    try {
      const updatedUser = await api.updateUser(user)
      commit('UPDATE_USER', updatedUser)
      return updatedUser
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  async deleteUser({ commit }, userId) {
    try {
      await api.deleteUser(userId)
      commit('REMOVE_USER', userId)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    }
  },
  
  logout({ commit }) {
    commit('SET_USER', null)
    // Clear other user-related state if needed
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
```

**Pinia Store:**
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
    user: null as User | null,
    users: [] as User[],
    loading: false,
    error: null as string | null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.user,
    userCount: (state) => state.users.length,
    getUserById: (state) => {
      return (id: number) => state.users.find(user => user.id === id)
    }
  },
  
  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true
      this.error = null
      
      try {
        const user = await api.login(credentials)
        this.user = user
        return user
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchUsers() {
      this.loading = true
      try {
        const users = await api.getUsers()
        this.users = users
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch users'
      } finally {
        this.loading = false
      }
    },
    
    async createUser(userData: Omit<User, 'id'>) {
      try {
        const user = await api.createUser(userData)
        this.users.push(user)
        return user
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create user'
        throw error
      }
    },
    
    async updateUser(user: User) {
      try {
        const updatedUser = await api.updateUser(user)
        const index = this.users.findIndex(u => u.id === updatedUser.id)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
        return updatedUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update user'
        throw error
      }
    },
    
    async deleteUser(userId: number) {
      try {
        await api.deleteUser(userId)
        this.users = this.users.filter(user => user.id !== userId)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete user'
        throw error
      }
    },
    
    logout() {
      this.user = null
      // Clear other user-related state if needed
    }
  }
})
```

### Step 4: Update Component Usage

**Vuex Usage:**
```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <h1>Welcome {{ user?.name }}</h1>
      <p>Total users: {{ userCount }}</p>
      
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
          <button @click="editUser(user)">Edit</button>
          <button @click="removeUser(user.id)">Delete</button>
        </li>
      </ul>
      
      <button @click="loadUsers">Refresh Users</button>
      <button @click="signOut">Logout</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('user', ['user', 'users', 'loading', 'error']),
    ...mapGetters('user', ['isLoggedIn', 'userCount'])
  },
  
  methods: {
    ...mapActions('user', ['fetchUsers', 'updateUser', 'deleteUser', 'logout']),
    
    async loadUsers() {
      await this.fetchUsers()
    },
    
    async editUser(user) {
      const updatedUser = { ...user, name: user.name + ' (edited)' }
      await this.updateUser(updatedUser)
    },
    
    async removeUser(userId) {
      await this.deleteUser(userId)
    },
    
    signOut() {
      this.logout()
      this.$router.push('/login')
    }
  },
  
  async created() {
    if (this.isLoggedIn) {
      await this.fetchUsers()
    }
  }
}
</script>
```

**Pinia Usage (Composition API):**
```vue
<template>
  <div>
    <div v-if="userStore.loading">Loading...</div>
    <div v-else-if="userStore.error">Error: {{ userStore.error }}</div>
    <div v-else>
      <h1>Welcome {{ userStore.user?.name }}</h1>
      <p>Total users: {{ userStore.userCount }}</p>
      
      <ul>
        <li v-for="user in userStore.users" :key="user.id">
          {{ user.name }} - {{ user.email }}
          <button @click="editUser(user)">Edit</button>
          <button @click="removeUser(user.id)">Delete</button>
        </li>
      </ul>
      
      <button @click="loadUsers">Refresh Users</button>
      <button @click="signOut">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loadUsers = async () => {
  await userStore.fetchUsers()
}

const editUser = async (user) => {
  const updatedUser = { ...user, name: user.name + ' (edited)' }
  await userStore.updateUser(updatedUser)
}

const removeUser = async (userId) => {
  await userStore.deleteUser(userId)
}

const signOut = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchUsers()
  }
})
</script>
```

**Pinia Usage (Options API):**
```vue
<template>
  <!-- Same template as above -->
</template>

<script>
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    ...mapStores(useUserStore),
    // Access store properties
    user() { return this.userStore.user },
    users() { return this.userStore.users },
    loading() { return this.userStore.loading },
    error() { return this.userStore.error },
    isLoggedIn() { return this.userStore.isLoggedIn },
    userCount() { return this.userStore.userCount }
  },
  
  methods: {
    async loadUsers() {
      await this.userStore.fetchUsers()
    },
    
    async editUser(user) {
      const updatedUser = { ...user, name: user.name + ' (edited)' }
      await this.userStore.updateUser(updatedUser)
    },
    
    async removeUser(userId) {
      await this.userStore.deleteUser(userId)
    },
    
    signOut() {
      this.userStore.logout()
      this.$router.push('/login')
    }
  },
  
  async created() {
    if (this.isLoggedIn) {
      await this.loadUsers()
    }
  }
}
</script>
```

## Advanced Migration Patterns

### Migrating Nested Modules

**Vuex Nested Modules:**
```js
// store/modules/ecommerce/index.js
import products from './products'
import cart from './cart'
import orders from './orders'

export default {
  namespaced: true,
  modules: {
    products,
    cart,
    orders
  }
}
```

**Pinia Equivalent:**
```ts
// stores/products.ts
export const useProductsStore = defineStore('products', {
  // products store
})

// stores/cart.ts
export const useCartStore = defineStore('cart', {
  // cart store
})

// stores/orders.ts
export const useOrdersStore = defineStore('orders', {
  // orders store
})

// Optional: Create a composable for related stores
// composables/useEcommerce.ts
export function useEcommerce() {
  const productsStore = useProductsStore()
  const cartStore = useCartStore()
  const ordersStore = useOrdersStore()
  
  return {
    productsStore,
    cartStore,
    ordersStore
  }
}
```

### Migrating Complex State Interactions

**Vuex Cross-Module Actions:**
```js
// store/modules/cart.js
const actions = {
  async addToCart({ commit, rootGetters }, { productId, quantity }) {
    const product = rootGetters['products/getProductById'](productId)
    
    if (product.stock >= quantity) {
      commit('ADD_ITEM', { product, quantity })
      commit('products/DECREASE_STOCK', { productId, quantity }, { root: true })
    } else {
      throw new Error('Insufficient stock')
    }
  }
}
```

**Pinia Cross-Store Actions:**
```ts
// stores/cart.ts
import { useProductsStore } from './products'

export const useCartStore = defineStore('cart', {
  actions: {
    async addToCart(productId: number, quantity: number) {
      const productsStore = useProductsStore()
      const product = productsStore.getProductById(productId)
      
      if (product && product.stock >= quantity) {
        this.items.push({ product, quantity })
        productsStore.decreaseStock(productId, quantity)
      } else {
        throw new Error('Insufficient stock')
      }
    }
  }
})
```

### Migrating Plugins

**Vuex Plugin:**
```js
// plugins/persistence.js
const persistencePlugin = (store) => {
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex-state', JSON.stringify(state))
  })
}

// store/index.js
export default createStore({
  plugins: [persistencePlugin]
})
```

**Pinia Plugin:**
```ts
// plugins/persistence.ts
import { PiniaPluginContext } from 'pinia'

export function persistencePlugin({ store }: PiniaPluginContext) {
  // Restore state from localStorage
  const saved = localStorage.getItem(`pinia-${store.$id}`)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }
  
  // Save state changes
  store.$subscribe((mutation, state) => {
    localStorage.setItem(`pinia-${store.$id}`, JSON.stringify(state))
  })
}

// main.ts
const pinia = createPinia()
pinia.use(persistencePlugin)
```

## Migration Checklist

### Pre-Migration

- [ ] **Audit current Vuex usage**: Document all stores, modules, and their dependencies
- [ ] **Identify complex patterns**: Note any advanced Vuex features being used
- [ ] **Plan migration order**: Start with leaf modules (no dependencies)
- [ ] **Set up testing**: Ensure you have good test coverage before migrating
- [ ] **Create migration branch**: Work in a separate branch for safety

### During Migration

- [ ] **Install Pinia**: Remove Vuex and install Pinia
- [ ] **Update main app**: Replace Vuex store with Pinia
- [ ] **Migrate stores one by one**: Convert each Vuex module to a Pinia store
- [ ] **Update component usage**: Replace mapState/mapActions with Pinia equivalents
- [ ] **Migrate plugins**: Convert Vuex plugins to Pinia plugins
- [ ] **Update TypeScript types**: Take advantage of Pinia's better TypeScript support
- [ ] **Test thoroughly**: Ensure all functionality works as expected

### Post-Migration

- [ ] **Remove Vuex dependencies**: Clean up package.json and imports
- [ ] **Update documentation**: Document the new store structure
- [ ] **Optimize bundle**: Take advantage of tree-shaking improvements
- [ ] **Enhance DevTools**: Set up Pinia DevTools for better debugging
- [ ] **Train team**: Ensure team members understand the new patterns

## Common Migration Challenges

### 1. Handling Mutations

**Problem**: Vuex requires mutations for state changes
**Solution**: In Pinia, mutate state directly in actions

```ts
// Vuex pattern (don't do this in Pinia)
const mutations = {
  SET_USER(state, user) {
    state.user = user
  }
}

// Pinia pattern
const actions = {
  setUser(user) {
    this.user = user // Direct mutation
  }
}
```

### 2. Namespaced Modules

**Problem**: Vuex namespaced modules need path-based access
**Solution**: Pinia stores are independent, use direct imports

```js
// Vuex
this.$store.dispatch('user/login', credentials)
this.$store.getters['user/isLoggedIn']

// Pinia
const userStore = useUserStore()
userStore.login(credentials)
userStore.isLoggedIn
```

### 3. Root State Access

**Problem**: Vuex allows access to root state from modules
**Solution**: Import and use other stores directly

```js
// Vuex
const getters = {
  cartTotal: (state, getters, rootState) => {
    return rootState.products.items.reduce(/* ... */)
  }
}

// Pinia
const getters = {
  cartTotal(): number {
    const productsStore = useProductsStore()
    return productsStore.items.reduce(/* ... */)
  }
}
```

### 4. Dynamic Module Registration

**Problem**: Vuex supports dynamic module registration
**Solution**: Create stores dynamically or use factory functions

```ts
// Dynamic store creation
export function createUserStore(userId: string) {
  return defineStore(`user-${userId}`, {
    state: () => ({
      user: null,
      preferences: {}
    }),
    // ... rest of store
  })
}

// Usage
const userStore = createUserStore('123')()
```

## Performance Considerations

### Bundle Size

Pinia typically results in smaller bundles due to:
- Better tree-shaking
- No mutations boilerplate
- Modular architecture

### Runtime Performance

Pinia offers better runtime performance through:
- Direct property access (no string-based paths)
- Optimized reactivity system
- Reduced overhead from mutations

### Development Experience

Pinia improves development experience with:
- Better TypeScript integration
- Enhanced DevTools
- Hot module replacement
- Simpler debugging

## Best Practices for Migration

### 1. Gradual Migration

```ts
// You can run Vuex and Pinia side by side during migration
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import vuexStore from './store/vuex'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuexStore) // Keep Vuex during migration
app.mount('#app')
```

### 2. Maintain Consistent Naming

```ts
// Keep similar naming conventions for easier migration
// Vuex: user module
// Pinia: useUserStore

// Vuex: products/fetchProducts
// Pinia: useProductsStore().fetchProducts
```

### 3. Leverage TypeScript

```ts
// Take advantage of Pinia's better TypeScript support
interface UserState {
  user: User | null
  users: User[]
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    users: [],
    loading: false,
    error: null
  })
})
```

### 4. Use Composition API Benefits

```ts
// Create reusable composables
export function useAsyncState<T>(asyncFn: () => Promise<T>) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      data.value = await asyncFn()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }
  
  return { loading, error, data, execute }
}

// Use in stores
export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const { loading, error, execute: fetchUsers } = useAsyncState(async () => {
    const result = await api.getUsers()
    users.value = result
    return result
  })
  
  return { users, loading, error, fetchUsers }
})
```

## Related Links

- [Getting Started](./getting-started) - Basic Pinia setup
- [Defining Stores](./defining-stores) - Store creation patterns
- [State Management](./state) - Managing state in Pinia
- [Actions](./actions) - Handling business logic
- [Plugins](./plugins) - Extending Pinia functionality