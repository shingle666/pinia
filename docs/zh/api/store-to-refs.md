---
title: storeToRefs() - Pinia API
description: storeToRefs 函数的完整 API 参考。了解如何从 Pinia store 中提取响应式 refs。
keywords: Pinia, Vue.js, storeToRefs, 响应式 refs, API 参考, 解构
author: Pinia 团队
generator: VitePress
og:title: storeToRefs() - Pinia API
og:description: storeToRefs 函数的完整 API 参考。了解如何从 Pinia store 中提取响应式 refs。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/store-to-refs
twitter:card: summary_large_image
twitter:title: storeToRefs() - Pinia API
twitter:description: storeToRefs 函数的完整 API 参考。了解如何从 Pinia store 中提取响应式 refs。
twitter:image: /og-image.svg
---

# storeToRefs()

从 store 中提取 refs，使状态和 getters 在解构时保持响应性。

## 签名

```ts
function storeToRefs<T extends StoreGeneric>(
  store: T
): StoreToRefs<T>
```

## 参数

- **store**: 要提取 refs 的 store 实例

## 返回值

包含所有状态属性和 getters 的响应式 refs 的对象。Actions 被排除，因为它们不需要响应性。

## 为什么需要 storeToRefs？

当你直接解构 store 时，会失去响应性：

```js
// ❌ 这会破坏响应性
const { count, doubleCount } = store

// ✅ 这会保持响应性
const { count, doubleCount } = storeToRefs(store)
```

## 基本用法

### Composition API

```vue
<template>
  <div>
    <p>计数: {{ count }}</p>
    <p>双倍: {{ doubleCount }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// 为状态和 getters 提取响应式 refs
const { count, doubleCount } = storeToRefs(store)

// Actions 可以直接解构（它们不需要响应性）
const { increment, decrement } = store
</script>
```

### Options API

```js
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  setup() {
    const store = useCounterStore()
    const { count, doubleCount } = storeToRefs(store)
    
    return {
      count,
      doubleCount,
      increment: store.increment,
      decrement: store.decrement
    }
  }
}
```

## 提取的内容

### 状态属性

所有状态属性都变成响应式 refs：

```js
const store = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter',
    items: []
  })
})

const { count, name, items } = storeToRefs(useCounterStore())
// count: Ref<number>
// name: Ref<string>
// items: Ref<any[]>
```

### Getters

所有 getters 都变成计算属性 refs：

```js
const store = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  }
})

const { doubleCount, isEven } = storeToRefs(useCounterStore())
// doubleCount: ComputedRef<number>
// isEven: ComputedRef<boolean>
```

### Actions 被排除

Actions 不包含在返回的对象中，因为它们不需要响应性：

```js
const store = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  }
})

const refs = storeToRefs(useCounterStore())
// refs.increment 是 undefined

// 直接从 store 获取 actions
const { increment } = useCounterStore()
```

## 高级用法

### 选择性提取

```js
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()

// 只提取你需要的
const { name, email } = storeToRefs(store)
const { updateProfile, logout } = store
```

### 提取时重命名

```js
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const storeRefs = storeToRefs(store)

// 解构时重命名
const {
  name: userName,
  email: userEmail
} = storeRefs
```

### 多个 Store

```js
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const userStore = useUserStore()
const cartStore = useCartStore()

// 从多个 store 提取
const { name, email } = storeToRefs(userStore)
const { items, total } = storeToRefs(cartStore)

// 获取 actions
const { login, logout } = userStore
const { addItem, removeItem } = cartStore
```

### 计算属性

```js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, email } = storeToRefs(store)

// 基于 store refs 创建计算属性
const displayName = computed(() => {
  return name.value || email.value || '匿名'
})

const isLoggedIn = computed(() => {
  return !!name.value && !!email.value
})
```

### 监听器

```js
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, email } = storeToRefs(store)

// 监听单个 ref
watch(name, (newName, oldName) => {
  console.log(`名称从 ${oldName} 变为 ${newName}`)
})

// 监听多个 refs
watch([name, email], ([newName, newEmail], [oldName, oldEmail]) => {
  console.log('用户信息变化:', { newName, newEmail })
})
```

## TypeScript

### 类型推断

```ts
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
const { count, doubleCount } = storeToRefs(store)

// TypeScript 自动推断:
// count: Ref<number>
// doubleCount: ComputedRef<number>
```

### 显式类型

```ts
import type { Ref, ComputedRef } from 'vue'
import type { StoreToRefs } from 'pinia'
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

type CounterStore = ReturnType<typeof useCounterStore>
type CounterRefs = StoreToRefs<CounterStore>

const store = useCounterStore()
const refs: CounterRefs = storeToRefs(store)

// 或提取特定类型
const count: Ref<number> = refs.count
const doubleCount: ComputedRef<number> = refs.doubleCount
```

