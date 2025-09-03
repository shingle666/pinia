---
title: 什么是 Pinia？| Pinia 学习指南
description: 了解 Pinia，Vue.js 官方状态管理库。探索其核心特性、优势以及为什么它是 Vuex 的完美替代品。
keywords: Pinia, Vue.js, 状态管理, Vuex 替代品, TypeScript, 开发工具
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "article" }]
  - ["meta", { property: "og:title", content: "什么是 Pinia？| Pinia 学习指南" }]
  - ["meta", { property: "og:description", content: "了解 Pinia，Vue.js 官方状态管理库。探索其核心特性、优势以及为什么它是 Vuex 的完美替代品。" }]
  - ["meta", { property: "og:url", content: "https://allfun.net/zh/guide/introduction" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "什么是 Pinia？| Pinia 学习指南" }]
  - ["meta", { property: "twitter:description", content: "了解 Pinia，Vue.js 官方状态管理库。探索其核心特性、优势以及为什么它是 Vuex 的完美替代品。" }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/zh/guide/introduction" }]
---

# 什么是 Pinia？

Pinia 是 Vue.js 的官方状态管理库。它为 Vue 应用提供了一个集中式的状态存储，让您可以在整个应用中共享状态。

## 核心特性

### 🍍 直观易用
Pinia 提供了简洁直观的 API，让状态管理变得简单明了。您无需编写复杂的样板代码，可以专注于业务逻辑的实现。

### 🔒 类型安全
完整的 TypeScript 支持，提供出色的类型推断和自动补全体验。即使在 JavaScript 项目中，您也能享受到类型提示的便利。

### 🛠️ 开发工具支持
强大的 Vue DevTools 支持，包括：
- 时间旅行调试
- 热重载
- 状态快照
- 动作追踪

### 🔧 可扩展
通过插件系统扩展 Pinia 功能，满足各种复杂需求：
- 状态持久化
- 数据同步
- 中间件支持

### 📦 模块化
每个 store 都是独立的模块，支持：
- 代码分割
- 懒加载
- 树摇优化

### 🪶 轻量级
压缩后仅约 1.5KB，对应用性能影响极小。

## 与 Vuex 的对比

| 特性 | Pinia | Vuex |
|------|-------|------|
| API 复杂度 | 简单直观 | 相对复杂 |
| TypeScript 支持 | 原生支持 | 需要额外配置 |
| 模块化 | 天然支持 | 需要命名空间 |
| 代码分割 | 自动支持 | 手动配置 |
| 组合式 API | 完美集成 | 需要辅助函数 |
| 包大小 | ~1.5KB | ~2.5KB |

## 何时使用 Pinia？

您应该考虑使用 Pinia 当：

✅ **多个组件需要共享状态**
```javascript
// 用户信息需要在多个页面显示
const userStore = useUserStore()
```

✅ **状态逻辑变得复杂**
```javascript
// 复杂的购物车逻辑
const cartStore = useCartStore()
cartStore.addItem(product)
cartStore.applyDiscount(coupon)
```

✅ **需要持久化状态**
```javascript
// 用户偏好设置
const settingsStore = useSettingsStore()
// 自动保存到 localStorage
```

✅ **构建大型应用**
```javascript
// 模块化的状态管理
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/product'
```

## 基本概念

### Store（存储）
Store 是一个保存状态和业务逻辑的实体，类似于组件，但可以在整个应用中访问。

### State（状态）
State 是 store 的核心，包含应用的数据。

```javascript
state: () => ({
  user: null,
  isLoggedIn: false,
  preferences: {}
})
```

### Getters（获取器）
Getters 是 store 的计算属性，用于派生状态。

```javascript
getters: {
  fullName: (state) => `${state.user.firstName} ${state.user.lastName}`,
  isAdmin: (state) => state.user?.role === 'admin'
}
```

### Actions（动作）
Actions 用于修改状态，可以包含异步逻辑。

```javascript
actions: {
  async login(credentials) {
    const user = await api.login(credentials)
    this.user = user
    this.isLoggedIn = true
  }
}
```

## 简单示例

让我们看一个简单的计数器示例：

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // 状态
  state: () => ({
    count: 0,
    name: 'Eduardo'
  }),
  
  // 获取器
  getters: {
    doubleCount: (state) => state.count * 2
  },
  
  // 动作
  actions: {
    increment() {
      this.count++
    },
    
    async fetchUserData() {
      // 异步操作
      const userData = await api.getUser()
      this.name = userData.name
    }
  }
})
```

在组件中使用：

```vue
<template>
  <div>
    <p>{{ counter.name }}: {{ counter.count }}</p>
    <p>双倍: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">+1</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>
```

## 下一步

现在您已经了解了 Pinia 的基本概念，让我们继续学习：

- [安装 Pinia](./installation)
- [快速开始](./getting-started)
- [定义 Store](./defining-stores)

准备好深入了解 Pinia 了吗？让我们开始吧！🚀