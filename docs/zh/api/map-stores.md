---
title: mapStores() - Pinia API
description: mapStores 函数的完整 API 参考。学习如何在 Options API 组件中映射多个 store。
keywords: Pinia, Vue.js, mapStores, Options API, store 映射, API 参考
author: Pinia Team
generator: VitePress
og:title: mapStores() - Pinia API
og:description: mapStores 函数的完整 API 参考。学习如何在 Options API 组件中映射多个 store。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/map-stores
twitter:card: summary_large_image
twitter:title: mapStores() - Pinia API
twitter:description: mapStores 函数的完整 API 参考。学习如何在 Options API 组件中映射多个 store。
twitter:image: /og-image.svg
---

# mapStores()

将多个 store 映射为计算属性，用于 Options API 组件。每个 store 都会成为一个可访问的计算属性。

## 函数签名

```ts
function mapStores<T extends Record<string, StoreDefinition>>(
  ...stores: [...StoreDefinitions<T>]
): ComputedOptions

function mapStores<T extends Record<string, StoreDefinition>>(
  storesObject: T
): ComputedOptions
```

## 参数

- **stores**: 要映射的 store 定义（展开语法）
- **storesObject**: 以自定义名称为键、store 定义为值的对象

## 返回值

用于 Options API 组件的计算属性对象。

## 基本用法

### 多个 Store

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'

export default {
  computed: {
    // 映射为 this.userStore, this.cartStore, this.productStore
    ...mapStores(useUserStore, useCartStore, useProductStore)
  },
  
  methods: {
    async loadUserData() {
      await this.userStore.fetchUser()
      this.cartStore.loadUserCart(this.userStore.id)
    },
    
    addToCart(productId) {
      const product = this.productStore.getById(productId)
      this.cartStore.addItem(product)
    }
  }
}
```

### 自定义名称

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    // 映射为 this.user 和 this.cart，而不是 this.userStore 和 this.cartStore
    ...mapStores({
      user: useUserStore,
      cart: useCartStore
    })
  },
  
  methods: {
    checkout() {
      if (this.user.isLoggedIn) {
        this.cart.processCheckout()
      }
    }
  }
}
```

## Store 访问

### 访问状态

```js
import { mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapStores(useCounterStore),
    
    // 访问 store 状态
    count() {
      return this.counterStore.count
    },
    
    // 访问 store getter
    doubleCount() {
      return this.counterStore.doubleCount
    }
  }
}
```

### 调用 Action

```js
import { mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapStores(useCounterStore)
  },
  
  methods: {
    increment() {
      this.counterStore.increment()
    },
    
    async fetchData() {
      await this.counterStore.fetchRemoteData()
    }
  }
}
```

## 高级用法

### 条件 Store 访问

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    ...mapStores(useUserStore, useAdminStore),
    
    currentStore() {
      return this.userStore.isAdmin ? this.adminStore : this.userStore
    }
  },
  
  methods: {
    performAction() {
      this.currentStore.doSomething()
    }
  }
}
```

### Store 组合

```js
import { mapStores } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useApiStore } from '@/stores/api'

export default {
  computed: {
    ...mapStores(useAuthStore, useNotificationStore, useApiStore),
    
    isReady() {
      return this.authStore.isInitialized && this.apiStore.isConnected
    }
  },
  
  methods: {
    async initialize() {
      try {
        await this.authStore.initialize()
        await this.apiStore.connect()
        this.notificationStore.show('应用初始化成功')
      } catch (error) {
        this.notificationStore.showError('初始化失败')
      }
    }
  }
}
```

### 响应式 Store 属性

```js
import { mapStores } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'

export default {
  computed: {
    ...mapStores(useSettingsStore, useThemeStore),
    
    // 基于多个 store 的计算属性
    appConfig() {
      return {
        theme: this.themeStore.currentTheme,
        language: this.settingsStore.language,
        notifications: this.settingsStore.notifications
      }
    },
    
    isDarkMode() {
      return this.themeStore.currentTheme === 'dark'
    }
  },
  
  watch: {
    // 监听 store 变化
    'settingsStore.language'(newLang) {
      this.$i18n.locale = newLang
    },
    
    'themeStore.currentTheme'(newTheme) {
      document.body.className = `theme-${newTheme}`
    }
  }
}
```

## TypeScript

### 类型安全

```ts
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import type { ComputedOptions } from 'vue'

interface ComponentData {
  localProperty: string
}

interface ComponentComputed {
  userStore: ReturnType<typeof useUserStore>
  cartStore: ReturnType<typeof useCartStore>
  totalItems: number
}

export default defineComponent<ComponentData, {}, {}, ComponentComputed>({
  data(): ComponentData {
    return {
      localProperty: 'value'
    }
  },
  
  computed: {
    ...mapStores(useUserStore, useCartStore),
    
    totalItems(): number {
      return this.cartStore.items.length
    }
  } as ComputedOptions<ComponentComputed>
})
```

### 泛型 Store 映射

```ts
function createStoreMapper<T extends Record<string, any>>(stores: T) {
  return mapStores(stores)
}

// 使用
const storeMap = createStoreMapper({
  user: useUserStore,
  cart: useCartStore
})

export default {
  computed: {
    ...storeMap
  }
}
```

## 与其他映射函数的比较

### vs mapState

```js
// mapStores - 提供对整个 store 的访问
computed: {
  ...mapStores(useUserStore),
  
  userName() {
    return this.userStore.name // 通过 store 访问
  }
}

