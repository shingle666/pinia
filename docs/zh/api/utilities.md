---
title: 工具函数 - Pinia API
description: Pinia 工具函数的完整 API 参考。了解 storeToRefs、mapStores 和其他辅助函数。
keywords: Pinia, Vue.js, 工具函数, storeToRefs, mapStores, API 参考
author: Pinia 团队
generator: VitePress
og:title: 工具函数 - Pinia API
og:description: Pinia 工具函数的完整 API 参考。了解 storeToRefs、mapStores 和其他辅助函数。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/utilities
twitter:card: summary_large_image
twitter:title: 工具函数 - Pinia API
twitter:description: Pinia 工具函数的完整 API 参考。了解 storeToRefs、mapStores 和其他辅助函数。
twitter:image: /og-image.svg
---

# 工具函数

Pinia 提供了几个工具函数，帮助你在不同场景下更有效地使用 store。

## `storeToRefs()`

从 store 中提取 refs，使状态和 getters 保持响应式。

### 签名

```ts
function storeToRefs<T extends StoreGeneric>(
  store: T
): StoreToRefs<T>
```

### 参数

- **store**: 要提取 refs 的 store 实例

### 返回值

包含所有状态属性和 getters 的响应式 refs 的对象。

### 示例

```vue
<template>
  <div>
    <p>计数: {{ count }}</p>
    <p>双倍: {{ doubleCount }}</p>
    <button @click="increment">+</button>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// 提取响应式 refs
const { count, doubleCount } = storeToRefs(store)

// actions 可以直接解构
const { increment } = store
</script>
```

### 为什么使用 storeToRefs？

不使用 `storeToRefs` 时，解构的属性会失去响应性：

```js
// ❌ 这会破坏响应性
const { count, doubleCount } = store

// ✅ 这会保持响应性
const { count, doubleCount } = storeToRefs(store)
```

### TypeScript

```ts
import type { StoreToRefs } from 'pinia'

type CounterRefs = StoreToRefs<ReturnType<typeof useCounterStore>>
// CounterRefs = {
//   count: Ref<number>
//   doubleCount: ComputedRef<number>
// }
```

## `mapStores()`

将多个 store 映射为计算属性，用于 Options API 组件。

### 签名

```ts
function mapStores<T extends Record<string, StoreDefinition>>(
  ...stores: [...StoreDefinitions<T>]
): ComputedOptions
```

### 参数

- **stores**: 要映射的 store 定义

### 返回值

Options API 的计算属性对象。

### 示例

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    // 映射为 this.userStore 和 this.cartStore
    ...mapStores(useUserStore, useCartStore)
  },
  
  methods: {
    async login() {
      await this.userStore.login()
      this.cartStore.loadUserCart()
    }
  }
}
```

### 自定义名称

```js
import { mapStores } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    // 映射为 this.user 而不是 this.userStore
    ...mapStores({ user: useUserStore })
  }
}
```

## `setActivePinia()`

设置活动的 Pinia 实例。对测试和 SSR 很有用。

### 签名

```ts
function setActivePinia(pinia: Pinia | undefined): Pinia | undefined
```

### 参数

- **pinia**: 要设置为活动的 Pinia 实例

### 返回值

之前活动的 Pinia 实例。

### 示例

```js
import { createPinia, setActivePinia } from 'pinia'

// 测试设置
const pinia = createPinia()
setActivePinia(pinia)

// 现在可以在没有应用上下文的情况下使用 store
const store = useMyStore()
```

### 测试用法

```js
import { beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

test('store 工作正常', () => {
  const store = useMyStore()
  expect(store.count).toBe(0)
})
```

## `getActivePinia()`

获取当前活动的 Pinia 实例。

### 签名

```ts
function getActivePinia(): Pinia | undefined
```

### 返回值

当前活动的 Pinia 实例，如果没有设置则返回 `undefined`。

### 示例

```js
import { getActivePinia } from 'pinia'

function myPlugin() {
  const pinia = getActivePinia()
  if (pinia) {
    // 使用 pinia 实例
  }
}
```

## `acceptHMRUpdate()`

在开发期间为 store 启用热模块替换 (HMR)。

### 签名

```ts
function acceptHMRUpdate<T>(
  initialUseStore: () => T,
  hot: any
): (newModule: any) => any
```

### 参数

- **initialUseStore**: store 组合函数
- **hot**: HMR 上下文（通常是 `import.meta.hot`）

### 示例

```js
// stores/counter.js
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  }
})

