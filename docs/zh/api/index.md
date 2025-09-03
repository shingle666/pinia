---
title: Pinia API 参考 | 完整文档
description: Pinia 的完整 API 文档。探索所有函数、类型和 Vue.js 状态管理工具，包含详细示例和使用指南。
keywords: Pinia API, Vue 状态管理 API, defineStore, createPinia, Pinia 文档, Vue.js API 参考
head:
  - ["meta", { name: "author", content: "tzx" }]
  - ["meta", { name: "generator", content: "tzx" }]
  - ["meta", { property: "og:type", content: "website" }]
  - ["meta", { property: "og:title", content: "Pinia API 参考 | 完整文档" }]
  - ["meta", { property: "og:description", content: "Pinia 的完整 API 文档。探索所有函数、类型和 Vue.js 状态管理工具，包含详细示例和使用指南。" }]
  - ["meta", { property: "og:url", content: "https://allfun.net/zh/api/" }]
  - ["meta", { property: "og:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:card", content: "summary_large_image" }]
  - ["meta", { property: "twitter:title", content: "Pinia API 参考 | 完整文档" }]
  - ["meta", { property: "twitter:description", content: "Pinia 的完整 API 文档。探索所有函数、类型和 Vue.js 状态管理工具，包含详细示例和使用指南。" }]
  - ["meta", { property: "twitter:image", content: "https://allfun.net/og-image.svg" }]
  - ["meta", { property: "twitter:url", content: "https://allfun.net/zh/api/" }]
---

# API 参考

本节提供了 Pinia 的完整 API 参考文档。

## 核心 API

### 创建和配置

- [`createPinia()`](./create-pinia) - 创建 Pinia 实例
- [`defineStore()`](./define-store) - 定义 store
- [`setActivePinia()`](./set-active-pinia) - 设置活动的 Pinia 实例

### Store 实例

