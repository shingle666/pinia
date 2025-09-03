---
title: 组件测试 - Pinia 实用指南
description: 学习如何测试使用 Pinia store 的 Vue 组件。包含单元测试、模拟 store 和测试 store 交互的完整指南和示例。
keywords: Pinia, Vue.js, 组件测试, 单元测试, 模拟, Vitest, Jest, 测试 store
author: Pinia Team
generator: VitePress
og:title: 组件测试 - Pinia 实用指南
og:description: 学习如何测试使用 Pinia store 的 Vue 组件。包含单元测试、模拟 store 和测试 store 交互的完整指南和示例。
og:image: /og-image.svg
og:url: https://allfun.net/zh/cookbook/component-testing
twitter:card: summary_large_image
twitter:title: 组件测试 - Pinia 实用指南
twitter:description: 学习如何测试使用 Pinia store 的 Vue 组件。包含单元测试、模拟 store 和测试 store 交互的完整指南和示例。
twitter:image: /og-image.svg
---

# 组件测试

测试使用 Pinia store 的 Vue 组件需要特别考虑，以确保测试是隔离的、可靠的和可维护的。本指南涵盖了使用 Pinia store 测试组件的各种策略。

## 基本设置

### 测试环境配置

首先，使用必要的依赖项设置测试环境：

```bash
npm install -D @vue/test-utils vitest jsdom
# 或
npm install -D @vue/test-utils jest @vue/vue3-jest
```

### Vitest 配置

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

## 测试策略

### 1. 使用真实 Store 进行测试

对于集成风格的测试，你可以使用真实的 store：

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    }
  }
})
```

```vue
<!-- components/Counter.vue -->
<template>
  <div>
    <span data-testid="count">{{ store.count }}</span>
    <button data-testid="increment" @click="store.increment">+</button>
    <button data-testid="decrement" @click="store.decrement">-</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>
```

```js
// tests/Counter.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('Counter 组件', () => {
  let wrapper
  let store

  beforeEach(() => {
    // 为每个测试创建新的 pinia 实例
    setActivePinia(createPinia())
    
    wrapper = mount(Counter, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    store = useCounterStore()
  })

  it('显示当前计数', () => {
    expect(wrapper.get('[data-testid="count"]').text()).toBe('0')
  })

  it('点击增加按钮时增加计数', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
    expect(store.count).toBe(1)
  })

  it('点击减少按钮时减少计数', async () => {
    store.count = 5 // 设置初始状态
    await wrapper.vm.$nextTick()
    
    await wrapper.get('[data-testid="decrement"]').trigger('click')
    expect(wrapper.get('[data-testid="count"]').text()).toBe('4')
    expect(store.count).toBe(4)
  })
})
```

### 2. 模拟 Store

对于单元测试，你可能想要模拟 store 来隔离组件逻辑：

```js
// tests/Counter.mock.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Counter from '@/components/Counter.vue'

// 模拟 store
vi.mock('@/stores/counter', () => ({
  useCounterStore: vi.fn(() => ({
    count: 0,
    increment: vi.fn(),
    decrement: vi.fn()
  }))
}))

describe('Counter 组件（模拟）', () => {
  let wrapper
  let mockStore

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // 在模拟后导入
    const { useCounterStore } = await import('@/stores/counter')
    mockStore = useCounterStore()
    
    wrapper = mount(Counter, {
      global: {
        plugins: [createPinia()]
      }
    })
  })

  it('点击增加按钮时调用 increment', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    expect(mockStore.increment).toHaveBeenCalledOnce()
  })

  it('点击减少按钮时调用 decrement', async () => {
    await wrapper.get('[data-testid="decrement"]').trigger('click')
    expect(mockStore.decrement).toHaveBeenCalledOnce()
  })
})
```

### 3. 部分 Store 模拟

有时你只想模拟 store 的特定部分：

```js
// tests/Counter.partial-mock.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'

describe('Counter 组件（部分模拟）', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    
    wrapper = mount(Counter, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    store = useCounterStore()
    
    // 模拟特定的 action，同时保持状态响应式
    store.increment = vi.fn(() => {
      store.count++
    })
    store.decrement = vi.fn(() => {
      store.count--
    })
  })

  it('增加计数并调用模拟的 action', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    
    expect(store.increment).toHaveBeenCalledOnce()
    expect(store.count).toBe(1)
    expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
  })
})
```

## 测试复杂组件

### 使用多个 Store 的组件

```vue
<!-- components/UserProfile.vue -->
<template>
  <div>
    <div v-if="userStore.isLoading">加载中...</div>
    <div v-else-if="userStore.error">错误：{{ userStore.error }}</div>
    <div v-else>
      <h1>{{ userStore.user?.name }}</h1>
      <p>购物车商品：{{ cartStore.itemCount }}</p>
      <button @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const userStore = useUserStore()
const cartStore = useCartStore()

const logout = async () => {
  await userStore.logout()
  cartStore.clearCart()
}
</script>
```

```js
// tests/UserProfile.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import UserProfile from '@/components/UserProfile.vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

