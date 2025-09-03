---
title: Vuex 兼容性指南
description: 了解如何在现有 Vuex 项目中逐步引入 Pinia，实现平滑迁移和兼容性处理。
head:
  - [meta, { name: description, content: "了解如何在现有 Vuex 项目中逐步引入 Pinia，实现平滑迁移和兼容性处理。" }]
  - [meta, { name: keywords, content: "Pinia Vuex 兼容性, 渐进式迁移, Vuex Pinia 共存" }]
  - [meta, { property: "og:title", content: "Vuex 兼容性指南 - Pinia" }]
  - [meta, { property: "og:description", content: "了解如何在现有 Vuex 项目中逐步引入 Pinia，实现平滑迁移和兼容性处理。" }]
---

# Vuex 兼容性指南

本指南帮助您在现有 Vuex 项目中逐步引入 Pinia，实现平滑迁移而不破坏现有功能。

## 概述

Pinia 和 Vuex 可以在同一个项目中共存，这使得您可以：

- 逐步迁移现有的 Vuex 模块
- 为新功能使用 Pinia
- 在迁移过程中保持应用稳定
- 测试和验证迁移效果

## 设置共存环境

### 1. 安装 Pinia

```bash
npm install pinia
# 或
yarn add pinia
# 或
pnpm add pinia
```

### 2. 同时配置 Vuex 和 Pinia

```ts
// main.ts
import { createApp } from 'vue'
import { createStore } from 'vuex'
import { createPinia } from 'pinia'
import App from './App.vue'

// 现有的 Vuex store
const vuexStore = createStore({
  // 您现有的 Vuex 配置
  modules: {
    user: userModule,
    products: productsModule,
    // ... 其他模块
  }
})

// 新的 Pinia 实例
const pinia = createPinia()

const app = createApp(App)

// 同时使用两个状态管理库
app.use(vuexStore)
app.use(pinia)

app.mount('#app')
```

### 3. TypeScript 配置

```ts
// types/store.ts
import type { Store } from 'vuex'
import type { Pinia } from 'pinia'

// 扩展 ComponentCustomProperties
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<any>
    $pinia: Pinia
  }
}
```

## 渐进式迁移策略

### 策略 1：按模块迁移

逐个将 Vuex 模块转换为 Pinia stores。

```ts
// 原 Vuex 模块
// store/modules/cart.js
const cartModule = {
  namespaced: true,
  state: {
    items: [],
    total: 0
  },
  getters: {
    itemCount: (state) => state.items.length,
    totalPrice: (state) => state.total
  },
  mutations: {
    ADD_ITEM(state, item) {
      state.items.push(item)
      state.total += item.price
    },
    REMOVE_ITEM(state, itemId) {
      const index = state.items.findIndex(item => item.id === itemId)
      if (index > -1) {
        state.total -= state.items[index].price
        state.items.splice(index, 1)
      }
    }
  },
  actions: {
    addItem({ commit }, item) {
      commit('ADD_ITEM', item)
    },
    removeItem({ commit }, itemId) {
      commit('REMOVE_ITEM', itemId)
    }
  }
}

// 转换为 Pinia store
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<CartItem[]>([])
  const total = ref(0)

  // Getters
  const itemCount = computed(() => items.value.length)
  const totalPrice = computed(() => total.value)

  // Actions
  function addItem(item: CartItem) {
    items.value.push(item)
    total.value += item.price
  }

  function removeItem(itemId: string) {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      total.value -= items.value[index].price
      items.value.splice(index, 1)
    }
  }

  return {
    // State
    items: readonly(items),
    total: readonly(total),
    
    // Getters
    itemCount,
    totalPrice,
    
    // Actions
    addItem,
    removeItem
  }
})
```

### 策略 2：按功能迁移

为新功能使用 Pinia，保持现有功能使用 Vuex。

```ts
// 新功能使用 Pinia
// stores/notifications.ts
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  
  function addNotification(notification: Notification) {
    notifications.value.push({
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    })
  }
  
  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  return {
    notifications: readonly(notifications),
    addNotification,
    removeNotification
  }
})

// 在组件中同时使用两者
// components/Header.vue
<template>
  <header>
    <!-- Vuex 数据 -->
    <div>用户: {{ $store.getters['user/fullName'] }}</div>
    
    <!-- Pinia 数据 -->
    <div>通知: {{ notificationsStore.notifications.length }}</div>
  </header>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()
</script>
```

## 兼容性工具

### 1. 状态同步工具

在迁移过程中，您可能需要在 Vuex 和 Pinia 之间同步某些状态。

