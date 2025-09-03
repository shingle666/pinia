---
title: Pinia 实例 - Pinia API
description: Pinia 实例的完整 API 参考。了解 Pinia 配置、插件和全局方法。
keywords: Pinia, Vue.js, Pinia 实例, API 参考, createPinia, 插件
author: Pinia 团队
generator: VitePress
og:title: Pinia 实例 - Pinia API
og:description: Pinia 实例的完整 API 参考。了解 Pinia 配置、插件和全局方法。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/pinia-instance
twitter:card: summary_large_image
twitter:title: Pinia 实例 - Pinia API
twitter:description: Pinia 实例的完整 API 参考。了解 Pinia 配置、插件和全局方法。
twitter:image: /og-image.svg
---

# Pinia 实例

Pinia 实例是管理应用程序中所有 store 的中央枢纽。它通过 `createPinia()` 创建并作为 Vue 插件安装。

## 创建 Pinia 实例

### `createPinia()`

创建一个新的 Pinia 实例。

#### 签名

```ts
function createPinia(): Pinia
```

#### 示例

```js
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const app = createApp({})
const pinia = createPinia()

app.use(pinia)
```

## 属性

### `install`

- **类型：** `(app: App, ...options: any[]) => any`

Vue 插件安装函数。使用 `app.use(pinia)` 时自动调用。

### `state`

- **类型：** `Ref<Record<string, StateTree>>`
- **只读**

包含所有 store 状态的响应式对象。主要用于内部和开发工具。

```js
const pinia = createPinia()
console.log(pinia.state.value) // { user: { ... }, cart: { ... } }
```

## 方法

### `use()`

向 Pinia 实例添加插件。插件会应用到添加插件后创建的所有 store。

#### 签名

```ts
use(plugin: PiniaPlugin): Pinia
```

#### 参数

- **plugin**: 接收上下文对象并可选择性返回要添加到 store 的属性的函数

#### 示例

```js
import { createPinia } from 'pinia'

const pinia = createPinia()

// 添加简单插件
pinia.use(({ store }) => {
  store.hello = 'world'
})

// 添加带选项的插件
function createLoggerPlugin(options = {}) {
  return ({ store }) => {
    if (options.enabled) {
      store.$onAction(({ name, args }) => {
        console.log(`Action ${name} 被调用，参数:`, args)
      })
    }
  }
}

pinia.use(createLoggerPlugin({ enabled: true }))
```

### `_s` (内部)

- **类型：** `Map<string, StoreGeneric>`
- **仅供内部使用**

包含所有已注册 store 的 Map。由 Pinia 内部使用。

### `_e` (内部)

- **类型：** `EffectScope`
- **仅供内部使用**

Pinia 实例的 effect scope。用于内部清理。

## 插件系统

### 插件上下文

创建插件时，你会收到一个包含以下属性的上下文对象：

```ts
interface PiniaPluginContext {
  pinia: Pinia
  app: App
  store: Store
  options: DefineStoreOptions
}
```

#### 属性

- **pinia**: Pinia 实例
- **app**: Vue 应用实例（仅 Vue 3）
- **store**: 正在增强的 store
- **options**: 传递给 `defineStore()` 的选项对象

### 插件示例

#### 简单属性插件

```js
function addSecretPlugin() {
  return { secret: 'the cake is a lie' }
}

pinia.use(addSecretPlugin)
```

#### 路由器插件

```js
import { markRaw } from 'vue'
import { router } from './router'

function routerPlugin({ store }) {
  store.router = markRaw(router)
}

pinia.use(routerPlugin)
```

#### 持久化插件

```js
import { watch } from 'vue'

function persistencePlugin({ store }) {
  const storageKey = `pinia-${store.$id}`
  
  // 从 localStorage 恢复
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }
  
  // 变化时保存到 localStorage
  watch(
    () => store.$state,
    (state) => {
      localStorage.setItem(storageKey, JSON.stringify(state))
    },
    { deep: true }
  )
}

pinia.use(persistencePlugin)
```

## TypeScript

### 插件类型

```ts
import type { PiniaPluginContext } from 'pinia'

function myPlugin(context: PiniaPluginContext) {
  // 插件实现
}
```

### 扩展 Store 属性

通过插件向 store 添加属性时，扩展 `PiniaCustomProperties` 接口：

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    router: Router
    secret: string
  }
}
```

### 扩展 Store 状态

对于状态属性，扩展 `PiniaCustomStateProperties`：

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomStateProperties<S> {
    lastUpdated: Date
  }
}
```

## SSR 支持

### 服务端

```js
// server.js
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp({})
  const pinia = createPinia()
  
  app.use(pinia)
  
  return { app, pinia }
}
```

### 客户端水合

```js
// client.js
import { createApp } from './main'

const { app, pinia } = createApp()

// 从服务器水合状态
if (window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.mount('#app')
```

## 测试

### 创建测试实例

```js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
})
```

### 模拟插件

```js
import { createPinia } from 'pinia'

const pinia = createPinia()

// 测试用模拟插件
pinia.use(() => ({
  $api: {
    get: vi.fn(),
    post: vi.fn()
  }
}))
```

## 最佳实践

### 插件顺序

```js
const pinia = createPinia()

// 按依赖顺序添加插件
pinia.use(routerPlugin) // 基础功能
pinia.use(persistencePlugin) // 依赖状态
pinia.use(loggerPlugin) // 应该最后添加以完整记录
```

### 条件插件

```js
const pinia = createPinia()

// 仅开发环境插件
if (process.env.NODE_ENV === 'development') {
  pinia.use(loggerPlugin)
  pinia.use(devtoolsPlugin)
}

// 仅生产环境插件
if (process.env.NODE_ENV === 'production') {
  pinia.use(analyticsPlugin)
}
```

### 插件配置

```js
// 创建可配置插件
function createApiPlugin(baseURL) {
  return ({ store }) => {
    store.$api = createApiClient(baseURL)
  }
}

const pinia = createPinia()
pinia.use(createApiPlugin('https://api.example.com'))
```

## 生命周期

### 安装

1. `createPinia()` 创建新实例
2. `app.use(pinia)` 安装插件
3. Pinia 设置全局属性并提供实例

### Store 创建

1. `defineStore()` 注册 store 定义
2. 首次调用 `useStore()` 创建 store 实例
3. 插件应用到新 store
4. Store 添加到 Pinia 实例

### 清理

1. 应用卸载时，Pinia 清理所有 store
2. Effect scope 被销毁
3. 订阅被移除

## 另请参阅

- [createPinia()](./create-pinia) - 创建 Pinia 实例
- [Store 实例](./store-instance) - Store 实例 API
- [工具函数](./utilities) - 工具函数
- [插件指南](../guide/plugins) - 插件开发指南