describe('UserProfile 组件', () => {
  let wrapper
  let userStore
  let cartStore

  beforeEach(() => {
    setActivePinia(createPinia())
    
    wrapper = mount(UserProfile, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    userStore = useUserStore()
    cartStore = useCartStore()
    
    // 模拟异步 action
    userStore.logout = vi.fn().mockResolvedValue()
    cartStore.clearCart = vi.fn()
  })

  it('显示加载状态', async () => {
    userStore.isLoading = true
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('加载中...')
  })

  it('显示错误状态', async () => {
    userStore.error = '加载用户失败'
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('错误：加载用户失败')
  })

  it('加载完成时显示用户资料', async () => {
    userStore.user = { name: '张三' }
    cartStore.itemCount = 3
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('购物车商品：3')
  })

  it('正确处理退出登录', async () => {
    const logoutButton = wrapper.find('button')
    await logoutButton.trigger('click')
    
    expect(userStore.logout).toHaveBeenCalledOnce()
    expect(cartStore.clearCart).toHaveBeenCalledOnce()
  })
})
```

### 测试异步操作

```vue
<!-- components/ProductList.vue -->
<template>
  <div>
    <button @click="loadProducts" :disabled="store.isLoading">
      {{ store.isLoading ? '加载中...' : '加载产品' }}
    </button>
    
    <div v-if="store.error" class="error">
      {{ store.error }}
    </div>
    
    <ul v-if="store.products.length">
      <li v-for="product in store.products" :key="product.id">
        {{ product.name }} - ¥{{ product.price }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useProductStore } from '@/stores/product'

const store = useProductStore()

const loadProducts = async () => {
  try {
    await store.fetchProducts()
  } catch (error) {
    console.error('加载产品失败：', error)
  }
}
</script>
```

```js
// tests/ProductList.test.js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import ProductList from '@/components/ProductList.vue'
import { useProductStore } from '@/stores/product'

describe('ProductList 组件', () => {
  let wrapper
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    
    wrapper = mount(ProductList, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    store = useProductStore()
  })

  it('成功加载产品', async () => {
    const mockProducts = [
      { id: 1, name: '产品 1', price: 10 },
      { id: 2, name: '产品 2', price: 20 }
    ]
    
    store.fetchProducts = vi.fn().mockImplementation(async () => {
      store.isLoading = true
      await new Promise(resolve => setTimeout(resolve, 100))
      store.products = mockProducts
      store.isLoading = false
    })
    
    const button = wrapper.find('button')
    await button.trigger('click')
    
    // 检查加载状态
    expect(button.text()).toBe('加载中...')
    expect(button.attributes('disabled')).toBeDefined()
    
    // 等待异步操作
    await vi.runAllTimers()
    await wrapper.vm.$nextTick()
    
    expect(store.fetchProducts).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('产品 1 - ¥10')
    expect(wrapper.text()).toContain('产品 2 - ¥20')
  })

  it('处理获取错误', async () => {
    const errorMessage = '网络错误'
    
    store.fetchProducts = vi.fn().mockImplementation(async () => {
      store.isLoading = true
      await new Promise(resolve => setTimeout(resolve, 100))
      store.error = errorMessage
      store.isLoading = false
      throw new Error(errorMessage)
    })
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const button = wrapper.find('button')
    await button.trigger('click')
    
    await vi.runAllTimers()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.error').text()).toBe(errorMessage)
    expect(consoleSpy).toHaveBeenCalledWith('加载产品失败：', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})
```

## 使用组合式 API 进行测试

### 测试自定义组合式函数

```js
// composables/useCart.js
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

export function useCart() {
  const cartStore = useCartStore()
  const userStore = useUserStore()
  
  const totalWithDiscount = computed(() => {
    const discount = userStore.user?.isPremium ? 0.1 : 0
    return cartStore.total * (1 - discount)
  })
  
  const addItem = async (product, quantity = 1) => {
    if (!userStore.user) {
      throw new Error('用户必须登录')
    }
    
    await cartStore.addItem(product, quantity)
  }
  
  return {
    items: cartStore.items,
    total: cartStore.total,
    totalWithDiscount,
    addItem
  }
}
```

```js
// tests/useCart.test.js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useCart } from '@/composables/useCart'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

describe('useCart 组合式函数', () => {
  let cartStore
  let userStore

  beforeEach(() => {
    setActivePinia(createPinia())
    cartStore = useCartStore()
    userStore = useUserStore()
  })

  it('为高级用户计算折扣后总价', () => {
    cartStore.total = 100
    userStore.user = { isPremium: true }
    
    const { totalWithDiscount } = useCart()
    
    expect(totalWithDiscount.value).toBe(90) // 10% 折扣
  })

  it('为普通用户计算无折扣总价', () => {
    cartStore.total = 100
    userStore.user = { isPremium: false }
    
    const { totalWithDiscount } = useCart()
    
    expect(totalWithDiscount.value).toBe(100) // 无折扣
  })

  it('未登录用户添加商品时抛出错误', async () => {
    userStore.user = null
    
    const { addItem } = useCart()
    
    await expect(addItem({ id: 1, name: '产品' })).rejects.toThrow('用户必须登录')
  })

  it('用户登录时添加商品', async () => {
    userStore.user = { id: 1, name: '张三' }
    cartStore.addItem = vi.fn().mockResolvedValue()
    
    const { addItem } = useCart()
    const product = { id: 1, name: '产品' }
    
    await addItem(product, 2)
    
    expect(cartStore.addItem).toHaveBeenCalledWith(product, 2)
  })
})
```

## 测试工具

### 测试辅助函数

```js
// tests/helpers/pinia-test-utils.js
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

/**
 * 为测试创建新的 Pinia 实例
 */
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 使用新的 Pinia 实例挂载组件
 */
export function mountWithPinia(component, options = {}) {
  const pinia = createTestPinia()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      ...options.global
    },
    ...options
  })
}

