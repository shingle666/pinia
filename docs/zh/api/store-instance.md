---
title: Store 实例 - Pinia API
description: Pinia store 实例的完整 API 参考。了解 store 属性、方法和生命周期钩子。
keywords: Pinia, Vue.js, store 实例, API 参考, store 方法, store 属性
author: Pinia 团队
generator: VitePress
og:title: Store 实例 - Pinia API
og:description: Pinia store 实例的完整 API 参考。了解 store 属性、方法和生命周期钩子。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/store-instance
twitter:card: summary_large_image
twitter:title: Store 实例 - Pinia API
twitter:description: Pinia store 实例的完整 API 参考。了解 store 属性、方法和生命周期钩子。
twitter:image: /og-image.svg
---

# Store 实例

store 实例是在组件中调用 store 函数（例如 `useUserStore()`）时创建的。本页面记录了 store 实例上可用的所有属性和方法。

## 属性

### `$id`

- **类型：** `string`
- **只读**

store 的唯一标识符，作为 `defineStore()` 的第一个参数传递。

```js
const store = useUserStore()
console.log(store.$id) // 'user'
```

### `$state`

- **类型：** `UnwrapRef<S>`

store 的状态。你可以直接访问和修改它。

```js
const store = useUserStore()
// 读取状态
console.log(store.$state.name)
// 修改状态
store.$state.name = 'New Name'
```

### `$getters`

- **类型：** `ComputedRef<G>`
- **只读**

包含所有 getters 的对象。主要用于开发工具。

```js
const store = useUserStore()
console.log(store.$getters)
```

## 方法

### `$patch()`

对 store 状态应用补丁。可以接受部分状态对象或接收当前状态的函数。

#### 签名

```ts
$patch(partialState: Partial<S>): void
$patch(stateMutator: (state: S) => void): void
```

#### 示例

**对象补丁：**

```js
store.$patch({
  name: 'New Name',
  age: 25
})
```

**函数补丁：**

```js
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})
```

### `$reset()`

**仅在选项式 Store 中可用**

将 store 状态重置为其初始值。

#### 签名

```ts
$reset(): void
```

#### 示例

```js
const store = useUserStore()
store.$reset()
```

:::tip
对于组合式 Store，你需要创建自己的 `$reset()` 函数或使用插件。
:::

### `$subscribe()`

订阅状态变化。返回一个函数来移除订阅。

#### 签名

```ts
$subscribe(
  callback: SubscriptionCallback<S>,
  options?: SubscriptionOptions
): () => void
```

#### 参数

- **callback**: 每次状态变化时调用的函数
  - **mutation**: 描述变更的对象
  - **state**: 变更后的新状态
- **options**: 订阅选项
  - **detached**: 组件卸载时保持订阅（默认：`false`）
  - **deep**: 深度监听状态（默认：`true`）
  - **flush**: 监听器刷新时机（默认：`'pre'`）

#### 示例

```js
const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('状态变化:', mutation.type)
  console.log('新状态:', state)
})

// 稍后，移除订阅
unsubscribe()
```

#### 变更类型

- `'direct'`: 状态被直接修改（例如，`store.name = 'new name'`）
- `'patch object'`: 使用对象调用了 `$patch()`
- `'patch function'`: 使用函数调用了 `$patch()`

### `$onAction()`

订阅 actions。返回一个函数来移除订阅。

#### 签名

```ts
$onAction(
  callback: ActionSubscriptionCallback,
  detached?: boolean
): () => void
```

#### 参数

- **callback**: 在每个 action 之前和之后调用的函数
  - **name**: Action 名称
  - **store**: Store 实例
  - **args**: 传递给 action 的参数
  - **after**: action 解决后调用的钩子
  - **onError**: action 抛出错误或拒绝时调用的钩子
- **detached**: 组件卸载时保持订阅（默认：`false`）

#### 示例

```js
const unsubscribe = store.$onAction((
  {
    name, // action 的名称
    store, // store 实例
    args, // 传递给 action 的参数数组
    after, // action 返回或解决后的钩子
    onError, // action 抛出或拒绝时的钩子
  }
) => {
  // 这个特定 action 调用的共享变量
  const startTime = Date.now()
  
  console.log(`开始 "${name}"，参数 [${args.join(', ')}].`)

  // 这将在 action 成功后触发
  after((result) => {
    console.log(
      `完成 "${name}"，耗时 ${Date.now() - startTime}ms.\n结果: ${result}.`
    )
  })

  // 如果 action 抛出错误或返回被拒绝的 promise，这将触发
  onError((error) => {
    console.warn(
      `失败 "${name}"，耗时 ${Date.now() - startTime}ms.\n错误: ${error}.`
    )
  })
})

// 移除订阅
unsubscribe()
```

### `$dispose()`

停止所有订阅并从 Pinia 实例中移除 store。**谨慎使用。**

#### 签名

```ts
$dispose(): void
```

#### 示例

```js
const store = useUserStore()
store.$dispose()
```

:::warning
调用 `$dispose()` 后，store 实例不应再被使用。这主要用于测试或当你需要完全清理 store 时。
:::

## TypeScript

### Store 类型

你可以使用 `Store` 工具类型获取 store 实例的类型：

```ts
import type { Store } from 'pinia'
import { useUserStore } from './stores/user'

type UserStore = Store<
  'user', // store id
  UserState, // state
  UserGetters, // getters
  UserActions // actions
>

// 或者从 store 函数推断
type UserStore = ReturnType<typeof useUserStore>
```

### 状态类型

从 store 中提取状态类型：

```ts
import type { StateTree } from 'pinia'
import { useUserStore } from './stores/user'

type UserState = StateTree & ReturnType<typeof useUserStore>['$state']
```

## 最佳实践

### 订阅管理

```js
// ✅ 好：组件中的自动清理
export default {
  setup() {
    const store = useUserStore()
    
    // 组件卸载时自动移除
    store.$subscribe((mutation, state) => {
      // 处理状态变化
    })
  }
}

// ✅ 好：需要时手动清理
export default {
  setup() {
    const store = useUserStore()
    
    const unsubscribe = store.$subscribe(
      (mutation, state) => {
        // 处理状态变化
      },
      { detached: true } // 组件卸载后保持订阅
    )
    
    // 需要时手动清理
    onBeforeUnmount(() => {
      unsubscribe()
    })
  }
}
```

### 状态修改

```js
// ✅ 好：使用 $patch 进行多个更改
store.$patch({
  name: 'New Name',
  email: 'new@email.com',
  age: 25
})

// ❌ 避免：多次直接修改
store.name = 'New Name'
store.email = 'new@email.com'
store.age = 25
```

### Action 监控

```js
// ✅ 好：监控 actions 用于调试
if (process.env.NODE_ENV === 'development') {
  store.$onAction(({ name, args, after, onError }) => {
    console.log(`Action ${name} 被调用，参数:`, args)
    
    after((result) => {
      console.log(`Action ${name} 解决，结果:`, result)
    })
    
    onError((error) => {
      console.error(`Action ${name} 失败:`, error)
    })
  })
}
```

## 另请参阅

- [defineStore()](./define-store) - 创建 stores
- [Pinia 实例](./pinia-instance) - Pinia 实例 API
- [工具函数](./utilities) - 工具函数