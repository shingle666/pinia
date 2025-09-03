---
title: Migration Guide
description: Learn how to migrate from other state management solutions to Pinia, including Vuex, Redux, and other libraries.
head:
  - [meta, { name: description, content: "Learn how to migrate from other state management solutions to Pinia, including Vuex, Redux, and other libraries." }]
  - [meta, { name: keywords, content: "Pinia migration, Vuex to Pinia, Redux to Pinia, state management migration" }]
  - [meta, { property: "og:title", content: "Migration Guide - Pinia" }]
  - [meta, { property: "og:description", content: "Learn how to migrate from other state management solutions to Pinia, including Vuex, Redux, and other libraries." }]
---

# Migration Guide

This guide helps you migrate from other state management solutions to Pinia. Whether you're coming from Vuex, Redux, or another library, we'll walk you through the process step by step.

## Migrating from Vuex

### Overview

Pinia is the official successor to Vuex and provides a more modern, TypeScript-friendly API. The migration process involves converting your Vuex modules to Pinia stores.

### Key Differences

| Feature | Vuex | Pinia |
|---------|------|-------|
| **Stores** | Single store with modules | Multiple stores |
| **Mutations** | Required for state changes | Direct state mutation |
| **Actions** | Async operations | Sync and async operations |
| **Getters** | Computed properties | Computed properties |
| **TypeScript** | Complex setup | Built-in support |
| **DevTools** | Vue DevTools | Vue DevTools + Pinia DevTools |
| **SSR** | Manual setup | Automatic |

### Step-by-Step Migration

#### 1. Install Pinia

```bash
npm install pinia
# or
yarn add pinia
# or
pnpm add pinia
```

#### 2. Setup Pinia

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

#### 3. Convert Vuex Modules to Pinia Stores

**Before (Vuex):**

```ts
// store/modules/user.js
const state = {
  user: null,
  isLoggedIn: false,
  preferences: {}
}

const getters = {
  fullName: (state) => {
    return state.user ? `${state.user.firstName} ${state.user.lastName}` : ''
  },
  isAdmin: (state) => {
    return state.user?.role === 'admin'
  }
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
    state.isLoggedIn = !!user
  },
  SET_PREFERENCES(state, preferences) {
    state.preferences = preferences
  },
  LOGOUT(state) {
    state.user = null
    state.isLoggedIn = false
    state.preferences = {}
  }
}

const actions = {
  async login({ commit }, credentials) {
    try {
      const user = await api.login(credentials)
      commit('SET_USER', user)
      return user
    } catch (error) {
      throw error
    }
  },
  async fetchPreferences({ commit, state }) {
    if (!state.user) return
    
    const preferences = await api.getUserPreferences(state.user.id)
    commit('SET_PREFERENCES', preferences)
  },
  logout({ commit }) {
    commit('LOGOUT')
    router.push('/login')
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

**After (Pinia):**

```ts
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import { router } from '@/router'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const preferences = ref<UserPreferences>({})

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  
  const fullName = computed(() => {
    return user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  })
  
  const isAdmin = computed(() => {
    return user.value?.role === 'admin'
  })

  // Actions
  async function login(credentials: LoginCredentials): Promise<User> {
    try {
      const userData = await api.login(credentials)
      user.value = userData
      return userData
    } catch (error) {
      throw error
    }
  }

  async function fetchPreferences(): Promise<void> {
    if (!user.value) return
    
    const userPreferences = await api.getUserPreferences(user.value.id)
    preferences.value = userPreferences
  }

  function logout(): void {
    user.value = null
    preferences.value = {}
    router.push('/login')
  }

  return {
    // State
    user: readonly(user),
    preferences: readonly(preferences),
    
    // Getters
    isLoggedIn,
    fullName,
    isAdmin,
    
    // Actions
    login,
    fetchPreferences,
    logout
  }
})
```

#### 4. Update Component Usage

**Before (Vuex):**

```vue
<template>
  <div>
    <h1>Welcome, {{ fullName }}</h1>
    <button v-if="isAdmin" @click="adminAction">Admin Panel</button>
    <button @click="logout">Logout</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapGetters('user', ['fullName', 'isAdmin'])
  },
  methods: {
    ...mapActions('user', ['logout']),
    adminAction() {
      // Admin logic
    }
  }
}
</script>
```

**After (Pinia):**

```vue
<template>
  <div>
    <h1>Welcome, {{ userStore.fullName }}</h1>
    <button v-if="userStore.isAdmin" @click="adminAction">Admin Panel</button>
    <button @click="userStore.logout">Logout</button>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

