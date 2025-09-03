---
layout: home
title: Pinia | 您会喜欢使用的 Vue Store
description: Pinia 是 Vue.js 的官方状态管理库。类型安全、可扩展且模块化的设计。完美的 Vuex 替代品，具有出色的 TypeScript 支持。
keywords: Pinia, Vue.js, 状态管理, Vuex 替代品, TypeScript, Vue store, 响应式状态
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "website" }]
  - ["meta", { property: "og:title", content: "Pinia | 您会喜欢使用的 Vue Store" }]
  - ["meta", { property: "og:description", content: "Pinia 是 Vue.js 的官方状态管理库。类型安全、可扩展且模块化的设计。完美的 Vuex 替代品，具有出色的 TypeScript 支持。" }]
  - ["meta", { property: "og:url", content: "https://allfun.net/zh/" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Pinia | 您会喜欢使用的 Vue Store" }]
  - ["meta", { property: "twitter:description", content: "Pinia 是 Vue.js 的官方状态管理库。类型安全、可扩展且模块化的设计。完美的 Vuex 替代品，具有出色的 TypeScript 支持。" }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/zh/" }]

hero:
  name: "Pinia 学习指南"
  text: "Vue.js 的直观状态管理库"
  tagline: 类型安全、可扩展、模块化设计
  image:
    src: /logo.svg
    alt: Pinia
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 什么是 Pinia？
      link: /zh/guide/introduction
    - theme: alt
      text: 在 GitHub 查看
      link: https://github.com/shingle666

features:
  - icon: 🍍
    title: 直观易用
    details: 直观的 API，让状态管理变得简单明了。无需复杂的样板代码，专注于业务逻辑。
  - icon: 🔒
    title: 类型安全
    details: 完整的 TypeScript 支持，提供出色的类型推断和自动补全体验。
  - icon: ⚡
    title: 开发工具
    details: 强大的 Vue DevTools 支持，时间旅行调试和热重载功能。
  - icon: 🔧
    title: 可扩展
    details: 通过插件系统扩展 Pinia 功能，满足各种复杂需求。
  - icon: 📦
    title: 模块化
    details: 每个 store 都是独立的模块，支持代码分割和懒加载。
  - icon: 🪶
    title: 轻量级
    details: 压缩后仅约 1.5KB，对应用性能影响极小。
---

## 快速开始

### 安装

::: code-group

```bash [npm]
npm install pinia
```

```bash [yarn]
yarn add pinia
```

```bash [pnpm]
pnpm add pinia
```

:::

### 基本用法

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

```vue
<!-- 在组件中使用 -->
<template>
  <div>
    <p>计数: {{ counter.count }}</p>
    <p>双倍计数: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">增加</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>
```

## 为什么选择 Pinia？

Pinia 是 Vue.js 的官方状态管理库，它提供了更简单、更直观的 API，同时保持了强大的功能：

- **🎯 简单直观**：API 设计简洁，学习成本低
- **🔄 组合式 API 友好**：完美支持 Vue 3 的组合式 API
- **📱 SSR 支持**：服务端渲染开箱即用
- **🧪 易于测试**：每个 store 都可以独立测试
- **🔌 插件生态**：丰富的插件生态系统

准备好开始了吗？查看我们的 [快速开始指南](/zh/guide/getting-started) 或了解 [Pinia 的核心概念](/zh/guide/introduction)。