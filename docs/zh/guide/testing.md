---
title: 测试 - Pinia 指南
description: 学习如何在 Vue.js 应用程序中测试 Pinia store，包括单元测试、集成测试和端到端测试策略。
keywords: Pinia, Vue.js, 测试, 单元测试, 集成测试, Vitest, Jest, Vue Test Utils
author: Pinia Team
generator: VitePress
og:title: 测试 - Pinia 指南
og:description: 学习如何在 Vue.js 应用程序中测试 Pinia store，包括单元测试、集成测试和端到端测试策略。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/testing
twitter:card: summary_large_image
twitter:title: 测试 - Pinia 指南
twitter:description: 学习如何在 Vue.js 应用程序中测试 Pinia store，包括单元测试、集成测试和端到端测试策略。
twitter:image: /og-image.svg
---

# 测试

由于 Pinia store 的简单结构和 Vue 优秀的测试生态系统，测试 Pinia store 非常简单。本指南涵盖 store 单元测试、使用 store 的组件测试以及集成测试策略。

## 概述

测试 Pinia store 时，您通常需要测试：

- **Store 状态**：初始状态和状态变更
- **Store getter**：计算值及其响应性
- **Store action**：业务逻辑和副作用
- **组件集成**：组件如何与 store 交互
- **Store 组合**：多个 store 如何协同工作

## Store 单元测试

### 基础 Store 测试

```ts
// stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: '计数器'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    incrementBy(amount: number) {
      this.count += amount
    },
    
    reset() {
      this.count = 0
    }
  }
})
```

```ts
// stores/__tests__/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../counter'

describe('计数器 Store', () => {
  beforeEach(() => {
    // 为每个测试创建新的 pinia 实例
    setActivePinia(createPinia())
  })
  
  it('使用正确的默认状态初始化', () => {
    const store = useCounterStore()
    
    expect(store.count).toBe(0)
    expect(store.name).toBe('计数器')
  })
  
  it('递增计数', () => {
    const store = useCounterStore()
    
    store.increment()
    expect(store.count).toBe(1)
    
    store.increment()
    expect(store.count).toBe(2)
  })
  
  it('递减计数', () => {
    const store = useCounterStore()
    store.count = 5
    
    store.decrement()
    expect(store.count).toBe(4)
  })
  
  it('按指定数量递增', () => {
    const store = useCounterStore()
    
    store.incrementBy(5)
    expect(store.count).toBe(5)
    
    store.incrementBy(3)
    expect(store.count).toBe(8)
  })
  
  it('重置计数为零', () => {
    const store = useCounterStore()
    store.count = 10
    
    store.reset()
    expect(store.count).toBe(0)
  })
  
  describe('getter', () => {
    it('正确计算双倍计数', () => {
      const store = useCounterStore()
      
      expect(store.doubleCount).toBe(0)
      
      store.count = 5
      expect(store.doubleCount).toBe(10)
    })
    
    it('判断计数是否为偶数', () => {
      const store = useCounterStore()
      
      expect(store.isEven).toBe(true) // 0 是偶数
      
      store.increment()
      expect(store.isEven).toBe(false) // 1 是奇数
      
      store.increment()
      expect(store.isEven).toBe(true) // 2 是偶数
    })
  })
})
```

