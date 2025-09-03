---
title: Actions 动作 - Pinia 指南
description: 学习如何在 Pinia store 中使用 actions 来修改状态和处理副作用。了解同步和异步 actions、访问其他 stores 以及错误处理。
keywords: Pinia, Vue.js, actions, 状态修改, 异步 actions, 副作用, store actions
author: Pinia 团队
generator: VitePress
og:title: Actions 动作 - Pinia 指南
og:description: 学习如何在 Pinia store 中使用 actions 来修改状态和处理副作用。了解同步和异步 actions、访问其他 stores 以及错误处理。
og:image: /og-image.svg
og:url: https://allfun.net/zh/guide/actions
twitter:card: summary_large_image
twitter:title: Actions 动作 - Pinia 指南
twitter:description: 学习如何在 Pinia store 中使用 actions 来修改状态和处理副作用。了解同步和异步 actions、访问其他 stores 以及错误处理。
twitter:image: /og-image.svg
---

# Actions

Actions 相当于组件中的 [methods](https://cn.vuejs.org/guide/essentials/methods.html)。它们可以通过 `defineStore()` 中的 `actions` 属性来定义，**并且它们也是定义业务逻辑的完美选择。**

```js
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++
    },
    randomizeCounter() {
      this.count = Math.round(100 * Math.random())
    },
  },
})
```

类似 [getter](./getters.md)，action 也可通过 `this` 访问**整个 store 实例**，并支持**完整的类型标注(以及自动补全 ✨)**。**不同的是，`action` 可以是异步的**，你可以在它们里面 `await` 调用任何 API，以及其他 action！下面是一个使用 [Mande](https://github.com/posva/mande) 的例子。请注意，你使用什么库并不重要，只要你得到的是一个`Promise`，你甚至可以使用原生 `fetch` 函数 (浏览器环境下)：

```js
import { mande } from 'mande'

const api = mande('/api/users')

export const useUsers = defineStore('users', {
  state: () => ({
    userData: {},
    // ...
  }),

  actions: {
    async registerUser(login, password) {
      try {
        this.userData = await api.post({ login, password })
        showTooltip(`Welcome back ${this.userData.name}!`)
      } catch (error) {
        showTooltip(error)
        // 让表单组件显示错误
        return error
      }
    },
  },
})
```

你也完全可以自由地设置任何你想要的参数以及返回任何结果。当调用 action 时，一切类型也都是可以被自动推断出来的。

Action 可以像函数或者通常意义上的方法一样被调用：

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
// 将 action 作为 store 的方法进行调用
store.randomizeCounter()
</script>
```

## 访问其他 store

想要使用另一个 store 的话，那你直接在 *action* 中调用就好了：

```js
import { useAuthStore } from './auth-store'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    preferences: {},
    // ...
  }),
  actions: {
    async fetchUserPreferences() {
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        this.preferences = await fetchPreferences()
      } else {
        throw new Error('User must be authenticated')
      }
    },
  },
})
```

## 使用 `setup()` 时的用法

你可以直接调用 store 的任意 action：

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

store.randomizeCounter()
</script>
```

## 使用选项式 API 的用法

<VueSchoolLink
  href="https://vueschool.io/lessons/access-pinia-actions-in-the-options-api"
  title="在选项式 API 中访问 Pinia Actions"
/>

对于以下示例，你可以假设相关 store 是这样创建的：

```js
// 示例文件路径：
// ./src/stores/counter.js

import { defineStore } from 'pinia'

const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    }
  }
})
```

### 使用 `mapActions()`

你可以使用 `mapActions()` 辅助函数将 action 属性映射为你组件中的方法：

```js
import { mapActions } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default {
  methods: {
    // 访问组件内的 this.increment()
    // 与从 store.increment() 调用相同
    ...mapActions(useCounterStore, ['increment'])
    // 与上述相同，但将其注册为this.myOwnName()
    ...mapActions(useCounterStore, { myOwnName: 'increment' }),
  },
}
```

## 订阅 action

