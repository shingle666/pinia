---
title: 迁移指南 - Pinia
description: 从 Vuex 迁移到 Pinia 的完整指南。了解差异、迁移策略和平滑过渡的分步说明。
keywords: Pinia, Vuex, 迁移, Vue.js, 状态管理, 升级指南, 过渡
author: Pinia Team
generator: VitePress
og:title: 迁移指南 - Pinia
og:description: 从 Vuex 迁移到 Pinia 的完整指南。了解差异、迁移策略和平滑过渡的分步说明。
og:image: /og-image.svg
og:url: https://allfun.net/zh/migration
twitter:card: summary_large_image
twitter:title: 迁移指南 - Pinia
twitter:description: 从 Vuex 迁移到 Pinia 的完整指南。了解差异、迁移策略和平滑过渡的分步说明。
twitter:image: /og-image.svg
---

# 从 Vuex 迁移

本指南将帮助你从 Vuex 迁移到 Pinia。虽然两者都是 Vue.js 的状态管理解决方案，但 Pinia 提供了更现代、对 TypeScript 更友好的方法，具有更好的开发体验。

## 为什么要迁移到 Pinia？

Pinia 相比 Vuex 提供了几个优势：

- **更好的 TypeScript 支持**：无需复杂类型即可完全类型推断
- **更简单的 API**：无需 mutations，更少的样板代码
- **模块化设计**：每个 store 都是独立的
- **开发工具支持**：增强的调试体验
- **Tree-shaking**：更好的包优化
- **Composition API 友好**：与 Vue 3 的 Composition API 无缝协作
- **SSR 支持**：内置服务端渲染支持

## 主要差异

### Store 结构

**Vuex：**
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

**Pinia：**
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

### 组件中的使用

**Vuex：**
```vue
<template>
  <div>
    <p>计数: {{ count }}</p>
    <p>双倍: {{ doubleCount }}</p>
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

**Pinia：**
```vue
<template>
  <div>
    <p>计数: {{ store.count }}</p>
    <p>双倍: {{ store.doubleCount }}</p>
    <button @click="store.increment">+</button>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/main'

const store = useMainStore()
</script>
```

## 迁移策略

### 1. 渐进式迁移

你可以在迁移期间同时运行 Vuex 和 Pinia：

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import App from './App.vue'

const app = createApp(App)

// 保留现有的 Vuex store
const store = createStore({
  // 你现有的 Vuex 配置
})

// 添加 Pinia
const pinia = createPinia()

app.use(store) // Vuex
app.use(pinia) // Pinia

app.mount('#app')
```

这允许你：
- 一次迁移一个模块
- 在现有 Vuex 模块旁边测试新的 Pinia store
- 逐步用 Pinia 替换 Vuex 使用

### 2. 完整迁移

对于较小的应用程序，你可能更喜欢完整迁移：

1. 安装 Pinia
2. 将所有 Vuex 模块转换为 Pinia store
3. 更新所有组件使用
4. 移除 Vuex 依赖

## 分步迁移

### 步骤 1：安装 Pinia

```bash
npm install pinia
# 或
yarn add pinia
```

### 步骤 2：设置 Pinia

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

### 步骤 3：转换 Vuex 模块

#### 简单模块转换

**Vuex 模块：**
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

**Pinia Store：**
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

#### 具有嵌套状态的复杂模块

**Vuex 模块：**
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
      language: 'zh'
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

**Pinia Store：**
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
      language: 'zh'
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

### 步骤 4：更新组件使用

#### Options API 迁移

**之前（Vuex）：**
```vue
<template>
  <div>
    <h1>{{ fullName }}</h1>
    <p>计数: {{ count }}</p>
    <button @click="increment">+</button>
    <button @click="fetchUserProfile(userId)">获取用户资料</button>
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

**之后（Pinia 与 Options API）：**
```vue
<template>
  <div>
    <h1>{{ userStore.fullName }}</h1>
    <p>计数: {{ counterStore.count }}</p>
    <button @click="counterStore.increment">+</button>
    <button @click="userStore.fetchProfile(userId)">获取用户资料</button>
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

#### Composition API 迁移

**之前（Vuex 与 Composition API）：**
```vue
<template>
  <div>
    <h1>{{ fullName }}</h1>
    <p>计数: {{ count }}</p>
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

**之后（Pinia 与 Composition API）：**
```vue
<template>
  <div>
    <h1>{{ userStore.fullName }}</h1>
    <p>计数: {{ counterStore.count }}</p>
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

### 步骤 5：处理跨 Store 通信

