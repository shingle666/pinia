---
title: mapActions() - Pinia API
description: mapActions 函数的完整 API 参考。学习如何在 Options API 组件中映射 store action。
keywords: Pinia, Vue.js, mapActions, Options API, action 映射, API 参考
author: Pinia Team
generator: VitePress
og:title: mapActions() - Pinia API
og:description: mapActions 函数的完整 API 参考。学习如何在 Options API 组件中映射 store action。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/map-actions
twitter:card: summary_large_image
twitter:title: mapActions() - Pinia API
twitter:description: mapActions 函数的完整 API 参考。学习如何在 Options API 组件中映射 store action。
twitter:image: /og-image.svg
---

# mapActions()

将 store action 映射为 Options API 组件中的方法。这允许您直接将 store action 作为组件方法调用。

## 函数签名

```ts
function mapActions<T>(
  useStore: () => T,
  keys: (keyof T)[] | Record<string, keyof T>
): Record<string, Function>
```

## 参数

- **useStore**: Store 定义函数
- **keys**: Action 名称数组或自定义映射对象

## 返回值

可以展开到组件 `methods` 选项中的方法对象。

## 基本用法

### 数组语法

```js
import { mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  methods: {
    // 映射 this.increment, this.decrement, this.reset
    ...mapActions(useCounterStore, ['increment', 'decrement', 'reset'])
  },
  
  template: `
    <div>
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
      <button @click="reset">重置</button>
    </div>
  `
}
```

### 对象语法

```js
import { mapActions } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  methods: {
    // 自定义方法名称
    ...mapActions(useUserStore, {
      signIn: 'login',
      signOut: 'logout',
      updateProfile: 'updateUser'
    })
  },
  
  async mounted() {
    // 使用映射的 action
    await this.signIn({ email: 'user@example.com', password: 'password' })
  },
  
  template: `
    <div>
      <button @click="signOut">退出登录</button>
      <button @click="updateProfile({ name: '新名称' })">更新</button>
    </div>
  `
}
```

## Action 参数

### 单参数 Action

```js
// Store 定义
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

// 组件
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
        <input v-model="newTaskTitle" placeholder="任务标题">
        <textarea v-model="newTaskDescription" placeholder="描述"></textarea>
        <button type="submit">添加任务</button>
      </form>
      
      <ul>
        <li v-for="task in tasks" :key="task.id">
          <span @click="toggleTask(task.id)">{{ task.title }}</span>
          <button @click="removeTask(task.id)">删除</button>
        </li>
      </ul>
    </div>
  `
}
```

### 多参数 Action

```js
// Store 定义
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

// 组件
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
        
        this.$toast.success('个人资料保存成功！')
      } catch (error) {
        this.$toast.error('保存个人资料失败')
      }
    }
  }
}
```

## 异步 Action

### 基于 Promise 的 Action

```js
// Store 定义
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
        
        // 将 token 存储到 localStorage
        localStorage.setItem('auth_token', response.token)
        
        return response
      } catch (error) {
        throw new Error('登录失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      this.loading = true
      
      try {
        await authApi.logout()
      } catch (error) {
        console.warn('退出登录 API 调用失败:', error)
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
        // Token 刷新失败，退出用户登录
        await this.logout()
        throw error
      }
    }
  }
})

// 组件
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
        
        // 重定向到仪表板
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
        console.error('退出登录错误:', error)
        // 即使 API 调用失败也强制退出登录
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
        placeholder="邮箱"
        required
      >
      
      <input 
        v-model="password" 
        type="password" 
        placeholder="密码"
        required
      >
      
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <button type="button" @click="handleLogout">
        退出登录
      </button>
    </form>
  `
}
```

## 高级用法