### 测试异步 Action

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
    users: [] as User[],
    currentUser: null as User | null,
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null
      
      try {
        const users = await api.getUsers()
        this.users = users
      } catch (error) {
        this.error = error instanceof Error ? error.message : '未知错误'
      } finally {
        this.loading = false
      }
    },
    
    async createUser(userData: Omit<User, 'id'>) {
      this.loading = true
      this.error = null
      
      try {
        const newUser = await api.createUser(userData)
        this.users.push(newUser)
        return newUser
      } catch (error) {
        this.error = error instanceof Error ? error.message : '未知错误'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async deleteUser(id: number) {
      this.loading = true
      this.error = null
      
      try {
        await api.deleteUser(id)
        this.users = this.users.filter(user => user.id !== id)
      } catch (error) {
        this.error = error instanceof Error ? error.message : '未知错误'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

```ts
// stores/__tests__/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user'
import { api } from '@/services/api'

// 模拟 API
vi.mock('@/services/api', () => ({
  api: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    deleteUser: vi.fn()
  }
}))

const mockApi = vi.mocked(api)

describe('用户 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  describe('fetchUsers', () => {
    it('成功获取用户', async () => {
      const mockUsers = [
        { id: 1, name: '张三', email: 'zhangsan@example.com' },
        { id: 2, name: '李四', email: 'lisi@example.com' }
      ]
      
      mockApi.getUsers.mockResolvedValue(mockUsers)
      
      const store = useUserStore()
      
      expect(store.loading).toBe(false)
      
      const promise = store.fetchUsers()
      expect(store.loading).toBe(true)
      
      await promise
      
      expect(store.loading).toBe(false)
      expect(store.users).toEqual(mockUsers)
      expect(store.error).toBe(null)
      expect(mockApi.getUsers).toHaveBeenCalledOnce()
    })
    
    it('处理获取错误', async () => {
      const errorMessage = '获取用户失败'
      mockApi.getUsers.mockRejectedValue(new Error(errorMessage))
      
      const store = useUserStore()
      
      await store.fetchUsers()
      
      expect(store.loading).toBe(false)
      expect(store.users).toEqual([])
      expect(store.error).toBe(errorMessage)
    })
  })
  
  describe('createUser', () => {
    it('成功创建用户', async () => {
      const userData = { name: '新用户', email: 'new@example.com' }
      const createdUser = { id: 3, ...userData }
      
      mockApi.createUser.mockResolvedValue(createdUser)
      
      const store = useUserStore()
      
      const result = await store.createUser(userData)
      
      expect(result).toEqual(createdUser)
      expect(store.users).toContain(createdUser)
      expect(store.error).toBe(null)
      expect(mockApi.createUser).toHaveBeenCalledWith(userData)
    })
    
    it('处理创建错误', async () => {
      const userData = { name: '新用户', email: 'new@example.com' }
      const errorMessage = '创建用户失败'
      
      mockApi.createUser.mockRejectedValue(new Error(errorMessage))
      
      const store = useUserStore()
      
      await expect(store.createUser(userData)).rejects.toThrow(errorMessage)
      expect(store.error).toBe(errorMessage)
      expect(store.users).toEqual([])
    })
  })
  
  describe('deleteUser', () => {
    it('成功删除用户', async () => {
      const store = useUserStore()
      store.users = [
        { id: 1, name: '张三', email: 'zhangsan@example.com' },
        { id: 2, name: '李四', email: 'lisi@example.com' }
      ]
      
      mockApi.deleteUser.mockResolvedValue(undefined)
      
      await store.deleteUser(1)
      
      expect(store.users).toHaveLength(1)
      expect(store.users[0].id).toBe(2)
      expect(mockApi.deleteUser).toHaveBeenCalledWith(1)
    })
  })
})
```

### 测试 Store 组合

```ts
// stores/cart.ts
import { defineStore } from 'pinia'
import { useProductStore } from './product'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),
  
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    
    totalPrice(): number {
      const productStore = useProductStore()
      
      return this.items.reduce((sum, item) => {
        const product = productStore.getProductById(item.productId)
        return sum + (product?.price || 0) * item.quantity
      }, 0)
    }
  },
  
  actions: {
    addItem(productId: number, quantity = 1) {
      const existingItem = this.items.find(item => item.productId === productId)
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({ productId, quantity })
      }
    },
    
    removeItem(productId: number) {
      const index = this.items.findIndex(item => item.productId === productId)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    },
    
    updateQuantity(productId: number, quantity: number) {
      const item = this.items.find(item => item.productId === productId)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(productId)
        } else {
          item.quantity = quantity
        }
      }
    }
  }
})
```

```ts
// stores/__tests__/cart.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart'
import { useProductStore } from '../product'

describe('购物车 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    
    // 设置产品 store 测试数据
    const productStore = useProductStore()
    productStore.products = [
      { id: 1, name: '产品 1', price: 10 },
      { id: 2, name: '产品 2', price: 20 },
      { id: 3, name: '产品 3', price: 30 }
    ]
  })
  
  it('向购物车添加商品', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toEqual({ productId: 1, quantity: 2 })
    
    store.addItem(2, 1)
    expect(store.items).toHaveLength(2)
  })
  
  it('为现有商品增加数量', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.addItem(1, 3)
    
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(5)
  })
  
  it('正确计算总商品数', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.addItem(2, 3)
    
    expect(store.totalItems).toBe(5)
  })
  
  it('正确计算总价格', () => {
    const store = useCartStore()
    
    store.addItem(1, 2) // 2 * ¥10 = ¥20
    store.addItem(2, 1) // 1 * ¥20 = ¥20
    
    expect(store.totalPrice).toBe(40)
  })
  
  it('从购物车移除商品', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.addItem(2, 1)
    
    store.removeItem(1)
    
    expect(store.items).toHaveLength(1)
    expect(store.items[0].productId).toBe(2)
  })
  
  it('更新商品数量', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.updateQuantity(1, 5)
    
    expect(store.items[0].quantity).toBe(5)
  })
  
  it('数量设为 0 时移除商品', () => {
    const store = useCartStore()
    
    store.addItem(1, 2)
    store.updateQuantity(1, 0)
    
    expect(store.items).toHaveLength(0)
  })
})
```

## 测试使用 Store 的组件

### 基础组件测试

```vue
<!-- components/Counter.vue -->
<template>
  <div class="counter">
    <h2>{{ store.name }}</h2>
    <p>计数: {{ store.count }}</p>
    <p>双倍: {{ store.doubleCount }}</p>
    <p>是偶数: {{ store.isEven ? '是' : '否' }}</p>
    
    <div class="controls">
      <button @click="store.decrement" :disabled="store.count <= 0">
        -
      </button>
      <button @click="store.increment">
        +
      </button>
      <button @click="store.reset">
        重置
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>
```

```ts
// components/__tests__/Counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Counter from '../Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('计数器组件', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('正确渲染计数器状态', () => {
    const wrapper = mount(Counter)
    
    expect(wrapper.text()).toContain('计数: 0')
    expect(wrapper.text()).toContain('双倍: 0')
    expect(wrapper.text()).toContain('是偶数: 是')
  })
  
  it('点击 + 按钮时递增计数', async () => {
    const wrapper = mount(Counter)
    const incrementButton = wrapper.find('button:nth-child(2)')
    
    await incrementButton.trigger('click')
    
    expect(wrapper.text()).toContain('计数: 1')
    expect(wrapper.text()).toContain('双倍: 2')
    expect(wrapper.text()).toContain('是偶数: 否')
  })
  
  it('点击 - 按钮时递减计数', async () => {
    const wrapper = mount(Counter)
    const store = useCounterStore()
    
    // 设置初始计数
    store.count = 5
    await wrapper.vm.$nextTick()
    
    const decrementButton = wrapper.find('button:nth-child(1)')
    await decrementButton.trigger('click')
    
    expect(wrapper.text()).toContain('计数: 4')
  })
  
  it('点击重置按钮时重置计数', async () => {
    const wrapper = mount(Counter)
    const store = useCounterStore()
    
    // 设置初始计数
    store.count = 10
    await wrapper.vm.$nextTick()
    
    const resetButton = wrapper.find('button:nth-child(3)')
    await resetButton.trigger('click')
    
    expect(wrapper.text()).toContain('计数: 0')
  })
  
  it('计数为 0 时禁用递减按钮', () => {
    const wrapper = mount(Counter)
    const decrementButton = wrapper.find('button:nth-child(1)')
    
    expect(decrementButton.attributes('disabled')).toBeDefined()
  })
  
  it('计数大于 0 时启用递减按钮', async () => {
    const wrapper = mount(Counter)
    const store = useCounterStore()
    
    store.count = 1
    await wrapper.vm.$nextTick()
    
    const decrementButton = wrapper.find('button:nth-child(1)')
    expect(decrementButton.attributes('disabled')).toBeUndefined()
  })
})
```

### 使用模拟 Store 测试

```ts
// components/__tests__/UserList.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import UserList from '../UserList.vue'
import { useUserStore } from '@/stores/user'

// 创建模拟 store
const createMockUserStore = (overrides = {}) => {
  return {
    users: [],
    loading: false,
    error: null,
    fetchUsers: vi.fn(),
    createUser: vi.fn(),
    deleteUser: vi.fn(),
    ...overrides
  }
}

describe('用户列表组件', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('显示加载状态', () => {
    const mockStore = createMockUserStore({ loading: true })
    
    // 模拟 store
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    const wrapper = mount(UserList)
    
    expect(wrapper.text()).toContain('加载中...')
  })
  
  it('显示错误状态', () => {
    const mockStore = createMockUserStore({ 
      error: '加载用户失败' 
    })
    
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    const wrapper = mount(UserList)
    
    expect(wrapper.text()).toContain('加载用户失败')
  })
  
  it('显示用户列表', () => {
    const mockUsers = [
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '李四', email: 'lisi@example.com' }
    ]
    
    const mockStore = createMockUserStore({ users: mockUsers })
    
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    const wrapper = mount(UserList)
    
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('lisi@example.com')
  })
  
  it('挂载时调用 fetchUsers', () => {
    const mockStore = createMockUserStore()
    
    vi.mocked(useUserStore).mockReturnValue(mockStore as any)
    
    mount(UserList)
    
    expect(mockStore.fetchUsers).toHaveBeenCalledOnce()
  })
})
```

### 使用真实 Store 测试

```ts
// components/__tests__/ProductCard.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ProductCard from '../ProductCard.vue'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/product'

describe('产品卡片组件', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    
    // 设置测试数据
    const productStore = useProductStore()
    productStore.products = [
      { id: 1, name: '测试产品', price: 29.99, description: '一个测试产品' }
    ]
  })
  
  it('点击按钮时将产品添加到购物车', async () => {
    const wrapper = mount(ProductCard, {
      props: {
        productId: 1
      }
    })
    
    const cartStore = useCartStore()
    const addButton = wrapper.find('[data-testid="add-to-cart"]')
    
    await addButton.trigger('click')
    
    expect(cartStore.items).toHaveLength(1)
    expect(cartStore.items[0]).toEqual({ productId: 1, quantity: 1 })
  })
  
  it('显示购物车中的正确数量', async () => {
    const wrapper = mount(ProductCard, {
      props: {
        productId: 1
      }
    })
    
    const cartStore = useCartStore()
    cartStore.addItem(1, 3)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('购物车中: 3')
  })
})
```

## 集成测试

### 测试 Store 交互

```ts
// tests/integration/shopping-flow.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/product'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'

describe('购物流程集成', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('完成完整购物流程', async () => {
    const productStore = useProductStore()
    const cartStore = useCartStore()
    const userStore = useUserStore()
    const orderStore = useOrderStore()
    
    // 设置产品
    productStore.products = [
      { id: 1, name: '产品 1', price: 10, stock: 5 },
      { id: 2, name: '产品 2', price: 20, stock: 3 }
    ]
    
    // 设置用户
    userStore.currentUser = {
      id: 1,
      name: '测试用户',
      email: 'test@example.com'
    }
    
    // 添加商品到购物车
    cartStore.addItem(1, 2)
    cartStore.addItem(2, 1)
    
    expect(cartStore.totalItems).toBe(3)
    expect(cartStore.totalPrice).toBe(50) // (2 * 10) + (1 * 20)
    
    // 创建订单
    const order = await orderStore.createOrder({
      userId: userStore.currentUser.id,
      items: cartStore.items
    })
    
    expect(order).toBeDefined()
    expect(order.total).toBe(50)
    expect(order.items).toHaveLength(2)
    
    // 验证库存已更新
    expect(productStore.getProductById(1)?.stock).toBe(3) // 5 - 2
    expect(productStore.getProductById(2)?.stock).toBe(2) // 3 - 1
    
    // 验证购物车已清空
    expect(cartStore.items).toHaveLength(0)
  })
  
  it('处理库存不足', async () => {
    const productStore = useProductStore()
    const cartStore = useCartStore()
    const orderStore = useOrderStore()
    
    // 设置库存有限的产品
    productStore.products = [
      { id: 1, name: '限量产品', price: 10, stock: 1 }
    ]
    
    // 尝试添加超过可用数量的商品
    cartStore.addItem(1, 3)
    
    // 订单应该失败
    await expect(
      orderStore.createOrder({
        userId: 1,
        items: cartStore.items
      })
    ).rejects.toThrow('库存不足')
    
    // 库存应保持不变
    expect(productStore.getProductById(1)?.stock).toBe(1)
  })
})
```

### 使用 Vue Router 测试

```ts
// tests/integration/navigation.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>首页</div>' } },
    { path: '/login', component: { template: '<div>登录</div>' } },
    { path: '/profile', component: { template: '<div>个人资料</div>' }, meta: { requiresAuth: true } }
  ]
})

describe('带认证的导航', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('未认证时访问受保护路由重定向到登录', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)
    
    await router.push('/profile')
    
    expect(router.currentRoute.value.path).toBe('/login')
  })
  
  it('已认证时允许访问受保护路由', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    
    const authStore = useAuthStore()
    authStore.user = { id: 1, name: '测试用户' }
    
    await router.push('/profile')
    
    expect(router.currentRoute.value.path).toBe('/profile')
  })
})
```

## 测试工具

### 自定义测试助手

```ts
// tests/utils/test-helpers.ts
import { setActivePinia, createPinia, type Pinia } from 'pinia'
import type { App } from 'vue'
import { createApp } from 'vue'

/**
 * 为测试创建新的 Pinia 实例
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 创建带 Pinia 的测试应用
 */
export function createTestApp() {
  const app = createApp({})
  const pinia = createTestPinia()
  app.use(pinia)
  return { app, pinia }
}

/**
 * 等待所有待处理的 Promise 解决
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 创建带默认实现的模拟 store
 */
export function createMockStore<T extends Record<string, any>>(
  defaults: Partial<T> = {}
): T {
  return {
    $id: 'mock-store',
    $state: {},
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn(),
    $onAction: vi.fn(),
    $dispose: vi.fn(),
    ...defaults
  } as T
}

/**
 * 断言 store action 被特定参数调用
 */
export function expectActionCalled(
  action: any,
  ...args: any[]
) {
  expect(action).toHaveBeenCalledWith(...args)
}

/**
 * 断言 store 状态匹配期望值
 */
export function expectStoreState<T>(
  store: T,
  expectedState: Partial<T>
) {
  Object.keys(expectedState).forEach(key => {
    expect((store as any)[key]).toEqual((expectedState as any)[key])
  })
}
```

### 测试设置

```ts
// tests/setup.ts
import { beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createTestPinia } from './utils/test-helpers'

// 全局测试设置
beforeEach(() => {
  // 为每个测试创建新的 Pinia 实例
  createTestPinia()
})

afterEach(() => {
  // 每个测试后清理
  vi.clearAllMocks()
})

// 配置 Vue Test Utils
config.global.plugins = []
```

## 最佳实践

### 1. 测试结构

```ts
// 好：有组织的测试结构
describe('用户 Store', () => {
  describe('状态', () => {
    it('使用正确的默认值初始化', () => {
      // 测试初始状态
    })
  })
  
  describe('getter', () => {
    it('正确计算全名', () => {
      // 测试 getter
    })
  })
  
  describe('action', () => {
    describe('fetchUser', () => {
      it('成功获取用户', () => {
        // 测试成功情况
      })
      
      it('处理获取错误', () => {
        // 测试错误情况
      })
    })
  })
})
```

### 2. 模拟外部依赖

```ts
// 好：模拟 API 调用
vi.mock('@/services/api', () => ({
  api: {
    getUsers: vi.fn(),
    createUser: vi.fn()
  }
}))

// 好：模拟复杂依赖
vi.mock('@/utils/analytics', () => ({
  track: vi.fn(),
  identify: vi.fn()
}))
```

### 3. 测试真实行为

```ts
// 好：测试实际 store 行为
it('更新用户偏好', async () => {
  const store = useUserStore()
  
  await store.updatePreferences({ theme: 'dark' })
  
  expect(store.preferences.theme).toBe('dark')
  expect(mockApi.updatePreferences).toHaveBeenCalledWith({ theme: 'dark' })
})

// 避免：测试实现细节
it('调用内部方法', () => {
  const store = useUserStore()
  const spy = vi.spyOn(store, '_internalMethod')
  
  store.publicMethod()
  
  expect(spy).toHaveBeenCalled() // 不要测试这个
})
```

### 4. 使用描述性测试名称

```ts
// 好：描述性测试名称
it('调用 increment action 时递增计数')
it('尝试删除不存在的用户时抛出错误')
it('按类别和价格范围过滤产品')

// 避免：模糊的测试名称
it('正常工作')
it('处理错误')
it('更新状态')
```

### 5. 测试边界情况

```ts
describe('购物车 Store', () => {
  it('处理添加零数量商品', () => {
    const store = useCartStore()
    
    store.addItem(1, 0)
    
    expect(store.items).toHaveLength(0)
  })
  
  it('处理移除不存在的商品', () => {
    const store = useCartStore()
    
    expect(() => store.removeItem(999)).not.toThrow()
    expect(store.items).toHaveLength(0)
  })
  
  it('处理空购物车结账', async () => {
    const store = useCartStore()
    
    await expect(store.checkout()).rejects.toThrow('购物车为空')
  })
})
```

## 相关链接

- [Vue Test Utils](https://test-utils.vuejs.org/) - 官方 Vue 测试工具
- [Vitest](https://vitest.dev/) - 快速单元测试框架
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/) - 简单的测试工具
- [组件测试](../cookbook/component-testing) - 高级组件测试模式
- [E2E 测试](../cookbook/e2e-testing) - 端到端测试策略