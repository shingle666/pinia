---
title: Getters 计算属性 - Pinia 指南
description: 学习如何在 Pinia store 中使用 getters 来计算派生状态值。了解缓存、访问其他 getters 以及向 getters 传递参数。
keywords: Pinia, Vue.js, getters, 计算属性, 派生状态, store getters, 缓存
author: Pinia 团队
generator: VitePress
og:title: Getters 计算属性 - Pinia 指南
og:description: 学习如何在 Pinia store 中使用 getters 来计算派生状态值。了解缓存、访问其他 getters 以及向 getters 传递参数。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/getters
twitter:card: summary_large_image
twitter:title: Getters 计算属性 - Pinia 指南
twitter:description: 学习如何在 Pinia store 中使用 getters 来计算派生状态值。了解缓存、访问其他 getters 以及向 getters 传递参数。
twitter:image: /og-image.svg
---

# Getters

Getters 完全等同于 store 的 state 的[计算值](https://cn.vuejs.org/guide/essentials/computed.html)。可以通过 `defineStore()` 中的 `getters` 属性来定义它们。**推荐**使用箭头函数，并且它将接收 `state` 作为第一个参数：

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
})
```

大多数时候，getter 仅依赖 state，不过，有时它们也需要使用其他 getter。因此，即使在使用常规函数定义 getter 时，我们也可以通过 `this` 访问到**整个 store 实例**，**但(在 TypeScript 中)必须定义返回类型**。这是为了避免 TypeScript 的已知缺陷，**不过这不影响用箭头函数定义的 getter，也不会影响不使用 `this` 的 getter**。

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    // 自动推断出返回类型是一个 number
    doubleCount(state) {
      return state.count * 2
    },
    // 返回类型**必须**明确设置
    doublePlusOne(): number {
      // 整个 store 的 自动补全和类型标注 ✨
      return this.doubleCount + 1
    },
  },
})
```

然后你可以直接访问 store 实例上的 getter 了：

```vue
<script setup>
import { useCounterStore } from './counterStore'

const store = useCounterStore()
</script>

<template>
  <p>Double count is {{ store.doubleCount }}</p>
</template>
```

## 访问其他 getter

与计算属性一样，你也可以组合多个 getter。通过 `this`，你可以访问到其他任何 getter。即使你没有使用 TypeScript，你也可以用 [JSDoc](https://jsdoc.app/tags-returns.html) 来让你的 IDE 提示类型。

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    // 类型是自动推断出来的，因为我们没有使用 `this`
    doubleCount: (state) => state.count * 2,
    // 这里我们需要自己添加类型(在 JS 中使用 JSDoc)
    // 可以用 this 来引用 getter
    /**
     * 返回 count 的值乘以 2 加 1
     *
     * @returns {number}
     */
    doubleCountPlusOne() {
      // 自动补全 ✨
      return this.doubleCount + 1
    },
  },
})
```

## 向 getter 传递参数

*Getters* 只是幕后的**计算**属性，所以不可以向它们传递任何参数。不过，你可以从 *getter* 返回一个函数，该函数可以接受任意参数：

```js
export const useStore = defineStore('main', {
  getters: {
    getUserById: (state) => {
      return (userId) => state.users.find((user) => user.id === userId)
    },
  },
})
```

并在组件中使用：

```vue
<script setup>
import { useUserStore } from './store'
const userStore = useUserStore()

const { getUserById } = storeToRefs(userStore)
// 请注意，你需要使用 `getUserById.value` 来访问
// 在 <script setup> 中的函数
const user2 = getUserById.value(2)
</script>

<template>
  <p>User 2: {{ getUserById(2) }}</p>
</template>
```

请注意，当你这样做时，**getters 将不再被缓存**，它们只是一个被你调用的函数。不过，你可以在 getter 本身中缓存一些结果，虽然这种做法并不常见，但有证明表明它的性能会更好：

```js
export const useStore = defineStore('main', {
  getters: {
    getActiveUserById(state) {
      const activeUsers = state.users.filter((user) => user.active)
      return (userId) => activeUsers.find((user) => user.id === userId)
    },
  },
})
```

## 访问其他 store 的 getter

想要使用另一个 store 的 getter 的话，那就直接在 *getter* 内使用就好：

```js
import { useOtherStore } from './other-store'

export const useStore = defineStore('main', {
  state: () => ({
    // ...
  }),
  getters: {
    otherGetter(state) {
      const otherStore = useOtherStore()
      return state.localData + otherStore.data
    },
  },
})
```

## 使用 `setup()` 时的用法

作为 store 的一个属性，你可以直接访问任何 getter(与 state 属性完全一样)：

```vue
<script setup>
import { useCounterStore } from './counterStore'

const store = useCounterStore()

store.count = 3
store.doubleCount // 6
</script>
```

## 使用选项式 API 的用法

<VueSchoolLink
  href="https://vueschool.io/lessons/access-pinia-getters-in-the-options-api"
  title="在选项式 API 中访问 Pinia Getters"
/>

对于以下示例，你可以假设相关 store 是这样创建的：

```js
// 示例文件路径：
// ./src/stores/counter.js

import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    doubleCount(state) {
      return state.count * 2
    },
  },
})
```

### 使用 `mapState()`

你可以使用 `mapState()` 函数来访问 getter：

```js
import { mapState } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default {
  computed: {
    // 允许在组件中访问 this.doubleCount
    // 与从 store.doubleCount 中读取的相同
    ...mapState(useCounterStore, ['doubleCount'])
    // 与上述相同，但将其注册为 this.myOwnName
    ...mapState(useCounterStore, {
      myOwnName: 'doubleCount',
      // 你也可以写一个函数来获得对 store 的访问权
      double: store => store.doubleCount,
    }),
  },
}
```

## 下一步

现在你了解了 getters，接下来学习：

- [Actions 动作](./actions) - 修改状态和处理副作用
- [插件系统](./plugins) - 扩展 store 功能
- [测试](./testing) - 测试你的 stores 和 getters