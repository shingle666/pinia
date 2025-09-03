---
title: mapStores() - Pinia API
description: Complete API reference for mapStores function. Learn how to map multiple stores in Options API components.
keywords: Pinia, Vue.js, mapStores, Options API, store mapping, API reference
author: Pinia Team
generator: VitePress
og:title: mapStores() - Pinia API
og:description: Complete API reference for mapStores function. Learn how to map multiple stores in Options API components.
og:image: /og-image.svg
og:url: https://allfun.net/api/map-stores
twitter:card: summary_large_image
twitter:title: mapStores() - Pinia API
twitter:description: Complete API reference for mapStores function. Learn how to map multiple stores in Options API components.
twitter:image: /og-image.svg
---

# mapStores()

Maps multiple stores to computed properties for use in Options API components. Each store becomes accessible as a computed property.

## Signature

```ts
function mapStores<T extends Record<string, StoreDefinition>>(
  ...stores: [...StoreDefinitions<T>]
): ComputedOptions

function mapStores<T extends Record<string, StoreDefinition>>(
  storesObject: T
): ComputedOptions
```

## Parameters

- **stores**: Store definitions to map (spread syntax)
- **storesObject**: Object with custom names as keys and store definitions as values

## Returns

Computed properties object for Options API components.

## Basic Usage

### Multiple Stores

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'

export default {
  computed: {
    // Maps to this.userStore, this.cartStore, this.productStore
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

### Custom Names

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    // Maps to this.user and this.cart instead of this.userStore and this.cartStore
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

## Store Access

### Accessing State

```js
import { mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapStores(useCounterStore),
    
    // Access store state
    count() {
      return this.counterStore.count
    },
    
    // Access store getters
    doubleCount() {
      return this.counterStore.doubleCount
    }
  }
}
```

### Calling Actions

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

## Advanced Usage

### Conditional Store Access

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

### Store Composition

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
        this.notificationStore.show('App initialized successfully')
      } catch (error) {
        this.notificationStore.showError('Initialization failed')
      }
    }
  }
}
```

### Reactive Store Properties

```js
import { mapStores } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useThemeStore } from '@/stores/theme'

export default {
  computed: {
    ...mapStores(useSettingsStore, useThemeStore),
    
    // Computed properties based on multiple stores
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
    // Watch store changes
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

### Type Safety

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

### Generic Store Mapping

```ts
function createStoreMapper<T extends Record<string, any>>(stores: T) {
  return mapStores(stores)
}

// Usage
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

## Comparison with Other Mapping Functions

### vs mapState

```js
// mapStores - gives access to entire store
computed: {
  ...mapStores(useUserStore),
  
  userName() {
    return this.userStore.name // Access through store
  }
}

// mapState - directly maps state properties
computed: {
  ...mapState(useUserStore, ['name']),
  
  userName() {
    return this.name // Direct access
  }
}
```

### vs mapActions

```js
// mapStores - call actions through store
computed: {
  ...mapStores(useUserStore)
},
methods: {
  login() {
    this.userStore.login() // Call through store
  }
}

// mapActions - directly maps actions
methods: {
  ...mapActions(useUserStore, ['login']),
  
  handleLogin() {
    this.login() // Direct call
  }
}
```

## Best Practices

### 1. Use Descriptive Names

```js
// ✅ Good - clear store names
computed: {
  ...mapStores({
    userProfile: useUserStore,
    shoppingCart: useCartStore,
    productCatalog: useProductStore
  })
}

// ❌ Confusing - unclear names
computed: {
  ...mapStores({
    store1: useUserStore,
    store2: useCartStore
  })
}
```

### 2. Group Related Stores

```js
// ✅ Good - logical grouping
computed: {
  // Auth related
  ...mapStores({
    auth: useAuthStore,
    user: useUserStore
  }),
  
  // E-commerce related
  ...mapStores({
    cart: useCartStore,
    products: useProductStore,
    orders: useOrderStore
  })
}
```

### 3. Combine with Other Computed Properties

```js
computed: {
  ...mapStores(useUserStore, useCartStore),
  
  // Derived computed properties
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

### 4. Use with Watchers

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

## Common Patterns

### Store Facade

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { usePreferencesStore } from '@/stores/preferences'

export default {
  computed: {
    ...mapStores(useUserStore, usePreferencesStore),
    
    // Create a unified interface
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

### Conditional Store Loading

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

### Store Synchronization

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

## Migration from Vuex

### Vuex Modules

```js
// Vuex
computed: {
  ...mapState({
    user: state => state.user,
    cart: state => state.cart
  })
}

// Pinia with mapStores
computed: {
  ...mapStores({
    user: useUserStore,
    cart: useCartStore
  })
}
```

### Namespaced Modules

```js
// Vuex namespaced
computed: {
  ...mapState('user', ['profile']),
  ...mapState('cart', ['items'])
}

// Pinia equivalent
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

## Performance Considerations

### Lazy Store Access

```js
computed: {
  // Only map stores that are actually used
  ...mapStores(useUserStore), // Always needed
  
  // Conditionally map expensive stores
  ...(this.needsAdminFeatures ? mapStores(useAdminStore) : {})
}
```

### Memoized Store Access

```js
import { mapStores } from 'pinia'
import { useExpensiveStore } from '@/stores/expensive'

export default {
  computed: {
    ...mapStores(useExpensiveStore),
    
    // Cache expensive computations
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

## See Also

- [mapState()](./map-state) - Map store state
- [mapActions()](./map-actions) - Map store actions
- [mapWritableState()](./map-writable-state) - Map writable state
- [Store Instance](./store-instance) - Store instance API
- [Options API Guide](../guide/options-api) - Using Pinia with Options API