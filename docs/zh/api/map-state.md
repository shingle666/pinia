---
title: mapState() - Pinia API
description: mapState 函数的完整 API 参考。学习如何在 Options API 组件中映射 store 状态属性。
keywords: Pinia, Vue.js, mapState, Options API, 状态映射, API 参考
author: Pinia Team
generator: VitePress
og:title: mapState() - Pinia API
og:description: mapState 函数的完整 API 参考。学习如何在 Options API 组件中映射 store 状态属性。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/map-state
twitter:card: summary_large_image
twitter:title: mapState() - Pinia API
twitter:description: mapState 函数的完整 API 参考。学习如何在 Options API 组件中映射 store 状态属性。
twitter:image: /og-image.svg
---

# mapState()

将 store 状态属性和 getter 映射为 Options API 组件中的计算属性。提供对状态的直接访问，无需 store 实例。

## 函数签名

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

## 参数

- **useStore**: Store 定义函数
- **keys**: 状态属性名称数组或自定义映射对象
- **keysAndMapper**: 将自定义名称映射到状态属性或 getter 函数的对象

## 返回值

用于 Options API 组件的计算属性对象。

## 基本用法

### 数组语法

```js
import { mapState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // 从 store 映射 this.count, this.doubleCount
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  
  template: `
    <div>
      <p>计数: {{ count }}</p>
      <p>双倍: {{ doubleCount }}</p>
    </div>
  `
}
```

### 对象语法

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    // 自定义属性名称
    ...mapState(useUserStore, {
      userName: 'name',
      userEmail: 'email',
      isLoggedIn: 'authenticated'
    })
  },
  
  template: `
    <div v-if="isLoggedIn">
      <h1>欢迎 {{ userName }}</h1>
      <p>邮箱: {{ userEmail }}</p>
    </div>
  `
}
```

### 函数语法

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapState(useUserStore, {
      // 直接访问状态
      userName: 'name',
      
      // 使用 getter 函数计算值
      userInfo: (store) => `${store.name} (${store.email})`,
      
      // 访问嵌套属性
      userPreferences: (store) => store.profile.preferences,
      
      // 与其他 store 结合
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

## 状态 vs Getter

### 映射状态属性

```js
// Store 定义
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

// 组件
export default {
  computed: {
    // 映射状态属性
    ...mapState(useProductStore, [
      'products',
      'selectedProduct',
      'filters'
    ]),
    
    // 映射 getter
    ...mapState(useProductStore, [
      'filteredProducts',
      'selectedProductPrice'
    ])
  }
}
```

### 嵌套状态访问

```js
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  computed: {
    ...mapState(useSettingsStore, {
      // 直接嵌套访问
      theme: (store) => store.ui.theme,
      language: (store) => store.ui.language,
      
      // 复杂嵌套访问
      notificationSettings: (store) => store.user.preferences.notifications,
      
      // 从嵌套状态计算
      isDarkMode: (store) => store.ui.theme === 'dark',
      
      // 多个嵌套属性
      uiConfig: (store) => ({
        theme: store.ui.theme,
        layout: store.ui.layout,
        sidebar: store.ui.sidebar
      })
    })
  }
}
```

## 高级用法

### 条件映射

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    ...mapState(useUserStore, ['name', 'role']),
    
    // 基于用户角色的条件映射
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

### 多 Store 映射

```js
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'

