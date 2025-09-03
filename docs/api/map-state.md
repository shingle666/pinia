---
title: mapState() - Pinia API
description: Complete API reference for mapState function. Learn how to map store state properties in Options API components.
keywords: Pinia, Vue.js, mapState, Options API, state mapping, API reference
author: Pinia Team
generator: VitePress
og:title: mapState() - Pinia API
og:description: Complete API reference for mapState function. Learn how to map store state properties in Options API components.
og:image: /og-image.svg
og:url: https://allfun.net/api/map-state
twitter:card: summary_large_image
twitter:title: mapState() - Pinia API
twitter:description: Complete API reference for mapState function. Learn how to map store state properties in Options API components.
twitter:image: /og-image.svg
---

# mapState()

Maps store state properties and getters to computed properties in Options API components. Provides direct access to state without needing the store instance.

## Signature

```ts
function mapState<T>(
  useStore: () => T,
  keys: (keyof T)[] | Record<string, keyof T | ((store: T) => any)>
): ComputedOptions

function mapState<T>(
  useStore: () => T,
  keysAndMapper: Record<string, string | ((store: T) => any)>
): ComputedOptions
```

## Parameters

- **useStore**: Store definition function
- **keys**: Array of state property names or object with custom mappings
- **keysAndMapper**: Object mapping custom names to state properties or getter functions

## Returns

Computed properties object for Options API components.

## Basic Usage

### Array Syntax

```js
import { mapState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // Maps this.count, this.doubleCount from store
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <p>Double: {{ doubleCount }}</p>
    </div>
  `
}
```

### Object Syntax

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    // Custom property names
    ...mapState(useUserStore, {
      userName: 'name',
      userEmail: 'email',
      isLoggedIn: 'authenticated'
    })
  },
  
  template: `
    <div v-if="isLoggedIn">
      <h1>Welcome {{ userName }}</h1>
      <p>Email: {{ userEmail }}</p>
    </div>
  `
}
```

### Function Syntax

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapState(useUserStore, {
      // Access state directly
      userName: 'name',
      
      // Use getter function for computed values
      userInfo: (store) => `${store.name} (${store.email})`,
      
      // Access nested properties
      userPreferences: (store) => store.profile.preferences,
      
      // Combine with other stores
      userSummary: (store) => {
        const cartStore = useCartStore()
        return {
          name: store.name,
          cartItems: cartStore.items.length
        }
      }
    })
  }
}
```

## State vs Getters

### Mapping State Properties

```js
// Store definition
export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    selectedProduct: null,
    filters: {
      category: '',
      priceRange: [0, 1000]
    }
  }),
  
  getters: {
    filteredProducts: (state) => {
      return state.products.filter(product => {
        return product.category.includes(state.filters.category)
      })
    },
    
    selectedProductPrice: (state) => {
      return state.selectedProduct?.price || 0
    }
  }
})

// Component
export default {
  computed: {
    // Map state properties
    ...mapState(useProductStore, [
      'products',
      'selectedProduct',
      'filters'
    ]),
    
    // Map getters
    ...mapState(useProductStore, [
      'filteredProducts',
      'selectedProductPrice'
    ])
  }
}
```

### Nested State Access

```js
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  computed: {
    ...mapState(useSettingsStore, {
      // Direct nested access
      theme: (store) => store.ui.theme,
      language: (store) => store.ui.language,
      
      // Complex nested access
      notificationSettings: (store) => store.user.preferences.notifications,
      
      // Computed from nested state
      isDarkMode: (store) => store.ui.theme === 'dark',
      
      // Multiple nested properties
      uiConfig: (store) => ({
        theme: store.ui.theme,
        layout: store.ui.layout,
        sidebar: store.ui.sidebar
      })
    })
  }
}
```

## Advanced Usage

### Conditional Mapping

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    ...mapState(useUserStore, ['name', 'role']),
    
    // Conditional mapping based on user role
    ...mapState(useUserStore, {
      adminData: (store) => {
        if (store.role === 'admin') {
          const adminStore = useAdminStore()
          return adminStore.adminData
        }
        return null
      }
    })
  }
}
```

### Multiple Store Mapping

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'

export default {
  computed: {
    // User store
    ...mapState(useUserStore, ['name', 'email']),
    
    // Cart store
    ...mapState(useCartStore, {
      cartItemCount: 'itemCount',
      cartTotal: 'total'
    }),
    
    // Product store
    ...mapState(useProductStore, {
      availableProducts: 'products',
      selectedProduct: 'currentProduct'
    }),
    
    // Combined computed property
    userCartSummary() {
      return {
        user: this.name,
        items: this.cartItemCount,
        total: this.cartTotal,
        selectedProduct: this.selectedProduct?.name
      }
    }
  }
}
```

### Dynamic State Access

```js
import { mapState } from 'pinia'
import { useDataStore } from '@/stores/data'

