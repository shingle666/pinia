---
title: mapWritableState() - Pinia API
description: mapWritableState 函数的完整 API 参考。学习如何在 Options API 组件中映射可写的 store 状态属性。
keywords: Pinia, Vue.js, mapWritableState, Options API, 可写状态映射, API 参考
author: Pinia Team
generator: VitePress
og:title: mapWritableState() - Pinia API
og:description: mapWritableState 函数的完整 API 参考。学习如何在 Options API 组件中映射可写的 store 状态属性。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/map-writable-state
twitter:card: summary_large_image
twitter:title: mapWritableState() - Pinia API
twitter:description: mapWritableState 函数的完整 API 参考。学习如何在 Options API 组件中映射可写的 store 状态属性。
twitter:image: /og-image.svg
---

# mapWritableState()

将 store 状态属性映射为 Options API 组件中的可写计算属性。与 `mapState()` 不同，这允许从组件直接修改状态属性。

## 函数签名

```ts
function mapWritableState<T>(
  useStore: () => T,
  keys: (keyof T)[] | Record<string, keyof T>
): WritableComputedOptions
```

## 参数

- **useStore**: Store 定义函数
- **keys**: 状态属性名称数组或自定义映射对象

## 返回值

用于 Options API 组件的可写计算属性对象。

## 基本用法

### 数组语法

```js
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // 将 this.count, this.name 映射为可写计算属性
    ...mapWritableState(useCounterStore, ['count', 'name'])
  },
  
  methods: {
    increment() {
      this.count++ // 直接修改
    },
    
    updateName(newName) {
      this.name = newName // 直接赋值
    }
  },
  
  template: `
    <div>
      <p>计数: {{ count }}</p>
      <button @click="increment">+</button>
      
      <input v-model="name" placeholder="输入名称">
    </div>
  `
}
```

### 对象语法

```js
import { mapWritableState } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    // 自定义属性名称
    ...mapWritableState(useUserStore, {
      userName: 'name',
      userEmail: 'email',
      userAge: 'age'
    })
  },
  
  methods: {
    updateProfile(profile) {
      this.userName = profile.name
      this.userEmail = profile.email
      this.userAge = profile.age
    }
  },
  
  template: `
    <form @submit.prevent="saveProfile">
      <input v-model="userName" placeholder="姓名">
      <input v-model="userEmail" placeholder="邮箱">
      <input v-model.number="userAge" placeholder="年龄">
      <button type="submit">保存</button>
    </form>
  `
}
```

## 表单绑定

### 双向数据绑定

```js
import { mapWritableState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapWritableState(useFormStore, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address'
    ])
  },
  
  template: `
    <form>
      <div class="form-group">
        <label>名:</label>
        <input v-model="firstName" type="text">
      </div>
      
      <div class="form-group">
        <label>姓:</label>
        <input v-model="lastName" type="text">
      </div>
      
      <div class="form-group">
        <label>邮箱:</label>
        <input v-model="email" type="email">
      </div>
      
      <div class="form-group">
        <label>电话:</label>
        <input v-model="phone" type="tel">
      </div>
      
      <div class="form-group">
        <label>地址:</label>
        <textarea v-model="address"></textarea>
      </div>
    </form>
  `
}
```

### 复杂表单状态

```js
import { mapWritableState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  computed: {
    ...mapWritableState(useSettingsStore, {
      darkMode: 'theme.dark',
      language: 'locale.language',
      notifications: 'preferences.notifications',
      autoSave: 'preferences.autoSave'
    })
  },
  
  template: `
    <div class="settings-panel">
      <div class="setting-item">
        <label>
          <input v-model="darkMode" type="checkbox">
          深色模式
        </label>
      </div>
      
      <div class="setting-item">
        <label>语言:</label>
        <select v-model="language">
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      
      <div class="setting-item">
        <label>
          <input v-model="notifications" type="checkbox">
          启用通知
        </label>
      </div>
      
      <div class="setting-item">
        <label>
          <input v-model="autoSave" type="checkbox">
          自动保存
        </label>
      </div>
    </div>
  `
}
```