export default {
  computed: {
    // 用户 store
    ...mapState(useUserStore, ['name', 'email']),
    
    // 购物车 store
    ...mapState(useCartStore, {
      cartItemCount: 'itemCount',
      cartTotal: 'total'
    }),
    
    // 产品 store
    ...mapState(useProductStore, {
      availableProducts: 'products',
      selectedProduct: 'currentProduct'
    }),
    
    // 组合计算属性
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

### 动态状态访问

```js
import { mapState } from 'pinia'
import { useDataStore } from '@/stores/data'

export default {
  props: ['entityType'],
  
  computed: {
    ...mapState(useDataStore, {
      // 基于 props 的动态属性访问
      entities: (store) => store[this.entityType] || [],
      
      // 动态 getter 访问
      filteredEntities: (store) => {
        const getterName = `filtered${this.entityType.charAt(0).toUpperCase() + this.entityType.slice(1)}`
        return store[getterName] || []
      },
      
      // 动态计算属性
      entityCount: (store) => (store[this.entityType] || []).length
    })
  }
}
```

## TypeScript

### 类型安全

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

### 泛型状态映射

```ts
function createStateMapper<T extends Record<string, any>>(
  useStore: () => T,
  keys: (keyof T)[]
) {
  return mapState(useStore, keys)
}

// 使用
const userStateMap = createStateMapper(useUserStore, ['name', 'email', 'authenticated'])

export default {
  computed: {
    ...userStateMap
  }
}
```

### 类型化 Store 访问

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

## 性能优化

### 选择性映射

```js
import { mapState } from 'pinia'
import { useLargeDataStore } from '@/stores/largeData'

export default {
  computed: {
    // 只映射需要的内容
    ...mapState(useLargeDataStore, {
      // 不要映射整个大对象
      // largeData: 'data',
      
      // 只映射特定属性
      dataLength: (store) => store.data.length,
      firstItem: (store) => store.data[0],
      lastItem: (store) => store.data[store.data.length - 1]
    })
  }
}
```

### 记忆化计算

```js
import { mapState } from 'pinia'
import { useExpensiveStore } from '@/stores/expensive'

export default {
  computed: {
    ...mapState(useExpensiveStore, {
      // 记忆化昂贵的计算
      expensiveComputation: (store) => {
        // 使用 store 中已经记忆化的 getter
        return store.memoizedExpensiveGetter
      },
      
      // 或实现简单缓存
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

## 常见模式

### 表单绑定

```js
import { mapState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapState(useFormStore, {
      // 表单字段值
      formData: 'data',
      formErrors: 'errors',
      isValid: 'valid',
      
      // 计算表单状态
      canSubmit: (store) => store.valid && !store.submitting,
      errorCount: (store) => Object.keys(store.errors).length
    })
  },
  
  template: `
    <form @submit.prevent="submitForm">
      <input v-model="formData.name" :class="{ error: formErrors.name }">
      <p v-if="formErrors.name">{{ formErrors.name }}</p>
      
      <button :disabled="!canSubmit">提交</button>
      <p v-if="errorCount > 0">发现 {{ errorCount }} 个错误</p>
    </form>
  `
}
```

### 列表渲染

```js
import { mapState } from 'pinia'
import { useItemsStore } from '@/stores/items'

export default {
  computed: {
    ...mapState(useItemsStore, {
      items: 'items',
      loading: 'loading',
      
      // 计算列表属性
      itemCount: (store) => store.items.length,
      hasItems: (store) => store.items.length > 0,
      
      // 过滤/排序项目
      sortedItems: (store) => {
        return [...store.items].sort((a, b) => a.name.localeCompare(b.name))
      },
      
      // 分组项目
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
      <p v-if="loading">加载中...</p>
      <p v-else-if="!hasItems">未找到项目</p>
      <div v-else>
        <p>总项目数: {{ itemCount }}</p>
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

### 条件渲染

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
    
    // 条件显示逻辑
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

## 从 Vuex 迁移

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

// Pinia 等价写法
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

### Vuex 命名空间模块

```js
// Vuex 命名空间
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

// Pinia 等价写法
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

## 最佳实践

### 1. 使用描述性名称

```js
// ✅ 好 - 清晰的属性名称
computed: {
  ...mapState(useUserStore, {
    currentUserName: 'name',
    currentUserEmail: 'email',
    isCurrentUserAdmin: (store) => store.role === 'admin'
  })
}

// ❌ 混乱 - 不清楚的名称
computed: {
  ...mapState(useUserStore, {
    n: 'name',
    e: 'email',
    a: (store) => store.role === 'admin'
  })
}
```

### 2. 分组相关状态

```js
// ✅ 好 - 逻辑分组
computed: {
  // 用户信息
  ...mapState(useUserStore, {
    userName: 'name',
    userEmail: 'email',
    userRole: 'role'
  }),
  
  // UI 状态
  ...mapState(useUIStore, {
    sidebarOpen: 'sidebarVisible',
    currentTheme: 'theme',
    loading: 'isLoading'
  })
}
```

### 3. 优先使用 Getter 计算值

```js
// ✅ 好 - 使用 store getter
computed: {
  ...mapState(useProductStore, [
    'filteredProducts', // 这是一个 getter
    'sortedProducts',   // 这是一个 getter
    'productCount'      // 这是一个 getter
  ])
}

// ❌ 效率较低 - 在组件中计算
computed: {
  ...mapState(useProductStore, {
    filteredProducts: (store) => {
      // 这个计算在每个组件实例中都会发生
      return store.products.filter(p => p.active)
    }
  })
}
```

### 4. 处理未定义状态

```js
computed: {
  ...mapState(useUserStore, {
    userName: (store) => store.user?.name || '访客',
    userAvatar: (store) => store.user?.avatar || '/default-avatar.png',
    userPreferences: (store) => store.user?.preferences || {}
  })
}
```

## 相关链接

- [mapStores()](./map-stores) - 映射整个 store
- [mapActions()](./map-actions) - 映射 store action
- [mapWritableState()](./map-writable-state) - 映射可写状态
- [storeToRefs()](./store-to-refs) - 将 store 转换为 ref
- [Options API 指南](../guide/options-api) - 在 Options API 中使用 Pinia