/**
 * 创建具有默认实现的模拟 store
 */
export function createMockStore(storeName, initialState = {}) {
  return {
    $id: storeName,
    $state: { ...initialState },
    $patch: vi.fn(),
    $reset: vi.fn(),
    $subscribe: vi.fn(),
    $onAction: vi.fn()
  }
}
```

### 使用测试辅助函数

```js
// tests/Counter.helper.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import Counter from '@/components/Counter.vue'
import { useCounterStore } from '@/stores/counter'
import { mountWithPinia } from './helpers/pinia-test-utils'

describe('Counter 组件（使用辅助函数）', () => {
  let wrapper
  let store

  beforeEach(() => {
    wrapper = mountWithPinia(Counter)
    store = useCounterStore()
  })

  it('显示当前计数', () => {
    expect(wrapper.get('[data-testid="count"]').text()).toBe('0')
  })

  it('点击增加按钮时增加计数', async () => {
    await wrapper.get('[data-testid="increment"]').trigger('click')
    expect(store.count).toBe(1)
  })
})
```

## 最佳实践

### 1. 隔离测试

始终为每个测试创建新的 Pinia 实例：

```js
beforeEach(() => {
  setActivePinia(createPinia())
})
```

### 2. 测试行为，而非实现

专注于组件做什么，而不是如何做：

```js
// ✅ 好的做法 - 测试行为
it('登录时显示用户名', async () => {
  userStore.user = { name: '张三' }
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('张三')
})

// ❌ 避免 - 测试实现细节
it('调用 useUserStore', () => {
  expect(useUserStore).toHaveBeenCalled()
})
```

### 3. 使用数据测试 ID

使用 `data-testid` 属性进行可靠的元素选择：

```vue
<template>
  <button data-testid="submit-button" @click="submit">
    提交
  </button>
</template>
```

```js
const submitButton = wrapper.get('[data-testid="submit-button"]')
```

### 4. 模拟外部依赖

模拟 API 调用和外部服务：

```js
// 全局模拟 fetch
global.fetch = vi.fn()

// 或模拟特定模块
vi.mock('@/api/products', () => ({
  fetchProducts: vi.fn().mockResolvedValue([])
}))
```

### 5. 测试错误状态

不要忘记测试错误场景：

```js
it('获取失败时显示错误消息', async () => {
  store.fetchProducts = vi.fn().mockRejectedValue(new Error('网络错误'))
  
  await wrapper.find('button').trigger('click')
  await wrapper.vm.$nextTick()
  
  expect(wrapper.find('.error').exists()).toBe(true)
})
```

## 常见模式

### 测试 Store 订阅

```js
it('响应 store 变化', async () => {
  const callback = vi.fn()
  store.$subscribe(callback)
  
  store.count = 5
  await wrapper.vm.$nextTick()
  
  expect(callback).toHaveBeenCalled()
  expect(wrapper.get('[data-testid="count"]').text()).toBe('5')
})
```

### 测试带副作用的 Store Action

```js
it('成功 API 调用后更新 UI', async () => {
  const mockUser = { id: 1, name: '张三' }
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockUser)
  })
  
  await store.fetchUser(1)
  await wrapper.vm.$nextTick()
  
  expect(wrapper.text()).toContain('张三')
  expect(store.user).toEqual(mockUser)
})
```

### 测试计算属性

```js
it('依赖项变化时更新计算值', async () => {
  store.items = [
    { price: 10, quantity: 2 },
    { price: 20, quantity: 1 }
  ]
  
  await wrapper.vm.$nextTick()
  
  expect(wrapper.get('[data-testid="total"]').text()).toBe('40')
  
  store.items[0].quantity = 3
  await wrapper.vm.$nextTick()
  
  expect(wrapper.get('[data-testid="total"]').text()).toBe('50')
})
```

## 总结

使用 Pinia store 测试组件需要仔细考虑隔离、模拟策略和测试组织。通过遵循这些模式和最佳实践，你可以创建可靠、可维护的测试，让你对应用程序的行为充满信心。

记住要：
- 始终为每个测试使用新的 Pinia 实例
- 测试行为而不是实现细节
- 适当地模拟外部依赖
- 测试成功和错误场景
- 使用辅助函数减少样板代码

更多测试策略，请参阅：
- [端到端测试](./e2e-testing) - 使用 Pinia 进行端到端测试
- [Store 测试](../guide/testing) - 独立测试 store