你可以通过 `store.$onAction()` 来监听 action 和它们的结果。传递给它的回调函数会在 action 本身之前执行。`after` 表示在 promise 解决之后，允许你在 action 解决之后执行一个回调函数。同样地，`onError` 允许你在 action 抛出错误或 reject 时执行一个回调函数。这些函数对于追踪运行时错误非常有用，类似于[Vue docs 中的这个提示](https://cn.vuejs.org/guide/essentials/errorhandling.html#错误处理)。

这里有一个例子，在运行 action 之前以及 action 解决/拒绝之后打印日志记录。

```js
const unsubscribe = someStore.$onAction(
  ({
    name, // action 名称
    store, // store 实例，类似 `someStore`
    args, // 传递给 action 的参数数组
    after, // 在 action 返回或解决后的钩子
    onError, // action 抛出或拒绝的钩子
  }) => {
    // 为这个特定的 action 调用提供一个共享变量
    const startTime = Date.now()
    // 这将在执行 "store" 的 action 之前触发。
    console.log(`Start "${name}" with params [${args.join(', ')}].`)

    // 这将在 action 成功并完全运行后触发。
    // 它等待着任何返回的 promise
    after((result) => {
      console.log(
        `Finished "${name}" after ${Date.now() - startTime}ms.\nResult: ${result}.`
      )
    })

    // 如果 action 抛出或返回一个拒绝的 promise，这将触发
    onError((error) => {
      console.warn(
        `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
      )
    })
  }
)

// 手动删除监听器
unsubscribe()
```

默认情况下，*action 订阅器*会被绑定到添加它们的组件上(如果 store 在组件的 `setup()` 内)。这意味着，当该组件被卸载时，它们将被自动删除。如果你想在组件卸载后依旧保留它们，请将 `{ detached: true }` 作为第二个参数，以将 *action 订阅器*从当前组件中*分离*：

```vue
<script setup>
const someStore = useSomeStore()

// 此订阅器即便在组件卸载之后仍会被保留
someStore.$onAction(callback, { detached: true })
</script>
```

## 错误处理

Action 可以通过多种方式处理错误：

### 在 Action 中使用 Try/Catch

```js
export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials) {
      try {
        const response = await api.login(credentials)
        this.user = response.user
        this.token = response.token
        return { success: true }
      } catch (error) {
        console.error('Login failed:', error)
        return { success: false, error: error.message }
      }
    },
  },
})
```

### 组件级错误处理

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const handleLogin = async () => {
  try {
    await authStore.login(credentials)
    // 处理成功
  } catch (error) {
    // 处理错误
    console.error('Login error:', error)
  }
}
</script>
```

## 最佳实践

### 尽可能保持 Action 纯净

虽然 action 可以有副作用，但尽量保持它们的可预测性：

```js
// ✅ 好：清晰、可预测的 action
actions: {
  updateUser(userData) {
    this.user = { ...this.user, ...userData }
  },
}

// ❌ 避免：隐藏的副作用
actions: {
  updateUser(userData) {
    this.user = { ...this.user, ...userData }
    // 隐藏的副作用 - 难以测试和调试
    localStorage.setItem('user', JSON.stringify(this.user))
    analytics.track('user_updated')
  },
}
```

### 使用描述性的 Action 名称

```js
// ✅ 好：描述性名称
actions: {
  fetchUserProfile() { /* ... */ },
  updateUserEmail(email) { /* ... */ },
  deleteUserAccount() { /* ... */ },
}

// ❌ 避免：通用名称
actions: {
  get() { /* ... */ },
  update(data) { /* ... */ },
  remove() { /* ... */ },
}
```

### 处理加载状态

```js
export const useDataStore = defineStore('data', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchItems() {
      this.loading = true
      this.error = null
      
      try {
        this.items = await api.getItems()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
  },
})
```

## 下一步

现在你了解了 actions，接下来学习：

- [插件系统](./plugins) - 扩展 store 功能
- [测试](./testing) - 测试你的 stores 和 actions
- [服务端渲染](./ssr) - 在 SSR 环境中使用 Pinia