### 条件 Action 映射

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
    // 始终可用的 action
    ...mapActions(useUserStore, ['updateProfile', 'changePassword']),
    
    // 条件映射管理员 action
    ...(process.env.NODE_ENV === 'development' || true ? 
      mapActions(useAdminStore, ['deleteUser', 'banUser', 'promoteUser']) : 
      {}
    ),
    
    // 条件访问的包装方法
    async deleteUserSafely(userId) {
      if (!this.isAdmin) {
        throw new Error('权限不足')
      }
      return await this.deleteUser(userId)
    }
  }
}
```

### 多 Store Action

```js
import { mapActions } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'
import { useUserStore } from '@/stores/user'

export default {
  methods: {
    // 购物车 action
    ...mapActions(useCartStore, {
      addToCart: 'addItem',
      removeFromCart: 'removeItem',
      clearCart: 'clear'
    }),
    
    // 产品 action
    ...mapActions(useProductStore, {
      loadProducts: 'fetchProducts',
      searchProducts: 'search'
    }),
    
    // 用户 action
    ...mapActions(useUserStore, {
      saveWishlist: 'updateWishlist'
    }),
    
    // 组合工作流方法
    async addProductToCartAndWishlist(product) {
      // 添加到购物车
      await this.addToCart(product)
      
      // 添加到愿望清单
      const userStore = useUserStore()
      const currentWishlist = userStore.wishlist || []
      await this.saveWishlist([...currentWishlist, product.id])
      
      this.$toast.success('已添加到购物车和愿望清单！')
    },
    
    async quickPurchase(product) {
      // 先清空购物车
      this.clearCart()
      
      // 添加单个产品
      await this.addToCart(product)
      
      // 导航到结账页面
      this.$router.push('/checkout')
    }
  }
}
```

### Action 组合

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
    
    // 与多个 store 交互的组合 action
    async createTaskWithNotification(taskData) {
      try {
        // 创建任务
        const task = await this.addTask(taskData)
        
        // 显示成功通知
        this.showNotification({
          type: 'success',
          message: `任务 "${task.title}" 创建成功！`,
          duration: 3000
        })
        
        // 跟踪分析事件
        this.trackEvent('task_created', {
          task_id: task.id,
          task_category: task.category,
          user_id: this.currentUser.id
        })
        
        return task
      } catch (error) {
        // 显示错误通知
        this.showNotification({
          type: 'error',
          message: '创建任务失败。请重试。',
          duration: 5000
        })
        
        // 跟踪错误事件
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

### 类型安全的 Action 映射

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

### 泛型 Action 映射器

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

// 使用
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

### 异步 Action 类型

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
        
        console.log('已登录用户:', user)
      } catch (error) {
        console.error('登录失败:', error)
      }
    }
  }
})
```

## 性能考虑

### 选择性 Action 映射

```js
// ✅ 好 - 只映射实际使用的 action
methods: {
  ...mapActions(useUserStore, [
    'login',    // 在此组件中使用
    'logout'    // 在此组件中使用
  ])
  // 如果不使用，不要映射 'updateProfile', 'deleteAccount' 等
}

// ❌ 效率较低 - 映射所有 action
methods: {
  ...mapActions(useUserStore, [
    'login', 'logout', 'updateProfile', 'deleteAccount',
    'changePassword', 'updatePreferences', 'exportData'
  ])
}
```

### 懒加载 Action

```js
export default {
  methods: {
    // 核心 action 立即映射
    ...mapActions(useUserStore, ['login', 'logout']),
    
    // 重型 action 按需加载
    async exportUserData() {
      const { exportData } = mapActions(useUserStore, ['exportData'])
      return await exportData.call(this)
    },
    
    async generateReport() {
      // 动态导入重型 store
      const { useReportStore } = await import('@/stores/report')
      const { generateReport } = mapActions(useReportStore, ['generateReport'])
      return await generateReport.call(this)
    }
  }
}
```

## 常见模式