- [`$id`](./store-instance#id) - Store 的唯一标识符
- [`$state`](./store-instance#state) - Store 的状态对象
- [`$patch()`](./store-instance#patch) - 批量更新状态
- [`$reset()`](./store-instance#reset) - 重置 store 状态
- [`$subscribe()`](./store-instance#subscribe) - 订阅状态变化
- [`$onAction()`](./store-instance#onaction) - 订阅 action 执行
- [`$dispose()`](./store-instance#dispose) - 销毁 store 实例

### 工具函数

- [`storeToRefs()`](./store-to-refs) - 将 store 转换为响应式引用
- [`mapStores()`](./map-stores) - 映射多个 stores（选项式 API）
- [`mapState()`](./map-state) - 映射状态和 getters（选项式 API）
- [`mapWritableState()`](./map-writable-state) - 映射可写状态（选项式 API）
- [`mapActions()`](./map-actions) - 映射 actions（选项式 API）

## 类型定义

### Store 类型

```typescript
interface DefineStoreOptions<Id, S, G, A> {
  id?: Id
  state?: () => S
  getters?: G & ThisType<UnwrapRef<S> & _StoreWithGetters<G> & PiniaCustomProperties>
  actions?: A & ThisType<A & UnwrapRef<S> & _StoreWithState<Id, S> & _StoreWithGetters<G> & PiniaCustomProperties>
  hydrate?(storeState: UnwrapRef<S>, initialState: UnwrapRef<S>): void
}
```

### Store 实例类型

```typescript
interface Store<Id, S, G, A> {
  $id: Id
  $state: UnwrapRef<S>
  $patch(partialState: _DeepPartial<UnwrapRef<S>>): void
  $patch<F extends (state: UnwrapRef<S>) => any>(stateMutator: ReturnType<F> extends Promise<any> ? never : F): void
  $reset(): void
  $subscribe(callback: SubscriptionCallback<S>, options?: { detached?: boolean }): () => void
  $onAction(callback: StoreOnActionListener<Id, S, G, A>, detached?: boolean): () => void
  $dispose(): void
}
```

## 插件 API

### 插件类型

```typescript
interface PiniaPlugin {
  (context: PiniaPluginContext): Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
}

interface PiniaPluginContext<Id = string, S extends StateTree = StateTree, G = _GettersTree<S>, A = _ActionsTree> {
  pinia: Pinia
  app: App
  store: Store<Id, S, G, A>
  options: DefineStoreOptionsInPlugin<Id, S, G, A>
}
```

### 插件方法

- [`pinia.use()`](./plugins#use) - 注册插件
- [`context.store`](./plugins#context-store) - 当前 store 实例
- [`context.options`](./plugins#context-options) - store 定义选项

## 开发工具

### DevTools 集成

```typescript
interface PiniaDevtools {
  enabled: boolean
  timeline: {
    layerId: string
    label: string
    color: number
  }
}
```

## 服务端渲染

### SSR 相关 API

- [`createPinia()`](./ssr#create-pinia) - 服务端创建 Pinia 实例
- [`pinia.state.value`](./ssr#state-serialization) - 状态序列化
- [`setActivePinia()`](./ssr#set-active-pinia) - 设置服务端 Pinia 实例

## 迁移助手

### 从 Vuex 迁移

- [`createVuexStore()`](./migration#create-vuex-store) - Vuex 兼容层
- [`mapVuexState()`](./migration#map-vuex-state) - 映射 Vuex 状态
- [`mapVuexGetters()`](./migration#map-vuex-getters) - 映射 Vuex getters
- [`mapVuexActions()`](./migration#map-vuex-actions) - 映射 Vuex actions

## 实用工具

### 类型工具

```typescript
// 提取 store 的状态类型
type StoreState<T> = T extends Store<any, infer S, any, any> ? S : never

// 提取 store 的 getters 类型
type StoreGetters<T> = T extends Store<any, any, infer G, any> ? G : never

// 提取 store 的 actions 类型
type StoreActions<T> = T extends Store<any, any, any, infer A> ? A : never
```

### 运行时工具

```typescript
// 检查是否为 store 实例
function isStore(obj: any): obj is Store

// 获取所有 store 实例
function getActivePinia(): Pinia | undefined

// 获取 store 的原始定义
function getStoreDefinition<T extends Store>(store: T): DefineStoreOptions
```

## 配置选项

### Pinia 配置

```typescript
interface PiniaOptions {
  plugins?: PiniaPlugin[]
  devtools?: boolean | PiniaDevtools
}
```

### Store 配置

```typescript
interface StoreOptions {
  // 是否启用开发工具
  devtools?: boolean
  
  // 自定义序列化
  serialize?: {
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  
  // 持久化选项
  persist?: {
    enabled: boolean
    strategies: PersistStrategy[]
  }
}
```

## 错误处理

### 错误类型

```typescript
class PiniaError extends Error {
  constructor(message: string, code?: string)
}

class StoreNotFoundError extends PiniaError {
  constructor(storeId: string)
}

class InvalidStoreError extends PiniaError {
  constructor(reason: string)
}
```

### 错误处理方法

```typescript
// 全局错误处理
pinia.use(({ store }) => {
  store.$onAction(({ name, error }) => {
    if (error) {
      console.error(`Action ${name} failed:`, error)
      // 发送错误报告
      errorReporting.captureException(error)
    }
  })
})
```

## 性能优化

### 性能相关 API

```typescript
// 批量更新
store.$patch((state) => {
  state.items.push(newItem)
  state.count++
})

// 跳过响应式
store.$state = markRaw(newState)

// 浅层响应式
const shallowStore = defineStore('shallow', {
  state: () => shallowRef({
    largeObject: {}
  })
})
```

## 测试工具

### 测试助手

```typescript
// 创建测试用的 Pinia 实例
function createTestingPinia(options?: {
  initialState?: Record<string, any>
  plugins?: PiniaPlugin[]
  stubActions?: boolean
}): Pinia

// 模拟 store
function mockStore<T extends Store>(store: T, overrides?: Partial<T>): T

// 重置所有 stores
function resetAllStores(): void
```

## 下一步

选择您感兴趣的 API 深入了解：

- [defineStore() 详解](./define-store) - 学习如何定义 store
- [Store 实例方法](./store-instance) - 掌握 store 实例的所有方法
- [工具函数](./utilities) - 了解实用的工具函数
- [插件开发](./plugins) - 学习如何开发 Pinia 插件
- [TypeScript 支持](./typescript) - 充分利用类型安全的优势

需要查找特定的 API？使用页面顶部的搜索功能快速定位！🔍