export default {
  props: ['entityType'],
  
  computed: {
    ...mapState(useDataStore, {
      // Dynamic property access based on props
      entities: (store) => store[this.entityType] || [],
      
      // Dynamic getter access
      filteredEntities: (store) => {
        const getterName = `filtered${this.entityType.charAt(0).toUpperCase() + this.entityType.slice(1)}`
        return store[getterName] || []
      },
      
      // Dynamic computed properties
      entityCount: (store) => (store[this.entityType] || []).length
    })
  }
}
```

## TypeScript

### Type Safety

```ts
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import type { ComputedOptions } from 'vue'

interface ComponentComputed {
  userName: string
  userEmail: string
  isAuthenticated: boolean
  userProfile: {
    name: string
    email: string
    preferences: Record<string, any>
  }
}

export default defineComponent({
  computed: {
    ...mapState(useUserStore, {
      userName: 'name',
      userEmail: 'email',
      isAuthenticated: 'authenticated',
      userProfile: (store) => ({
        name: store.name,
        email: store.email,
        preferences: store.preferences
      })
    })
  } as ComputedOptions<ComponentComputed>
})
```

### Generic State Mapping

```ts
function createStateMapper<T extends Record<string, any>>(
  useStore: () => T,
  keys: (keyof T)[]
) {
  return mapState(useStore, keys)
}

// Usage
const userStateMap = createStateMapper(useUserStore, ['name', 'email', 'authenticated'])

export default {
  computed: {
    ...userStateMap
  }
}
```

### Typed Store Access

```ts
import { mapState } from 'pinia'
import type { UserStore } from '@/stores/user'

interface MappedState {
  userName: string
  userEmail: string
  fullUserInfo: string
}

export default defineComponent({
  computed: {
    ...mapState(useUserStore, {
      userName: 'name',
      userEmail: 'email',
      fullUserInfo: (store: UserStore) => `${store.name} <${store.email}>`
    } as Record<keyof MappedState, keyof UserStore | ((store: UserStore) => any)>)
  }
})
```

## Performance Optimization

### Selective Mapping

```js
import { mapState } from 'pinia'
import { useLargeDataStore } from '@/stores/largeData'

export default {
  computed: {
    // Only map what you need
    ...mapState(useLargeDataStore, {
      // Instead of mapping entire large object
      // largeData: 'data',
      
      // Map only specific properties
      dataLength: (store) => store.data.length,
      firstItem: (store) => store.data[0],
      lastItem: (store) => store.data[store.data.length - 1]
    })
  }
}
```

### Memoized Computations

```js
import { mapState } from 'pinia'
import { useExpensiveStore } from '@/stores/expensive'

export default {
  computed: {
    ...mapState(useExpensiveStore, {
      // Memoize expensive computations
      expensiveComputation: (store) => {
        // Use a getter that's already memoized in the store
        return store.memoizedExpensiveGetter
      },
      
      // Or implement simple caching
      cachedResult: (store) => {
        const cacheKey = `${store.param1}-${store.param2}`
        if (!this._cache || this._cacheKey !== cacheKey) {
          this._cache = store.computeExpensiveResult()
          this._cacheKey = cacheKey
        }
        return this._cache
      }
    })
  }
}
```

## Common Patterns

### Form Binding

```js
import { mapState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapState(useFormStore, {
      // Form field values
      formData: 'data',
      formErrors: 'errors',
      isValid: 'valid',
      
      // Computed form state
      canSubmit: (store) => store.valid && !store.submitting,
      errorCount: (store) => Object.keys(store.errors).length
    })
  },
  
  template: `
    <form @submit.prevent="submitForm">
      <input v-model="formData.name" :class="{ error: formErrors.name }">
      <p v-if="formErrors.name">{{ formErrors.name }}</p>
      
      <button :disabled="!canSubmit">Submit</button>
      <p v-if="errorCount > 0">{{ errorCount }} errors found</p>
    </form>
  `
}
```

### List Rendering

```js
import { mapState } from 'pinia'
import { useItemsStore } from '@/stores/items'