// mapState - 直接映射状态属性
computed: {
  ...mapState(useUserStore, ['name']),
  
  userName() {
    return this.name // 直接访问
  }
}
```

### vs mapActions

```js
// mapStores - 通过 store 调用 action
computed: {
  ...mapStores(useUserStore)
},
methods: {
  login() {
    this.userStore.login() // 通过 store 调用
  }
}

// mapActions - 直接映射 action
methods: {
  ...mapActions(useUserStore, ['login']),
  
  handleLogin() {
    this.login() // 直接调用
  }
}
```

## 最佳实践

### 1. 使用描述性名称

```js
// ✅ 好 - 清晰的 store 名称
computed: {
  ...mapStores({
    userProfile: useUserStore,
    shoppingCart: useCartStore,
    productCatalog: useProductStore
  })
}

// ❌ 混乱 - 不清楚的名称
computed: {
  ...mapStores({
    store1: useUserStore,
    store2: useCartStore
  })
}
```

### 2. 分组相关 Store

```js
// ✅ 好 - 逻辑分组
computed: {
  // 认证相关
  ...mapStores({
    auth: useAuthStore,
    user: useUserStore
  }),
  
  // 电商相关
  ...mapStores({
    cart: useCartStore,
    products: useProductStore,
    orders: useOrderStore
  })
}
```

### 3. 与其他计算属性结合

```js
computed: {
  ...mapStores(useUserStore, useCartStore),
  
  // 派生计算属性
  isLoggedIn() {
    return !!this.userStore.token
  },
  
  cartSummary() {
    return {
      items: this.cartStore.items.length,
      total: this.cartStore.total,
      user: this.userStore.name
    }
  }
}
```

### 4. 与监听器配合使用

```js
computed: {
  ...mapStores(useSettingsStore)
},

watch: {
  'settingsStore.theme': {
    handler(newTheme) {
      this.applyTheme(newTheme)
    },
    immediate: true
  },
  
  'settingsStore.language'(newLang, oldLang) {
    if (oldLang) {
      this.reloadContent(newLang)
    }
  }
}
```

## 常见模式

### Store 门面

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { usePreferencesStore } from '@/stores/preferences'

export default {
  computed: {
    ...mapStores(useUserStore, usePreferencesStore),
    
    // 创建统一接口
    userProfile() {
      return {
        ...this.userStore.$state,
        preferences: this.preferencesStore.$state
      }
    }
  },
  
  methods: {
    async updateProfile(data) {
      await this.userStore.update(data.user)
      await this.preferencesStore.update(data.preferences)
    }
  }
}
```

### 条件 Store 加载

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    ...mapStores(useUserStore, useAdminStore),
    
    activeStore() {
      return this.userStore.isAdmin ? this.adminStore : this.userStore
    }
  },
  
  async created() {
    await this.userStore.initialize()
    
    if (this.userStore.isAdmin) {
      await this.adminStore.initialize()
    }
  }
}
```

### Store 同步

```js
import { mapStores } from 'pinia'
import { useLocalStore } from '@/stores/local'
import { useRemoteStore } from '@/stores/remote'

export default {
  computed: {
    ...mapStores(useLocalStore, useRemoteStore),
    
    isSynced() {
      return this.localStore.lastSync === this.remoteStore.lastUpdate
    }
  },
  
  methods: {
    async syncStores() {
      const remoteData = await this.remoteStore.fetch()
      this.localStore.update(remoteData)
    }
  },
  
  watch: {
    isSynced(synced) {
      if (!synced) {
        this.syncStores()
      }
    }
  }
}
```

## 从 Vuex 迁移

### Vuex 模块

```js
// Vuex
computed: {
  ...mapState({
    user: state => state.user,
    cart: state => state.cart
  })
}

// Pinia 使用 mapStores
computed: {
  ...mapStores({
    user: useUserStore,
    cart: useCartStore
  })
}
```

### 命名空间模块

```js
// Vuex 命名空间
computed: {
  ...mapState('user', ['profile']),
  ...mapState('cart', ['items'])
}

// Pinia 等价写法
computed: {
  ...mapStores(useUserStore, useCartStore),
  
  profile() {
    return this.userStore.profile
  },
  
  items() {
    return this.cartStore.items
  }
}
```

## 性能考虑

### 懒加载 Store 访问

```js
computed: {
  // 只映射实际使用的 store
  ...mapStores(useUserStore), // 总是需要的
  
  // 有条件地映射昂贵的 store
  ...(this.needsAdminFeatures ? mapStores(useAdminStore) : {})
}
```

### 记忆化 Store 访问

```js
import { mapStores } from 'pinia'
import { useExpensiveStore } from '@/stores/expensive'

export default {
  computed: {
    ...mapStores(useExpensiveStore),
    
    // 缓存昂贵的计算
    expensiveData() {
      if (!this._cachedData || this.expensiveStore.lastUpdate > this._lastCache) {
        this._cachedData = this.expensiveStore.computeExpensiveData()
        this._lastCache = Date.now()
      }
      return this._cachedData
    }
  }
}
```

## 相关链接

- [mapState()](./map-state) - 映射 store 状态
- [mapActions()](./map-actions) - 映射 store action
- [mapWritableState()](./map-writable-state) - 映射可写状态
- [Store 实例](./store-instance) - Store 实例 API
- [Options API 指南](../guide/options-api) - 在 Options API 中使用 Pinia