### 表单提交

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
        // 验证表单
        const isValid = await this.validateForm(this.formData)
        if (!isValid) {
          return
        }
        
        // 提交表单
        await this.submitForm(this.formData)
        
        // 重置表单
        this.formData = { name: '', email: '', message: '' }
        
        this.$toast.success('表单提交成功！')
      } catch (error) {
        this.$toast.error('提交失败: ' + error.message)
      } finally {
        this.submitting = false
      }
    }
  },
  
  template: `
    <form @submit.prevent="handleSubmit">
      <input v-model="formData.name" placeholder="姓名" required>
      <input v-model="formData.email" type="email" placeholder="邮箱" required>
      <textarea v-model="formData.message" placeholder="消息" required></textarea>
      
      <button type="submit" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交' }}
      </button>
    </form>
  `
}
```

### CRUD 操作

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
        await this.fetchItems() // 刷新列表
        this.$toast.success('项目已创建！')
      } catch (error) {
        this.$toast.error('创建项目失败')
      }
    },
    
    async handleUpdate(itemId, updates) {
      try {
        await this.updateItem(itemId, updates)
        this.$toast.success('项目已更新！')
      } catch (error) {
        this.$toast.error('更新项目失败')
      }
    },
    
    async handleDelete(itemId) {
      if (!confirm('确定要删除此项目吗？')) {
        return
      }
      
      try {
        await this.deleteItem(itemId)
        this.$toast.success('项目已删除！')
      } catch (error) {
        this.$toast.error('删除项目失败')
      }
    }
  }
}
```

### 批量操作

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
        this.$toast.warning('未选择任务')
        return
      }
      
      const confirmed = confirm(
        `删除 ${this.selectedTasks.length} 个选中的任务？`
      )
      
      if (!confirmed) return
      
      try {
        // 并行删除任务
        await Promise.all(
          this.selectedTasks.map(taskId => this.deleteTask(taskId))
        )
        
        this.selectedTasks = []
        this.$toast.success('选中的任务已删除！')
      } catch (error) {
        this.$toast.error('删除某些任务失败')
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
        this.$toast.success('任务已标记为完成！')
      } catch (error) {
        this.$toast.error('更新任务失败')
      }
    }
  }
}
```

## 最佳实践

### 1. 使用描述性方法名称

```js
// ✅ 好 - 清晰的方法名称
methods: {
  ...mapActions(useAuthStore, {
    signIn: 'login',
    signOut: 'logout',
    registerUser: 'register'
  })
}

// ❌ 令人困惑 - 通用名称
methods: {
  ...mapActions(useAuthStore, {
    action1: 'login',
    action2: 'logout',
    action3: 'register'
  })
}
```

### 2. 分组相关 Action

```js
// ✅ 好 - 逻辑分组
methods: {
  // 认证 action
  ...mapActions(useAuthStore, ['login', 'logout', 'register']),
  
  // 用户资料 action
  ...mapActions(useUserStore, ['updateProfile', 'uploadAvatar']),
  
  // 通知 action
  ...mapActions(useNotificationStore, ['showNotification'])
}
```

### 3. 适当处理错误

```js
methods: {
  ...mapActions(useApiStore, ['fetchData']),
  
  async loadData() {
    try {
      await this.fetchData('/api/data')
    } catch (error) {
      // 处理特定错误类型
      if (error.status === 401) {
        this.$router.push('/login')
      } else if (error.status === 403) {
        this.$toast.error('访问被拒绝')
      } else {
        this.$toast.error('加载数据失败')
      }
    }
  }
}
```

### 4. 与其他 Options API 功能结合

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
      // 邮箱变化时验证
      this.validateEmail(newEmail)
    }
  }
}
```

## 从 Vuex 迁移

### Vuex Action

```js
// Vuex
methods: {
  ...mapActions([
    'increment',
    'decrement',
    'incrementBy'
  ]),
  
  // 或使用命名空间
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

### 带载荷的 Vuex Action

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

## 相关链接

- [mapState()](./map-state) - 将 store 状态映射到计算属性
- [mapWritableState()](./map-writable-state) - 映射可写的 store 状态
- [mapStores()](./map-stores) - 映射整个 store
- [Store 实例](./store-instance) - Store 实例 API
- [Options API 指南](../guide/options-api) - 在 Options API 中使用 Pinia