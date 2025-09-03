---
title: Migration Guide - Pinia
description: Complete guide for migrating from Vuex to Pinia. Learn about differences, migration strategies, and step-by-step instructions for a smooth transition.
keywords: Pinia, Vuex, migration, Vue.js, state management, upgrade guide, transition
author: Pinia Team
generator: VitePress
og:title: Migration Guide - Pinia
og:description: Complete guide for migrating from Vuex to Pinia. Learn about differences, migration strategies, and step-by-step instructions for a smooth transition.
og:image: /og-image.svg
og:url: https://allfun.net/migration
twitter:card: summary_large_image
twitter:title: Migration Guide - Pinia
twitter:description: Complete guide for migrating from Vuex to Pinia. Learn about differences, migration strategies, and step-by-step instructions for a smooth transition.
twitter:image: /og-image.svg
---

# Migration from Vuex

This guide will help you migrate from Vuex to Pinia. While both are state management solutions for Vue.js, Pinia offers a more modern, TypeScript-friendly approach with better developer experience.

## Why Migrate to Pinia?

Pinia offers several advantages over Vuex:

- **Better TypeScript support**: Full type inference without complex typing
- **Simpler API**: No mutations, less boilerplate
- **Modular by design**: Each store is independent
- **Devtools support**: Enhanced debugging experience
- **Tree-shaking**: Better bundle optimization
- **Composition API friendly**: Works seamlessly with Vue 3's Composition API
- **SSR support**: Built-in server-side rendering support

## Key Differences

### Store Structure

**Vuex:**
```js
// store/index.js
export default new Vuex.Store({
  state: {
    count: 0,
    user: null
  },
  mutations: {
    INCREMENT(state) {
      state.count++
    },
    SET_USER(state, user) {
      state.user = user
    }
  },
  actions: {
    async fetchUser({ commit }, id) {
      const user = await api.getUser(id)
      commit('SET_USER', user)
    }
  },
  getters: {
    doubleCount: state => state.count * 2,
    isLoggedIn: state => !!state.user
  }
})
```

**Pinia:**
```js
// stores/main.js
import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    count: 0,
    user: null
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isLoggedIn: (state) => !!state.user
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    async fetchUser(id) {
      this.user = await api.getUser(id)
    }
  }
})
```

### Usage in Components

**Vuex:**
```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+</button>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState(['count']),
    ...mapGetters(['doubleCount'])
  },
  methods: {
    ...mapActions(['increment'])
  }
}
</script>
```

**Pinia:**
```vue
<template>
  <div>
    <p>Count: {{ store.count }}</p>
    <p>Double: {{ store.doubleCount }}</p>
    <button @click="store.increment">+</button>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/main'

const store = useMainStore()
</script>
```

## Migration Strategies

### 1. Gradual Migration

You can run Vuex and Pinia side by side during migration:

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import App from './App.vue'

const app = createApp(App)

// Keep existing Vuex store
const store = createStore({
  // your existing Vuex configuration
})

// Add Pinia
const pinia = createPinia()

app.use(store) // Vuex
app.use(pinia) // Pinia