```ts
// utils/state-sync.ts
import { watch } from 'vue'
import type { Store } from 'vuex'
import type { StoreGeneric } from 'pinia'

export function syncVuexToPinia<T>(
  vuexStore: Store<any>,
  vuexPath: string,
  piniaStore: StoreGeneric,
  piniaProperty: keyof T
) {
  // 监听 Vuex 状态变化，同步到 Pinia
  watch(
    () => vuexStore.getters[vuexPath] || vuexStore.state[vuexPath],
    (newValue) => {
      (piniaStore as any)[piniaProperty] = newValue
    },
    { immediate: true }
  )
}

export function syncPiniaToVuex<T>(
  piniaStore: StoreGeneric,
  piniaProperty: keyof T,
  vuexStore: Store<any>,
  vuexMutation: string
) {
  // 监听 Pinia 状态变化，同步到 Vuex
  watch(
    () => (piniaStore as any)[piniaProperty],
    (newValue) => {
      vuexStore.commit(vuexMutation, newValue)
    }
  )
}

// 使用示例
// 在组件或插件中
syncVuexToPinia(
  vuexStore,
  'user/currentUser',
  userPiniaStore,
  'currentUser'
)
```

### 2. 统一访问接口

创建一个统一的接口来访问 Vuex 和 Pinia 状态。

```ts
// composables/useUnifiedStore.ts
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export function useUnifiedStore() {
  const vuexStore = useStore()
  const userStore = useUserStore()
  const cartStore = useCartStore()
  
  return {
    // Vuex 状态（逐步迁移中）
    products: computed(() => vuexStore.state.products.items),
    productsLoading: computed(() => vuexStore.state.products.loading),
    
    // Pinia 状态（已迁移）
    user: computed(() => userStore.user),
    cartItems: computed(() => cartStore.items),
    
    // 统一的 actions
    async fetchProducts() {
      return vuexStore.dispatch('products/fetchProducts')
    },
    
    async login(credentials: LoginCredentials) {
      return userStore.login(credentials)
    },
    
    addToCart(item: CartItem) {
      cartStore.addItem(item)
    }
  }
}
```

### 3. 迁移助手

```ts
// utils/migration-helper.ts
export class MigrationHelper {
  private migratedModules = new Set<string>()
  
  markAsMigrated(moduleName: string) {
    this.migratedModules.add(moduleName)
    console.log(`✅ 模块 "${moduleName}" 已迁移到 Pinia`)
  }
  
  isMigrated(moduleName: string): boolean {
    return this.migratedModules.has(moduleName)
  }
  
  getMigrationStatus() {
    return {
      migrated: Array.from(this.migratedModules),
      total: this.migratedModules.size
    }
  }
  
  // 创建迁移检查装饰器
  createMigrationCheck(moduleName: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = function(...args: any[]) {
        if (!this.isMigrated(moduleName)) {
          console.warn(`⚠️ 模块 "${moduleName}" 尚未迁移到 Pinia`)
        }
        return originalMethod.apply(this, args)
      }
    }
  }
}

export const migrationHelper = new MigrationHelper()
```

## 组件迁移模式

### 1. 渐进式组件迁移

```vue
<!-- 迁移前：使用 Vuex -->
<template>
  <div>
    <h1>{{ fullName }}</h1>
    <p>购物车商品数量: {{ cartItemCount }}</p>
    <button @click="logout">退出登录</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapGetters('user', ['fullName']),
    ...mapGetters('cart', ['itemCount'])
  },
  methods: {
    ...mapActions('user', ['logout'])
  }
}
</script>
```

```vue
<!-- 迁移后：使用 Pinia -->
<template>
  <div>
    <h1>{{ userStore.fullName }}</h1>
    <p>购物车商品数量: {{ cartStore.itemCount }}</p>
    <button @click="userStore.logout">退出登录</button>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const userStore = useUserStore()
const cartStore = useCartStore()
</script>
```

### 2. 混合使用模式

```vue
<!-- 过渡期：同时使用 Vuex 和 Pinia -->
<template>
  <div>
    <!-- 使用 Pinia（已迁移） -->
    <h1>{{ userStore.fullName }}</h1>
    
    <!-- 使用 Vuex（待迁移） -->
    <div>产品数量: {{ $store.getters['products/totalCount'] }}</div>
    
    <button @click="handleAction">执行操作</button>
  </div>
</template>

<script setup lang="ts">
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/user'

const vuexStore = useStore()
const userStore = useUserStore()

function handleAction() {
  // 同时调用 Vuex 和 Pinia actions
  vuexStore.dispatch('products/fetchProducts')
  userStore.updateLastActivity()
}
</script>
```

## 测试策略

### 1. 并行测试