function adminAction() {
  // Admin logic
}
</script>
```

### Migration Checklist

- [ ] Install Pinia and setup in main.ts
- [ ] Convert each Vuex module to a Pinia store
- [ ] Replace mutations with direct state changes
- [ ] Update component imports and usage
- [ ] Remove Vuex-specific code (mapGetters, mapActions, etc.)
- [ ] Update TypeScript types
- [ ] Test all functionality
- [ ] Remove Vuex dependency

## Migrating from Redux

### Overview

Migrating from Redux to Pinia involves converting reducers to stores and actions to store methods.

### Key Differences

| Feature | Redux | Pinia |
|---------|-------|-------|
| **State** | Immutable updates | Direct mutation |
| **Actions** | Plain objects | Functions |
| **Reducers** | Pure functions | Store methods |
| **Middleware** | Complex setup | Plugins |
| **Boilerplate** | High | Minimal |

### Example Migration

**Before (Redux):**

```ts
// actions/counter.ts
export const INCREMENT = 'INCREMENT'
export const DECREMENT = 'DECREMENT'
export const SET_COUNT = 'SET_COUNT'

export const increment = () => ({ type: INCREMENT })
export const decrement = () => ({ type: DECREMENT })
export const setCount = (count: number) => ({ type: SET_COUNT, payload: count })

// reducers/counter.ts
interface CounterState {
  count: number
}

const initialState: CounterState = {
  count: 0
}