### 通用辅助器

```ts
function useStoreRefs<T extends StoreGeneric>(useStore: () => T) {
  const store = useStore()
  const refs = storeToRefs(store)
  
  return {
    store,
    refs,
    ...refs
  }
}

// 用法
const { store, refs, count, doubleCount } = useStoreRefs(useCounterStore)
```

## 常见模式

### 表单绑定

```vue
<template>
  <form @submit.prevent="saveUser">
    <input v-model="name" placeholder="姓名" />
    <input v-model="email" placeholder="邮箱" />
    <button type="submit">保存</button>
  </form>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { name, email } = storeToRefs(store)
const { saveUser } = store
</script>
```

### 条件渲染

```vue
<template>
  <div>
    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else>
      <h1>{{ title }}</h1>
      <p>{{ content }}</p>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useContentStore } from '@/stores/content'

const store = useContentStore()
const { isLoading, error, title, content } = storeToRefs(store)
</script>
```

### 列表渲染

```vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }} - {{ item.price }}
      <button @click="removeItem(item.id)">移除</button>
    </li>
  </ul>
  <p>总计: {{ total }}</p>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const store = useCartStore()
const { items, total } = storeToRefs(store)
const { removeItem } = store
</script>
```

## 性能考虑

### 懒提取

```js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useExpensiveStore } from '@/stores/expensive'

// 只在需要时提取
const expensiveRefs = computed(() => {
  const store = useExpensiveStore()
  return storeToRefs(store)
})

// 需要时访问
const expensiveData = computed(() => expensiveRefs.value.data)
```

### 选择性提取

```js
import { storeToRefs } from 'pinia'
import { useLargeStore } from '@/stores/large'

// 如果只需要几个属性，不要提取所有内容
const store = useLargeStore()
const allRefs = storeToRefs(store) // ❌ 提取所有内容

// 更好：只提取需要的
const { specificProp } = storeToRefs(store) // ✅ 更高效
```

## 最佳实践

### 1. 提取状态和 Getters，不是 Actions

```js
// ✅ 好
const { count, doubleCount } = storeToRefs(store)
const { increment, decrement } = store

// ❌ 避免 - actions 不需要响应性
const { count, doubleCount, increment } = storeToRefs(store) // increment 是 undefined
```

### 2. 使用描述性名称

```js
// ✅ 好 - 清楚数据来自哪个 store
const { name: userName, email: userEmail } = storeToRefs(userStore)
const { items: cartItems, total: cartTotal } = storeToRefs(cartStore)

// ❌ 令人困惑 - 来源不明
const { name, email } = storeToRefs(userStore)
const { name: itemName } = storeToRefs(productStore) // 名称冲突
```

### 3. 在 Setup 早期提取

```js
// ✅ 好 - 在 setup 顶部提取
const store = useMyStore()
const { data, isLoading } = storeToRefs(store)
const { fetchData } = store

// 然后在计算属性、监听器等中使用
const processedData = computed(() => {
  return data.value?.map(item => ({ ...item, processed: true }))
})
```

### 4. 与其他组合式函数结合

```js
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

function useUserProfile() {
  const router = useRouter()
  const store = useUserStore()
  const { user, isLoading } = storeToRefs(store)
  const { fetchUser, updateUser } = store
  
  const navigateToProfile = () => {
    router.push('/profile')
  }
  
  return {
    user,
    isLoading,
    fetchUser,
    updateUser,
    navigateToProfile
  }
}
```

## 故障排除

### 失去响应性

```js
// ❌ 问题：直接解构失去响应性
const { count } = useCounterStore()

// ✅ 解决方案：使用 storeToRefs
const { count } = storeToRefs(useCounterStore())
```

### Actions 未定义

```js
// ❌ 问题：Actions 不在 storeToRefs 结果中
const { increment } = storeToRefs(store) // increment 是 undefined

// ✅ 解决方案：直接从 store 获取 actions
const { increment } = store
```

### TypeScript 错误

```ts
// ❌ 问题：错误提取导致类型错误
const store = useMyStore()
const { nonExistentProp } = storeToRefs(store) // TypeScript 错误

// ✅ 解决方案：只提取存在的属性
const { existingProp } = storeToRefs(store)
```

## 另请参阅

- [Store 实例](./store-instance) - Store 实例 API
- [工具函数](./utilities) - 其他工具函数
- [Composition API 指南](../guide/composition-stores) - 在 Composition API 中使用 store
- [状态指南](../guide/state) - 使用状态