app.mount('#app')
```

This allows you to:
- Migrate one module at a time
- Test new Pinia stores alongside existing Vuex modules
- Gradually replace Vuex usage with Pinia

### 2. Complete Migration

For smaller applications, you might prefer a complete migration:

1. Install Pinia
2. Convert all Vuex modules to Pinia stores
3. Update all component usage
4. Remove Vuex dependency

## Step-by-Step Migration

### Step 1: Install Pinia

```bash
npm install pinia
# or
yarn add pinia
```

### Step 2: Setup Pinia

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### Step 3: Convert Vuex Modules

#### Simple Module Conversion

**Vuex Module:**
```js
// store/modules/counter.js
export default {
  namespaced: true,
  state: {
    count: 0
  },
  mutations: {
    INCREMENT(state) {
      state.count++
    },
    DECREMENT(state) {
      state.count--
    },
    SET_COUNT(state, value) {
      state.count = value
    }
  },
  actions: {
    increment({ commit }) {
      commit('INCREMENT')
    },
    decrement({ commit }) {
      commit('DECREMENT')
    },
    async fetchCount({ commit }) {
      const count = await api.getCount()
      commit('SET_COUNT', count)
    }
  },
  getters: {
    doubleCount: state => state.count * 2,
    isPositive: state => state.count > 0
  }
}
```

**Pinia Store:**
```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isPositive: (state) => state.count > 0
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    async fetchCount() {
      this.count = await api.getCount()
    }
  }
})
```

#### Complex Module with Nested State

**Vuex Module:**
```js
// store/modules/user.js
export default {
  namespaced: true,
  state: {
    profile: {
      name: '',
      email: '',
      avatar: ''
    },
    preferences: {
      theme: 'light',
      language: 'en'
    },
    isLoading: false,
    error: null
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.isLoading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_PROFILE(state, profile) {
      state.profile = profile
    },
    UPDATE_PREFERENCE(state, { key, value }) {
      state.preferences[key] = value
    }
  },
  actions: {
    async fetchProfile({ commit }, userId) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const profile = await api.getUserProfile(userId)
        commit('SET_PROFILE', profile)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async updatePreference({ commit }, { key, value }) {
      try {
        await api.updateUserPreference(key, value)
        commit('UPDATE_PREFERENCE', { key, value })
      } catch (error) {
        commit('SET_ERROR', error.message)
      }
    }
  },
  getters: {
    fullName: state => `${state.profile.firstName} ${state.profile.lastName}`,
    isDarkTheme: state => state.preferences.theme === 'dark'
  }
}
```

**Pinia Store:**
```js
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: {
      name: '',
      email: '',
      avatar: ''
    },
    preferences: {
      theme: 'light',
      language: 'en'
    },
    isLoading: false,
    error: null
  }),
  
  getters: {
    fullName: (state) => `${state.profile.firstName} ${state.profile.lastName}`,
    isDarkTheme: (state) => state.preferences.theme === 'dark'
  },
  
  actions: {
    async fetchProfile(userId) {
      this.isLoading = true
      this.error = null
      
      try {
        this.profile = await api.getUserProfile(userId)
      } catch (error) {
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },
    
    async updatePreference(key, value) {
      try {
        await api.updateUserPreference(key, value)
        this.preferences[key] = value
      } catch (error) {
        this.error = error.message
      }
    }
  }
})
```

### Step 4: Update Component Usage

#### Options API Migration

**Before (Vuex):**
```vue
<template>
  <div>
    <h1>{{ fullName }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
    <button @click="fetchUserProfile(userId)">Fetch Profile</button>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      userId: 1
    }
  },
  computed: {
    ...mapState('counter', ['count']),
    ...mapGetters('user', ['fullName'])
  },
  methods: {
    ...mapActions('counter', ['increment']),
    ...mapActions('user', ['fetchUserProfile'])
  }
}
</script>
```

**After (Pinia with Options API):**
```vue
<template>
  <div>
    <h1>{{ userStore.fullName }}</h1>
    <p>Count: {{ counterStore.count }}</p>
    <button @click="counterStore.increment">+</button>
    <button @click="userStore.fetchProfile(userId)">Fetch Profile</button>
  </div>
</template>

<script>
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'

export default {
  data() {
    return {
      userId: 1
    }
  },
  computed: {
    counterStore() {
      return useCounterStore()
    },
    userStore() {
      return useUserStore()
    }
  }
}
</script>
```

#### Composition API Migration

**Before (Vuex with Composition API):**
```vue
<template>
  <div>
    <h1>{{ fullName }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const count = computed(() => store.state.counter.count)
const fullName = computed(() => store.getters['user/fullName'])

const increment = () => store.dispatch('counter/increment')
</script>
```

**After (Pinia with Composition API):**
```vue
<template>
  <div>
    <h1>{{ userStore.fullName }}</h1>
    <p>Count: {{ counterStore.count }}</p>
    <button @click="counterStore.increment">+</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'

const counterStore = useCounterStore()
const userStore = useUserStore()
</script>
```

### Step 5: Handle Cross-Store Communication

**Vuex (using rootState and rootGetters):**
```js
// store/modules/cart.js
export default {
  namespaced: true,
  actions: {
    async checkout({ state, rootState, rootGetters }) {
      if (!rootGetters['user/isLoggedIn']) {
        throw new Error('User must be logged in')
      }
      
      const userId = rootState.user.profile.id
      // checkout logic
    }
  }
}
```

**Pinia:**
```js
// stores/cart.js
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', {
  actions: {
    async checkout() {
      const userStore = useUserStore()
      
      if (!userStore.isLoggedIn) {
        throw new Error('User must be logged in')
      }
      
      const userId = userStore.profile.id
      // checkout logic
    }
  }
})
```

## Migration Helpers

### Vuex to Pinia Mapping Helper

Create a helper to ease the transition:

```js
// utils/migration-helpers.js
import { computed } from 'vue'

