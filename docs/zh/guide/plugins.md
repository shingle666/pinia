---
title: 插件 - Pinia 指南
description: 学习如何使用插件扩展 Pinia 状态管理。了解插件创建、store 增强和高级插件模式以增强功能。
keywords: Pinia, Vue.js, 插件, store 扩展, 插件开发, store 增强
author: Pinia Team
generator: VitePress
og:title: 插件 - Pinia 指南
og:description: 学习如何使用插件扩展 Pinia 状态管理。了解插件创建、store 增强和高级插件模式以增强功能。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/plugins
twitter:card: summary_large_image
twitter:title: 插件 - Pinia 指南
twitter:description: 学习如何使用插件扩展 Pinia 状态管理。了解插件创建、store 增强和高级插件模式以增强功能。
twitter:image: /og-image.svg
---

# 插件

得益于底层 API，Pinia store 可以完全扩展。以下是你可以做的事情列表：

- 为 store 添加新属性
- 定义 store 时添加新选项
- 为 store 添加新方法
- 包装现有方法
- 拦截 action 及其结果
- 实现副作用，如 [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- **仅**应用于特定 store

插件通过 `pinia.use()` 添加。最简单的例子是通过返回一个对象来为所有 store 添加一个静态属性：

```js
import { createPinia } from 'pinia'

// 为安装此插件后创建的每个 store 添加一个名为 `secret` 的属性
// 这可以在不同的文件中
function SecretPiniaPlugin() {
  return { secret: 'the cake is a lie' }
}

const pinia = createPinia()
// 将插件提供给 pinia
pinia.use(SecretPiniaPlugin)

// 在另一个文件中
const store = useStore()
store.secret // 'the cake is a lie'
```

这对于添加全局对象（如路由器、模态框或 toast 管理器）很有用。

## 介绍

Pinia 插件是一个函数，可选择性地返回要添加到 store 的属性。它接受一个可选参数，即*上下文*：

```js
export function myPiniaPlugin(context) {
  context.pinia // 使用 `createPinia()` 创建的 pinia
  context.app // 使用 `createApp()` 创建的当前应用（仅 Vue 3）
  context.store // 插件正在增强的 store
  context.options // 传递给 `defineStore()` 的定义 store 的选项对象
  // ...
}
```

然后使用 `pinia.use()` 将此函数传递给 `pinia`：

```js
pinia.use(myPiniaPlugin)
```

插件仅应用于在调用 `pinia.use()` **之后**创建的 store。否则，它们不会被应用。

## 增强 Store

你可以通过在插件中简单地返回一个对象来为每个 store 添加属性：

```js
pinia.use(() => ({ hello: 'world' }))
```

你也可以直接在 `store` 上设置属性，但**如果可能，请使用返回版本，以便它们可以被开发工具自动跟踪**：

```js
pinia.use(({ store }) => {
  store.hello = 'world'
})
```

插件返回的任何属性都将被开发工具自动跟踪，因此为了使 `hello` 在开发工具中可见，请确保仅在开发模式下将其添加到 `store._customProperties`，如果你想在开发工具中调试它：

```js
// 来自上面的例子
pinia.use(({ store }) => {
  store.hello = 'world'
  // 确保你的打包器处理这个。webpack 和 vite 应该默认处理
  if (process.env.NODE_ENV === 'development') {
    // 添加你在 store 上设置的任何键
    store._customProperties.add('hello')
  }
})
```

注意，每个 store 都用 [`reactive`](https://vuejs.org/api/reactivity-core.html#reactive) 包装，自动解包它包含的任何 Ref（`ref()`、`computed()` 等）：

```js
const sharedRef = ref('shared')
pinia.use(({ store }) => {
  // 每个 store 都有自己的 `hello` 属性
  store.hello = ref('secret')
  // 它会自动解包
  store.hello // 'secret'

  // 所有 store 都共享值 `shared` 属性
  store.shared = sharedRef
  store.shared // 'shared'
})
```

这就是为什么你可以访问所有计算属性而无需 `.value`，以及为什么它们是响应式的。

### 添加新状态

如果你想向 store 添加新的状态属性或在水合期间使用的属性，**你必须在两个地方添加它**：

- 在 `store` 上，这样你就可以用 `store.myState` 访问它
- 在 `store.$state` 上，这样它就可以在开发工具中使用，并且**在 SSR 期间序列化**

除此之外，你肯定必须使用 `ref()`（或其他响应式 API）来在不同访问之间共享值：

```js
import { ref } from 'vue'

const globalSecret = ref('secret')
pinia.use(({ store }) => {
  // `secret` 在所有 store 之间共享
  store.$state.secret = globalSecret
  store.secret = globalSecret
  // 它会自动解包，所以你可以直接访问它
  store.secret // 'secret'

  const hasError = ref(false)
  // 这是 store 本地的
  store.$state.hasError = hasError
  store.hasError = hasError

  // 确保你的打包器处理这个。webpack 和 vite 应该默认处理
  if (process.env.NODE_ENV === 'development') {
    // 添加你在 store 上设置的任何键
    store._customProperties.add('secret')
    store._customProperties.add('hasError')
  }
})
```

:::tip 提示
注意，在插件中发生的状态更改或添加（包括调用 `store.$patch()`）发生在 store 激活之前，因此**不会触发订阅**。
:::

### 添加新的外部属性

当添加外部属性、来自其他库的类实例或简单的非响应式内容时，你应该在将对象传递给 pinia 之前用 `markRaw()` 包装对象。这是一个将路由器添加到每个 store 的例子：

```js
import { markRaw } from 'vue'
import { router } from './router'

pinia.use(({ store }) => {
  store.router = markRaw(router)
})
```

## 添加新选项

在定义 store 时可以创建新选项，以便稍后在插件中使用它们。例如，你可以创建一个 `debounce` 选项，允许你对任何 action 进行防抖：

```js
defineStore('search', {
  actions: {
    searchContacts() {
      // ...
    },
  },

  // 这将稍后被插件读取
  debounce: {
    // 将 action searchContacts 防抖 300ms
    searchContacts: 300,
  },
})
```

然后插件可以读取该选项来包装 action 并替换原始的：

```js
// 使用任何防抖库
import { debounce } from 'lodash'

pinia.use(({ options, store }) => {
  if (options.debounce) {
    // 我们用防抖版本覆盖 action
    return Object.keys(options.debounce).reduce((debouncedActions, action) => {
      debouncedActions[action] = debounce(
        store[action],
        options.debounce[action]
      )
      return debouncedActions
    }, {})
  }
})
```

注意，使用设置语法时，自定义选项作为第三个参数传递：

```js
defineStore(
  'search',
  () => {
    // ...
  },
  {
    // 这将稍后被插件读取
    debounce: {
      // 将 action searchContacts 防抖 300ms
      searchContacts: 300,
    },
  }
)
```

## TypeScript

上面显示的所有内容都可以通过类型支持来完成。如果你使用 TypeScript，可以使用 `PiniaPluginContext` 类型。你也可以为插件本身添加类型：

```ts
import { PiniaPluginContext } from 'pinia'

export function myPiniaPlugin(context: PiniaPluginContext) {
  // ...
}
```

### 为新 store 属性添加类型

当向 store 添加新属性时，你还应该扩展 `PiniaCustomProperties` 接口。

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    // 通过使用 setter，我们可以允许字符串和 ref
    set hello(value: string | Ref<string>)
    get hello(): string

    // 你也可以定义更简单的值
    simpleNumber: number

    // 为上面插件添加的路由器添加类型（#adding-new-external-properties）
    router: Router
  }
}
```

然后可以安全地写入和读取：

```ts
pinia.use(({ store }) => {
  store.hello = 'Hola'
  store.hello = ref('Hola')

  store.simpleNumber = Math.random()
  // @ts-expect-error: 我们没有正确地为此添加类型
  store.simpleNumber = ref(Math.random())
})
```

`PiniaCustomProperties` 是一个泛型类型，允许你引用 store 的属性。想象以下示例，我们将初始选项复制为 `$options`（这仅适用于选项 store）：

```ts
pinia.use(({ options }) => ({ $options: options }))
```

我们可以通过使用 `PiniaCustomProperties` 的 4 个泛型类型来正确地为此添加类型：

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties<Id, S, G, A> {
    $options: {
      id: Id
      state?: () => S
      getters?: G
      actions?: A
    }
  }
}
```