## 高级用法

### 嵌套状态属性

```js
import { mapWritableState } from 'pinia'
import { useProfileStore } from '@/stores/profile'

// Store 定义
export const useProfileStore = defineStore('profile', {
  state: () => ({
    user: {
      personal: {
        name: '',
        email: '',
        avatar: ''
      },
      preferences: {
        theme: 'light',
        language: 'zh',
        notifications: true
      }
    }
  })
})

// 组件
export default {
  computed: {
    // 注意: mapWritableState 最适合扁平状态属性
    // 对于嵌套属性，考虑使用 store action 或直接 store 访问
    ...mapWritableState(useProfileStore, {
      // 这些需要在 store 中扁平化或以不同方式访问
      userName: (store) => store.user.personal.name,
      userEmail: (store) => store.user.personal.email
    })
  },
  
  methods: {
    // 嵌套状态的更好方法
    updatePersonalInfo(info) {
      const store = useProfileStore()
      store.user.personal = { ...store.user.personal, ...info }
    }
  }
}
```

### 条件可写状态

```js
import { mapWritableState } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

export default {
  computed: {
    ...mapWritableState(useUserStore, ['name', 'email']),
    
    // 基于用户权限的条件可写
    adminSettings: {
      get() {
        const userStore = useUserStore()
        if (userStore.isAdmin) {
          const adminStore = useAdminStore()
          return adminStore.settings
        }
        return null
      },
      set(value) {
        const userStore = useUserStore()
        if (userStore.isAdmin) {
          const adminStore = useAdminStore()
          adminStore.settings = value
        }
      }
    }
  }
}
```

### 数组和对象状态

```js
import { mapWritableState } from 'pinia'
import { useListStore } from '@/stores/list'

export default {
  computed: {
    ...mapWritableState(useListStore, ['items', 'filters'])
  },
  
  methods: {
    addItem(item) {
      this.items.push(item) // 直接数组修改
    },
    
    removeItem(index) {
      this.items.splice(index, 1) // 直接数组修改
    },
    
    updateFilter(key, value) {
      this.filters[key] = value // 直接对象修改
    },
    
    clearFilters() {
      this.filters = {} // 直接对象替换
    }
  },
  
  template: `
    <div>
      <div class="filters">
        <input 
          v-model="filters.search" 
          placeholder="搜索..."
        >
        <select v-model="filters.category">
          <option value="">所有分类</option>
          <option value="tech">技术</option>
          <option value="design">设计</option>
        </select>
      </div>
      
      <ul class="items">
        <li v-for="(item, index) in items" :key="item.id">
          {{ item.name }}
          <button @click="removeItem(index)">删除</button>
        </li>
      </ul>
      
      <button @click="addItem({ id: Date.now(), name: '新项目' })">
        添加项目
      </button>
    </div>
  `
}
```

## TypeScript

### 类型安全

```ts
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import type { WritableComputedOptions } from 'vue'

interface ComponentComputed {
  count: number
  name: string
  isActive: boolean
}

export default defineComponent({
  computed: {
    ...mapWritableState(useCounterStore, [
      'count',
      'name', 
      'isActive'
    ])
  } as WritableComputedOptions<ComponentComputed>
})
```

### 泛型可写状态映射

```ts
function createWritableStateMapper<
  T extends Record<string, any>,
  K extends keyof T
>(
  useStore: () => T,
  keys: K[]
): WritableComputedOptions<Pick<T, K>> {
  return mapWritableState(useStore, keys)
}

// 使用
const writableUserState = createWritableStateMapper(
  useUserStore, 
  ['name', 'email', 'age']
)

export default {
  computed: {
    ...writableUserState
  }
}
```

## 与其他映射函数的比较

### vs mapState