**Vuex（使用 rootState 和 rootGetters）：**
```js
// store/modules/cart.js
export default {
  namespaced: true,
  actions: {
    async checkout({ state, rootState, rootGetters }) {
      if (!rootGetters['user/isLoggedIn']) {
        throw new Error('用户必须登录')
      }
      
      const userId = rootState.user.profile.id
      // 结账逻辑
    }
  }
}
```

**Pinia：**
```js
// stores/cart.js
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', {
  actions: {
    async checkout() {
      const userStore = useUserStore()
      
      if (!userStore.isLoggedIn) {
        throw new Error('用户必须登录')
      }
      
      const userId = userStore.profile.id
      // 结账逻辑
    }
  }
})
```

## 迁移助手

### Vuex 到 Pinia 映射助手

创建一个助手来简化过渡：

```js
// utils/migration-helpers.js
import { computed } from 'vue'

// Options API 组件的助手
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

// 在组件中使用
export default {
  computed: {
    ...mapPiniaState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapPiniaActions(useCounterStore, ['increment', 'decrement'])
  }
}
```

### 状态持久化迁移

**Vuex 与 vuex-persistedstate：**
```js
import createPersistedState from 'vuex-persistedstate'

export default new Vuex.Store({
  // store 配置
  plugins: [
    createPersistedState({
      paths: ['user.preferences', 'cart.items']
    })
  ]
})
```

**Pinia 与 pinia-plugin-persistedstate：**
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
      language: 'zh'
    }
  }),
  persist: {
    paths: ['preferences']
  }
})
```

## TypeScript 迁移

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

## 测试迁移

### Vuex 测试

```js
// tests/store/counter.spec.js
import { createStore } from 'vuex'
import counter from '@/store/modules/counter'

describe('计数器模块', () => {
  let store
  
  beforeEach(() => {
    store = createStore({
      modules: {
        counter
      }
    })
  })
  
  it('增加计数', () => {
    store.dispatch('counter/increment')
    expect(store.state.counter.count).toBe(1)
  })
})
```

### Pinia 测试

```js
// tests/stores/counter.spec.js
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

describe('计数器 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('增加计数', () => {
    const counter = useCounterStore()
    counter.increment()
    expect(counter.count).toBe(1)
  })
})
```

## 常见迁移陷阱

### 1. 直接状态变更

**问题：**
```js
// 这在 Pinia 中有效，但在 Vuex 中无效
store.count++ // 直接变更
```

**解决方案：**
虽然 Pinia 允许直接变更，但为了一致性最好使用 actions：

```js
// 更好的方法
store.increment()
```

### 2. 访问其他 Store

**问题：**
```js
// 试图像 Vuex 模块一样访问 store
const userStore = this.$store.state.user // 不会工作
```

**解决方案：**
```js
// Pinia 中的正确方式
const userStore = useUserStore()
```

### 3. 响应性问题

**问题：**
```js
// 解构会失去响应性
const { count, increment } = useCounterStore()
```

**解决方案：**
```js
// 对响应式属性使用 storeToRefs
import { storeToRefs } from 'pinia'

const store = useCounterStore()
const { count } = storeToRefs(store)
const { increment } = store // actions 不需要 storeToRefs
```

## 性能考虑

### 包大小

Pinia 通常会产生更小的包，因为：
- 更好的 tree-shaking
- 没有 mutations 层
- 模块化架构

### 运行时性能

Pinia 提供更好的运行时性能：
- 直接属性访问
- 没有 mutation 跟踪开销
- 优化的响应性

## 迁移检查清单

- [ ] 安装 Pinia
- [ ] 在 main.js 中设置 Pinia
- [ ] 将 Vuex 模块转换为 Pinia store
- [ ] 更新组件导入和使用
- [ ] 处理跨 store 通信
- [ ] 迁移状态持久化（如果使用）
- [ ] 更新 TypeScript 类型（如果适用）
- [ ] 更新测试
- [ ] 移除 Vuex 依赖
- [ ] 更新文档

## 总结

从 Vuex 迁移到 Pinia 在开发体验、TypeScript 支持和可维护性方面提供了显著的好处。虽然迁移需要一些努力，但改进的 API 和更好的工具使其值得。

关键要点：
- 从渐进式迁移方法开始
- 一次转换一个模块
- 与 store 迁移一起更新测试
- 利用 Pinia 更简单的 API
- 利用更好的 TypeScript 支持

有关更详细的信息，请参阅 [Pinia 文档](./guide/) 和 [API 参考](./api/)。