:::tip 提示
在泛型中扩展类型时，它们必须**与源代码中的名称完全相同**。`Id` 不能命名为 `id` 或 `I`，`S` 不能命名为 `State`。以下是每个字母代表的含义：

- S: State（状态）
- G: Getters（获取器）
- A: Actions（动作）
- SS: Setup Store / Store（设置 Store / Store）
:::

### 为新状态添加类型

当添加新的状态属性（同时添加到 `store` 和 `store.$state`）时，你需要将类型添加到 `PiniaCustomStateProperties`。与 `PiniaCustomProperties` 不同，它只接收 State 泛型：

```ts
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomStateProperties<S> {
    hello: string
  }
}
```

### 为新创建选项添加类型

当为 `defineStore()` 创建新选项时，你应该扩展 `DefineStoreOptionsBase`。与 `PiniaCustomProperties` 不同，它只暴露两个泛型：State 和 Store 类型，允许你限制可以定义的内容。例如，action 的名称：

```ts
import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    // 允许为任何 action 定义毫秒数
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>
  }
}
```

:::tip 提示
还有一个 `StoreGetters` 类型来从 Store 类型中提取 getter。你也可以通过分别扩展类型 `DefineStoreOptions` 和 `DefineSetupStoreOptions` 来**仅**扩展*设置 store* 或*选项 store* 的选项。
:::

## 下一步

现在你了解了插件，学习：

- [测试](./testing) - 测试你的 store 和插件
- [服务端渲染](./ssr) - 在 SSR 中使用 Pinia
- [迁移指南](./migration-from-vuex) - 从 Vuex 迁移到 Pinia