// 启用 HMR
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```

### Vite 配置

```js
// vite.config.js
export default {
  define: {
    __VUE_PROD_DEVTOOLS__: true
  }
}
```

## `skipHydration()`

标记一个 ref 在 SSR 水合期间被跳过。

### 签名

```ts
function skipHydration<T>(obj: T): T
```

### 参数

- **obj**: 要跳过水合的 ref 或响应式对象

### 示例

```js
import { defineStore, skipHydration } from 'pinia'
import { ref } from 'vue'

export const useStore = defineStore('main', () => {
  // 这不会从服务器状态水合
  const clientOnlyData = skipHydration(ref('client-only'))
  
  return { clientOnlyData }
})
```

### 使用场景

- 客户端特定数据（用户偏好、设备信息）
- 应该在客户端始终保持新鲜的数据
- 避免水合不匹配

## 辅助函数

### `isRef()`

检查一个值是否为 ref。

```js
import { isRef } from 'vue'
import { storeToRefs } from 'pinia'

const store = useMyStore()
const { count } = storeToRefs(store)

console.log(isRef(count)) // true
console.log(isRef(store.count)) // false
```

### `unref()`

获取 ref 的值，如果不是 ref 则返回值本身。

```js
import { unref } from 'vue'
import { storeToRefs } from 'pinia'

const store = useMyStore()
const { count } = storeToRefs(store)

console.log(unref(count)) // 实际的数字值
```

### `toRef()`

为响应式对象的属性创建 ref。

```js
import { toRef } from 'vue'

const store = useMyStore()
const countRef = toRef(store, 'count')

// countRef 是响应式的并链接到 store.count
```

## 高级模式

### 条件 Store 访问

```js
import { getActivePinia } from 'pinia'

function useStoreIfAvailable() {
  const pinia = getActivePinia()
  if (pinia) {
    return useMyStore()
  }
  return null
}
```

### Store 工厂

```js
import { setActivePinia, createPinia } from 'pinia'

function createStoreInstance() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return useMyStore()
}
```

### 响应式 Store 列表

```js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

function useMultipleStores(storeList) {
  return computed(() => {
    return storeList.map(useStore => {
      const store = useStore()
      return storeToRefs(store)
    })
  })
}
```

## TypeScript 工具

### Store 类型提取

```ts
import type { Store } from 'pinia'

type MyStore = ReturnType<typeof useMyStore>
type MyStoreState = MyStore['$state']
type MyStoreGetters = Pick<MyStore, 'doubleCount' | 'isEven'>
```

### 通用 Store 辅助器

```ts
function createStoreHelper<T extends StoreGeneric>(useStore: () => T) {
  return {
    getRefs: () => storeToRefs(useStore()),
    getInstance: () => useStore(),
    reset: () => useStore().$reset()
  }
}

const counterHelper = createStoreHelper(useCounterStore)
```

## 最佳实践

### 1. 解构时始终使用 storeToRefs

```js
// ✅ 好
const { count, name } = storeToRefs(store)
const { increment, updateName } = store

// ❌ 坏 - 失去响应性
const { count, name, increment } = store
```

### 2. 优先使用 Composition API

```js
// ✅ 推荐
const store = useMyStore()
const { count } = storeToRefs(store)

// ⚠️ 必要时使用 Options API
computed: {
  ...mapStores(useMyStore)
}
```

### 3. 在测试中使用 setActivePinia

```js
// ✅ 好的测试设置
beforeEach(() => {
  setActivePinia(createPinia())
})

// ❌ 不要忘记设置活动 pinia
test('store 测试', () => {
  const store = useMyStore() // 没有活动 pinia 可能会失败
})
```

### 4. 在开发中启用 HMR

```js
// ✅ 始终添加 HMR 支持
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyStore, import.meta.hot))
}
```

## 另请参阅

- [Store 实例](./store-instance) - Store 实例 API
- [storeToRefs](./store-to-refs) - 详细的 storeToRefs 指南
- [映射辅助器](./map-stores) - 映射工具
- [测试指南](../guide/testing) - 使用 Pinia 进行测试