export default {
  computed: {
    ...mapState(useItemsStore, {
      items: 'items',
      loading: 'loading',
      
      // Computed list properties
      itemCount: (store) => store.items.length,
      hasItems: (store) => store.items.length > 0,
      
      // Filtered/sorted items
      sortedItems: (store) => {
        return [...store.items].sort((a, b) => a.name.localeCompare(b.name))
      },
      
      // Grouped items
      groupedItems: (store) => {
        return store.items.reduce((groups, item) => {
          const group = item.category
          groups[group] = groups[group] || []
          groups[group].push(item)
          return groups
        }, {})
      }
    })
  },
  
  template: `
    <div>
      <p v-if="loading">Loading...</p>
      <p v-else-if="!hasItems">No items found</p>
      <div v-else>
        <p>Total items: {{ itemCount }}</p>
        <div v-for="(items, category) in groupedItems" :key="category">
          <h3>{{ category }}</h3>
          <ul>
            <li v-for="item in items" :key="item.id">
              {{ item.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  `
}
```

### Conditional Rendering

```js
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

export default {
  computed: {
    ...mapState(useAuthStore, {
      user: 'currentUser',
      isAuthenticated: 'authenticated',
      userRole: (store) => store.currentUser?.role
    }),
    
    ...mapState(useUIStore, {
      showSidebar: 'sidebarVisible',
      theme: 'currentTheme'
    }),
    
    // Conditional display logic
    showAdminPanel() {
      return this.isAuthenticated && this.userRole === 'admin'
    },
    
    showUserMenu() {
      return this.isAuthenticated && this.showSidebar
    },
    
    cssClasses() {
      return {
        'theme-dark': this.theme === 'dark',
        'sidebar-open': this.showSidebar,
        'user-authenticated': this.isAuthenticated
      }
    }
  }
}
```

## Migration from Vuex

### Vuex mapState

```js
// Vuex
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      count: state => state.count,
      countAlias: 'count',
      countPlusLocalState(state) {
        return state.count + this.localCount
      }
    })
  }
}

// Pinia equivalent
import { mapState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapState(useCounterStore, {
      count: 'count',
      countAlias: 'count',
      countPlusLocalState: (store) => store.count + this.localCount
    })
  }
}
```

### Vuex Namespaced Modules

```js
// Vuex namespaced
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('user', {
      name: 'name',
      email: 'email'
    }),
    ...mapState('cart', {
      items: 'items',
      total: 'total'
    })
  }
}

// Pinia equivalent
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapState(useUserStore, {
      name: 'name',
      email: 'email'
    }),
    ...mapState(useCartStore, {
      items: 'items',
      total: 'total'
    })
  }
}
```

## Best Practices

### 1. Use Descriptive Names

```js
// ✅ Good - clear property names
computed: {
  ...mapState(useUserStore, {
    currentUserName: 'name',
    currentUserEmail: 'email',
    isCurrentUserAdmin: (store) => store.role === 'admin'
  })
}

// ❌ Confusing - unclear names
computed: {
  ...mapState(useUserStore, {
    n: 'name',
    e: 'email',
    a: (store) => store.role === 'admin'
  })
}
```

### 2. Group Related State

```js
// ✅ Good - logical grouping
computed: {
  // User information
  ...mapState(useUserStore, {
    userName: 'name',
    userEmail: 'email',
    userRole: 'role'
  }),
  
  // UI state
  ...mapState(useUIStore, {
    sidebarOpen: 'sidebarVisible',
    currentTheme: 'theme',
    loading: 'isLoading'
  })
}
```

### 3. Prefer Getters for Computed Values

```js
// ✅ Good - use store getters
computed: {
  ...mapState(useProductStore, [
    'filteredProducts', // This is a getter
    'sortedProducts',   // This is a getter
    'productCount'      // This is a getter
  ])
}

// ❌ Less efficient - compute in component
computed: {
  ...mapState(useProductStore, {
    filteredProducts: (store) => {
      // This computation happens in every component instance
      return store.products.filter(p => p.active)
    }
  })
}
```

### 4. Handle Undefined State

```js
computed: {
  ...mapState(useUserStore, {
    userName: (store) => store.user?.name || 'Guest',
    userAvatar: (store) => store.user?.avatar || '/default-avatar.png',
    userPreferences: (store) => store.user?.preferences || {}
  })
}
```

## See Also

- [mapStores()](./map-stores) - Map entire stores
- [mapActions()](./map-actions) - Map store actions
- [mapWritableState()](./map-writable-state) - Map writable state
- [storeToRefs()](./store-to-refs) - Convert store to refs
- [Options API Guide](../guide/options-api) - Using Pinia with Options API