export default function counterReducer(
  state = initialState,
  action: any
): CounterState {
  switch (action.type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 }
    case DECREMENT:
      return { ...state, count: state.count - 1 }
    case SET_COUNT:
      return { ...state, count: action.payload }
    default:
      return state
  }
}
```

**After (Pinia):**

```ts
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)

  // Getters
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)

  // Actions
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function setCount(newCount: number) {
    count.value = newCount
  }

  return {
    count: readonly(count),
    doubleCount,
    isEven,
    increment,
    decrement,
    setCount
  }
})
```

## Common Migration Patterns

### 1. Async Actions

**Before (Vuex/Redux):**

```ts
// Vuex
const actions = {
  async fetchData({ commit }) {
    commit('SET_LOADING', true)
    try {
      const data = await api.getData()
      commit('SET_DATA', data)
    } catch (error) {
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  }
}
```

**After (Pinia):**

```ts
export const useDataStore = defineStore('data', () => {
  const data = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchData() {
    loading.value = true
    error.value = null
    
    try {
      const result = await api.getData()
      data.value = result
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
})
```

### 2. Nested State

**Before:**

```ts
// Vuex mutations
SET_USER_PROFILE(state, profile) {
  state.user.profile = { ...state.user.profile, ...profile }
}
```

**After:**

```ts
// Pinia - direct mutation
function updateUserProfile(profile: Partial<UserProfile>) {
  Object.assign(user.value.profile, profile)
}
```

### 3. Cross-Store Communication

**Before (Vuex):**

```ts
// Using rootState and rootGetters
const actions = {
  async createOrder({ commit, rootState }) {
    const user = rootState.user.user
    const cart = rootState.cart.items
    // ...
  }
}
```

**After (Pinia):**

```ts
export const useOrderStore = defineStore('order', () => {
  async function createOrder() {
    const userStore = useUserStore()
    const cartStore = useCartStore()
    
    const user = userStore.user
    const cartItems = cartStore.items
    // ...
  }

  return { createOrder }
})
```

## Migration Tools

### Automated Migration Script

```bash
# Install migration tool
npm install -g vuex-to-pinia-migrator

# Run migration
vuex-to-pinia-migrator --src ./src/store --dest ./src/stores
```

### Manual Migration Helper

```ts
// utils/migration-helper.ts
export function createMigrationHelper() {
  const stores = new Map()
  
  return {
    // Helper to gradually replace Vuex usage
    useStore(name: string) {
      if (stores.has(name)) {
        return stores.get(name)()
      }
      
      // Fallback to Vuex during migration
      return useStore()
    },
    
    registerPiniaStore(name: string, store: any) {
      stores.set(name, store)
    }
  }
}
```

## Testing During Migration

### Parallel Testing

```ts
// tests/migration.test.ts
import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('Migration: User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should maintain same behavior as Vuex', async () => {
    const store = useUserStore()
    
    // Test that Pinia store behaves like Vuex module
    expect(store.isLoggedIn).toBe(false)
    
    await store.login({ email: 'test@example.com', password: 'password' })
    
    expect(store.isLoggedIn).toBe(true)
    expect(store.user).toBeDefined()
  })
})
```

## Performance Considerations

### Bundle Size

- **Vuex**: ~2.5kb gzipped
- **Pinia**: ~1.5kb gzipped

### Runtime Performance

- Direct state mutation (no mutations)
- Better tree-shaking
- Smaller bundle size
- Better TypeScript inference

## Troubleshooting

### Common Issues

#### 1. State Reactivity

**Problem**: State not reactive after migration

**Solution**: Ensure you're using `ref()` or `reactive()` for state

```ts
// ❌ Wrong
const state = {
  count: 0
}

// ✅ Correct
const count = ref(0)
```

#### 2. TypeScript Errors

**Problem**: Type errors after migration

**Solution**: Update type definitions

```ts
// Add proper types
export interface User {
  id: string
  name: string
  email: string
}

const user = ref<User | null>(null)
```

#### 3. DevTools Not Working

**Problem**: Vue DevTools not showing Pinia stores

**Solution**: Ensure proper setup

```ts
// main.ts
import { createPinia } from 'pinia'

const pinia = createPinia()

// Enable devtools in development
if (process.env.NODE_ENV === 'development') {
  pinia.use(({ store }) => {
    store.$subscribe(() => {
      // This enables time-travel debugging
    })
  })
}

app.use(pinia)
```

## Best Practices

### 1. Gradual Migration

- Migrate one module at a time
- Keep both Vuex and Pinia during transition
- Test thoroughly before removing Vuex

### 2. Store Organization

```ts
// Group related functionality
stores/
├── user/
│   ├── index.ts
│   ├── types.ts
│   └── api.ts
├── products/
│   ├── index.ts
│   ├── types.ts
│   └── api.ts
└── index.ts
```

### 3. Type Safety

```ts
// Define clear interfaces
export interface UserState {
  user: User | null
  preferences: UserPreferences
  loading: boolean
  error: string | null
}

// Use proper typing for actions
async function login(credentials: LoginCredentials): Promise<User> {
  // Implementation
}
```

## FAQ

### Q: Can I use Vuex and Pinia together?

**A**: Yes, during migration you can use both. However, avoid sharing state between them.

### Q: How do I migrate Vuex plugins?

**A**: Convert them to Pinia plugins:

```ts
// Vuex plugin
const vuexPlugin = (store) => {
  store.subscribe((mutation, state) => {
    // Handle mutation
  })
}

// Pinia plugin
const piniaPlugin = ({ store }) => {
  store.$subscribe((mutation, state) => {
    // Handle state change
  })
}
```

### Q: What about SSR?

**A**: Pinia has better SSR support out of the box. See the [SSR guide](./ssr.md) for details.

### Q: How do I handle large stores?

**A**: Break them into smaller, focused stores:

```ts
// Instead of one large user store
useUserStore()
useUserPreferencesStore()
useUserNotificationsStore()
```

## Next Steps

- [TypeScript Best Practices](../cookbook/typescript-best-practices.md)
- [Testing Guide](./testing.md)
- [Performance Optimization](./performance.md)
- [Plugin Development](../cookbook/plugin-development.md)

## Resources

- [Official Migration Tool](https://github.com/vuejs/pinia/tree/v2/packages/migration)
- [Migration Examples](https://github.com/vuejs/pinia/tree/v2/examples/migration)
- [Community Migration Scripts](https://github.com/pinia-community/migration-tools)
- [Video Tutorial: Migrating from Vuex](https://www.youtube.com/watch?v=example)