```js
// mapState - 只读访问
computed: {
  ...mapState(useCounterStore, ['count']),
  
  // 这不会工作 - 计算属性默认是只读的
  // this.count = 10 // 错误!
}

// mapWritableState - 读写访问
computed: {
  ...mapWritableState(useCounterStore, ['count']),
  
  // 这可以工作 - 可写计算属性
  // this.count = 10 // ✅ 可以!
}
```

### vs 直接 Store 访问

```js
// 直接 store 访问
export default {
  computed: {
    count: {
      get() {
        const store = useCounterStore()
        return store.count
      },
      set(value) {
        const store = useCounterStore()
        store.count = value
      }
    }
  }
}

// mapWritableState - 等价但更简洁
export default {
  computed: {
    ...mapWritableState(useCounterStore, ['count'])
  }
}
```

## 性能考虑

### 选择性映射

```js
// ✅ 好 - 只映射需要修改的内容
computed: {
  ...mapWritableState(useFormStore, [
    'firstName', // 将被修改
    'lastName',  // 将被修改
    'email'      // 将被修改
  ]),
  
  // 对只读属性使用 mapState
  ...mapState(useFormStore, [
    'isValid',   // 只读
    'errors',    // 只读
    'submitting' // 只读
  ])
}

// ❌ 效率较低 - 将所有内容映射为可写
computed: {
  ...mapWritableState(useFormStore, [
    'firstName', 'lastName', 'email',
    'isValid', 'errors', 'submitting' // 这些不需要可写
  ])
}
```

### 批量更新

```js
import { mapWritableState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapWritableState(useFormStore, [
      'firstName',
      'lastName',
      'email'
    ])
  },
  
  methods: {
    // ✅ 好 - 批量更新
    updateProfile(profile) {
      // 使用 store action 进行批量更新
      const store = useFormStore()
      store.updateProfile(profile)
    },
    
    // ❌ 效率较低 - 单独更新
    updateProfileIndividually(profile) {
      this.firstName = profile.firstName // 触发响应式
      this.lastName = profile.lastName   // 触发响应式
      this.email = profile.email         // 触发响应式
    }
  }
}
```

## 常见模式

### 表单验证

```js
import { mapWritableState } from 'pinia'
import { useFormStore } from '@/stores/form'

export default {
  computed: {
    ...mapWritableState(useFormStore, [
      'email',
      'password',
      'confirmPassword'
    ]),
    
    ...mapState(useFormStore, [
      'errors',
      'isValid'
    ])
  },
  
  watch: {
    email(newEmail) {
      // 邮箱变化时验证
      const store = useFormStore()
      store.validateEmail(newEmail)
    },
    
    password(newPassword) {
      // 密码变化时验证
      const store = useFormStore()
      store.validatePassword(newPassword)
    }
  },
  
  template: `
    <form>
      <div>
        <input 
          v-model="email" 
          type="email" 
          :class="{ error: errors.email }"
        >
        <span v-if="errors.email">{{ errors.email }}</span>
      </div>
      
      <div>
        <input 
          v-model="password" 
          type="password"
          :class="{ error: errors.password }"
        >
        <span v-if="errors.password">{{ errors.password }}</span>
      </div>
      
      <button :disabled="!isValid">提交</button>
    </form>
  `
}
```

### 设置面板

```js
import { mapWritableState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

export default {
  computed: {
    ...mapWritableState(useSettingsStore, [
      'theme',
      'language',
      'notifications',
      'autoSave',
      'fontSize'
    ])
  },
  
  watch: {
    // 设置变化时自动保存
    theme() { this.saveSettings() },
    language() { this.saveSettings() },
    notifications() { this.saveSettings() },
    autoSave() { this.saveSettings() },
    fontSize() { this.saveSettings() }
  },
  
  methods: {
    saveSettings() {
      const store = useSettingsStore()
      store.saveToLocalStorage()
    },
    
    resetToDefaults() {
      const store = useSettingsStore()
      store.resetToDefaults()
    }
  }
}
```