```ts
// tests/migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'vuex'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'
import cartModule from '@/store/modules/cart'

describe('购物车迁移测试', () => {
  let vuexStore: any
  let piniaStore: any
  
  beforeEach(() => {
    // 设置 Vuex
    vuexStore = createStore({
      modules: {
        cart: cartModule
      }
    })
    
    // 设置 Pinia
    setActivePinia(createPinia())
    piniaStore = useCartStore()
  })
  
  it('应该在两个实现中产生相同的结果', () => {
    const testItem = { id: '1', name: '测试商品', price: 100, quantity: 1 }
    
    // Vuex 操作
    vuexStore.dispatch('cart/addItem', testItem)
    
    // Pinia 操作
    piniaStore.addItem(testItem)
    
    // 验证结果一致
    expect(vuexStore.getters['cart/itemCount']).toBe(piniaStore.itemCount)
    expect(vuexStore.getters['cart/totalPrice']).toBe(piniaStore.totalPrice)
  })
})
```

### 2. 兼容性测试

```ts
// tests/compatibility.test.ts
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createPinia } from 'pinia'
import TestComponent from '@/components/TestComponent.vue'

describe('Vuex-Pinia 兼容性', () => {
  it('应该能同时使用 Vuex 和 Pinia', () => {
    const vuexStore = createStore({
      state: { message: 'Hello from Vuex' }
    })
    
    const pinia = createPinia()
    
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [vuexStore, pinia]
      }
    })
    
    expect(wrapper.vm.$store).toBeDefined()
    expect(wrapper.vm.$pinia).toBeDefined()
  })
})
```

## 性能考虑

### 1. 内存使用

```ts
// utils/memory-monitor.ts
export function monitorMemoryUsage() {
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      if (performance.memory) {
        console.log('内存使用情况:', {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        })
      }
    }, 10000) // 每10秒检查一次
  }
}
```

### 2. 包大小优化

```ts
// 动态导入减少初始包大小
// router/index.ts
const routes = [
  {
    path: '/legacy',
    component: () => import('@/views/LegacyView.vue'), // 使用 Vuex
  },
  {
    path: '/modern',
    component: () => import('@/views/ModernView.vue'), // 使用 Pinia
  }
]
```

## 迁移检查清单

### 准备阶段
- [ ] 安装 Pinia
- [ ] 配置 Vuex 和 Pinia 共存
- [ ] 设置 TypeScript 类型
- [ ] 创建迁移计划

### 迁移阶段
- [ ] 选择迁移策略（按模块或按功能）
- [ ] 转换第一个 Vuex 模块
- [ ] 更新相关组件
- [ ] 编写测试验证功能
- [ ] 重复迁移其他模块

### 验证阶段
- [ ] 运行所有测试
- [ ] 检查性能影响
- [ ] 验证 DevTools 功能
- [ ] 测试 SSR（如果适用）

### 清理阶段
- [ ] 移除未使用的 Vuex 代码
- [ ] 更新文档
- [ ] 卸载 Vuex 依赖
- [ ] 最终测试

## 常见问题

### Q: 可以在同一个组件中同时使用 Vuex 和 Pinia 吗？

**A**: 是的，完全可以。这是渐进式迁移的核心特性。

```vue
<script setup>
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/user'

const vuexStore = useStore()
const piniaStore = useUserStore()
</script>
```

### Q: 如何处理 Vuex 插件？

**A**: 将 Vuex 插件转换为 Pinia 插件：

```ts
// Vuex 插件
const vuexPlugin = (store) => {
  store.subscribe((mutation, state) => {
    console.log(mutation.type)
  })
}

// Pinia 插件
const piniaPlugin = ({ store }) => {
  store.$subscribe((mutation, state) => {
    console.log(mutation.storeId)
  })
}
```

### Q: 迁移会影响性能吗？

**A**: 短期内可能会有轻微的性能开销（同时运行两个状态管理库），但长期来看 Pinia 的性能更好。

### Q: 如何处理 Vuex 的严格模式？

**A**: Pinia 默认允许直接修改状态，不需要严格模式。如果需要类似功能，可以使用开发工具监控。

## 最佳实践

### 1. 迁移顺序

1. 从最简单的模块开始
2. 优先迁移新功能
3. 最后迁移核心业务逻辑

### 2. 代码组织

```
src/
├── store/           # Vuex（逐步移除）
│   ├── modules/
│   └── index.ts
├── stores/          # Pinia（新增）
│   ├── user.ts
│   ├── cart.ts
│   └── index.ts
└── composables/     # 统一接口
    └── useUnifiedStore.ts
```

### 3. 文档更新

- 记录迁移进度
- 更新 API 文档
- 提供迁移指南给团队

## 相关资源

- [迁移指南](./migration.md)
- [Pinia vs Vuex](../introduction/comparison.md)
- [TypeScript 支持](../cookbook/typescript-best-practices.md)
- [测试指南](./testing.md)