// Helper for Options API components
export function mapPiniaState(store, keys) {
  const storeInstance = store()
  const mapped = {}
  
  keys.forEach(key => {
    mapped[key] = computed(() => storeInstance[key])
  })
  
  return mapped
}

export function mapPiniaActions(store, keys) {
  const storeInstance = store()
  const mapped = {}
  
  keys.forEach(key => {
    mapped[key] = storeInstance[key]
  })
  
  return mapped
}

// Usage in component
export default {
  computed: {
    ...mapPiniaState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapPiniaActions(useCounterStore, ['increment', 'decrement'])
  }
}
```

### State Persistence Migration

**Vuex with vuex-persistedstate:**
```js
import createPersistedState from 'vuex-persistedstate'

export default new Vuex.Store({
  // store config
  plugins: [
    createPersistedState({
      paths: ['user.preferences', 'cart.items']
    })
  ]
})
```

**Pinia with pinia-plugin-persistedstate:**
```js
// main.js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// stores/user.js
export const useUserStore = defineStore('user', {
  state: () => ({
    preferences: {
      theme: 'light',
      language: 'en'
    }
  }),
  persist: {
    paths: ['preferences']
  }
})
```

## TypeScript Migration

### Vuex TypeScript

```ts
// types/store.ts
import { Store } from 'vuex'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<RootState>
  }
}

interface RootState {
  counter: CounterState
  user: UserState
}

interface CounterState {
  count: number
}

interface UserState {
  profile: UserProfile | null
}
```

### Pinia TypeScript

```ts
// stores/counter.ts
import { defineStore } from 'pinia'

interface CounterState {
  count: number
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 0
  }),
  
  getters: {
    doubleCount: (state): number => state.count * 2
  },
  
  actions: {
    increment(): void {
      this.count++
    }
  }
})
```

## Testing Migration

### Vuex Testing

```js
// tests/store/counter.spec.js
import { createStore } from 'vuex'
import counter from '@/store/modules/counter'

describe('Counter Module', () => {
  let store
  
  beforeEach(() => {
    store = createStore({
      modules: {
        counter
      }
    })
  })
  
  it('increments count', () => {
    store.dispatch('counter/increment')
    expect(store.state.counter.count).toBe(1)
  })
})
```

### Pinia Testing

```js
// tests/stores/counter.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('increments count', () => {
    const counter = useCounterStore()
    counter.increment()
    expect(counter.count).toBe(1)
  })
})
```

## Common Migration Pitfalls

### 1. Direct State Mutation

**Problem:**
```js
// This works in Pinia but not in Vuex
store.count++ // Direct mutation
```

**Solution:**
While Pinia allows direct mutations, it's better to use actions for consistency:

```js
// Better approach
store.increment()
```

### 2. Accessing Other Stores

**Problem:**
```js
// Trying to access stores like Vuex modules
const userStore = this.$store.state.user // Won't work
```

**Solution:**
```js
// Correct way in Pinia
const userStore = useUserStore()
```

### 3. Reactivity Issues

**Problem:**
```js
// Destructuring loses reactivity
const { count, increment } = useCounterStore()
```

**Solution:**
```js
// Use storeToRefs for reactive properties
import { storeToRefs } from 'pinia'

const store = useCounterStore()
const { count } = storeToRefs(store)
const { increment } = store // actions don't need storeToRefs
```

## Performance Considerations

### Bundle Size

Pinia typically results in smaller bundles due to:
- Better tree-shaking
- No mutations layer
- Modular architecture

### Runtime Performance

Pinia offers better runtime performance:
- Direct property access
- No mutation tracking overhead
- Optimized reactivity

## Migration Checklist

- [ ] Install Pinia
- [ ] Setup Pinia in main.js
- [ ] Convert Vuex modules to Pinia stores
- [ ] Update component imports and usage
- [ ] Handle cross-store communication
- [ ] Migrate state persistence (if used)
- [ ] Update TypeScript types (if applicable)
- [ ] Update tests
- [ ] Remove Vuex dependency
- [ ] Update documentation

## Conclusion

Migrating from Vuex to Pinia offers significant benefits in terms of developer experience, TypeScript support, and maintainability. While the migration requires some effort, the improved API and better tooling make it worthwhile.

Key takeaways:
- Start with a gradual migration approach
- Convert modules one at a time
- Update tests alongside store migration
- Take advantage of Pinia's simpler API
- Leverage better TypeScript support

For more detailed information, refer to the [Pinia documentation](./guide/) and [API reference](./api/).