### 购物车

```js
import { mapWritableState } from 'pinia'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapWritableState(useCartStore, ['items']),
    
    ...mapState(useCartStore, [
      'total',
      'itemCount',
      'shipping'
    ])
  },
  
  methods: {
    updateQuantity(itemId, quantity) {
      const item = this.items.find(item => item.id === itemId)
      if (item) {
        item.quantity = quantity
      }
    },
    
    removeItem(itemId) {
      const index = this.items.findIndex(item => item.id === itemId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    }
  },
  
  template: `
    <div class="cart">
      <div v-for="item in items" :key="item.id" class="cart-item">
        <span>{{ item.name }}</span>
        <input 
          v-model.number="item.quantity" 
          type="number" 
          min="1"
          @change="updateQuantity(item.id, item.quantity)"
        >
        <button @click="removeItem(item.id)">删除</button>
      </div>
      
      <div class="cart-summary">
        <p>商品数量: {{ itemCount }}</p>
        <p>总计: ¥{{ total }}</p>
      </div>
    </div>
  `
}
```

## 最佳实践

### 1. 用于表单字段和用户输入

```js
// ✅ 好 - 非常适合表单字段
computed: {
  ...mapWritableState(useFormStore, [
    'firstName',
    'lastName',
    'email',
    'phone'
  ])
}

// ❌ 避免 - 计算值应该使用 getter
computed: {
  ...mapWritableState(useUserStore, [
    'fullName' // 这应该是 getter，而不是可写状态
  ])
}
```

### 2. 与只读状态结合

```js
// ✅ 好 - 根据需要混合可写和只读
computed: {
  // 用户输入的可写状态
  ...mapWritableState(useFormStore, [
    'name',
    'email',
    'message'
  ]),
  
  // 显示的只读状态
  ...mapState(useFormStore, [
    'isValid',
    'errors',
    'submitting'
  ])
}
```

### 3. 变化时验证

```js
computed: {
  ...mapWritableState(useFormStore, ['email'])
},

watch: {
  email: {
    handler(newEmail) {
      const store = useFormStore()
      store.validateField('email', newEmail)
    },
    immediate: true
  }
}
```

### 4. 小心处理嵌套状态

```js
// ✅ 好 - 对复杂嵌套更新使用 action
methods: {
  updateUserProfile(profile) {
    const store = useUserStore()
    store.updateProfile(profile) // 使用 store action
  }
}

// ❌ 避免 - 组件中的复杂嵌套修改
computed: {
  userProfile: {
    get() {
      return this.userStore.user.profile
    },
    set(value) {
      // 这可能容易出错且难以跟踪
      this.userStore.user.profile = value
    }
  }
}
```

## 从 Vuex 迁移

### Vuex 双向计算属性

```js
// Vuex
computed: {
  message: {
    get() {
      return this.$store.state.message
    },
    set(value) {
      this.$store.commit('updateMessage', value)
    }
  }
}

// Pinia 使用 mapWritableState
computed: {
  ...mapWritableState(useMessageStore, ['message'])
}
```

### Vuex v-model 与 Store

```js
// Vuex - 复杂的 v-model 设置
computed: {
  inputValue: {
    get() {
      return this.$store.state.form.inputValue
    },
    set(value) {
      this.$store.dispatch('updateInputValue', value)
    }
  }
}

// Pinia - 简单的 v-model
computed: {
  ...mapWritableState(useFormStore, ['inputValue'])
}

// 模板保持不变
// <input v-model="inputValue">
```

## 相关链接

- [mapState()](./map-state) - 映射只读 store 状态
- [mapStores()](./map-stores) - 映射整个 store
- [mapActions()](./map-actions) - 映射 store action
- [Store 实例](./store-instance) - Store 实例 API
- [Options API 指南](../guide/options-api) - 在 Options API 中使用 Pinia