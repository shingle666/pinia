---
title: 在 Options API 中使用 Pinia
description: 学习如何在 Vue 的 Options API 中使用 Pinia 状态管理，包括 mapState、mapActions 和其他辅助函数。
head:
  - [meta, { name: description, content: "完整指南：在 Vue 的 Options API 中使用 Pinia。学习 mapState、mapActions、mapWritableState 和 mapStores 辅助函数。" }]
  - [meta, { name: keywords, content: "Pinia, Options API, Vue, mapState, mapActions, mapWritableState, mapStores" }]
  - [meta, { property: "og:title", content: "在 Options API 中使用 Pinia" }]
  - [meta, { property: "og:description", content: "完整指南：在 Vue 的 Options API 中使用 Pinia。学习 mapState、mapActions、mapWritableState 和 mapStores 辅助函数。" }]
---

# 在 Options API 中使用 Pinia

虽然 Pinia 是为 Composition API 设计的，但它也通过一系列辅助函数为 Options API 提供了出色的支持。本指南介绍如何在 Vue 的 Options API 中有效使用 Pinia 状态管理。

## 概述

Pinia 提供了几个辅助函数来将状态管理集成到 Options API 中：

- `mapState()` - 将 store 状态映射到计算属性
- `mapWritableState()` - 将 store 状态映射到可写计算属性
- `mapActions()` - 将 store 动作映射到组件方法
- `mapStores()` - 将整个 store 映射到组件属性

## 基础 Store 设置

首先，让我们定义一个基础的 store：

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  },
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    setCount(value) {
      this.count = value
    }
  }
})
```

## 使用 mapState

`mapState()` 辅助函数将 store 状态和 getters 映射到计算属性：

```vue
<template>
  <div>
    <p>计数: {{ count }}</p>
    <p>双倍计数: {{ doubleCount }}</p>
    <p>是偶数: {{ isEven }}</p>
    <p>Store 名称: {{ name }}</p>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // 映射状态和 getters
    ...mapState(useCounterStore, ['count', 'doubleCount', 'isEven', 'name'])
  }
}
</script>
```

### 自定义属性名

你也可以映射到自定义属性名：

```js
export default {
  computed: {
    ...mapState(useCounterStore, {
      myCount: 'count',
      myName: 'name',
      double: 'doubleCount'
    })
  }
}
```

## 使用 mapWritableState

对于需要可写的状态，使用 `mapWritableState()`：

```vue
<template>
  <div>
    <input v-model="count" type="number" />
    <input v-model="name" type="text" />
  </div>
</template>

<script>
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // 这些创建可写的计算属性
    ...mapWritableState(useCounterStore, ['count', 'name'])
  }
}
</script>
```

::: warning 注意
`mapWritableState()` 不能用于 getters，因为它们是只读的。
:::

## 使用 mapActions

`mapActions()` 辅助函数将 store 动作映射到组件方法：

```vue
<template>
  <div>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="setCount(10)">设置为 10</button>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  methods: {
    ...mapActions(useCounterStore, ['increment', 'decrement', 'setCount'])
  }
}
</script>
```

### 自定义方法名

```js
export default {
  methods: {
    ...mapActions(useCounterStore, {
      add: 'increment',
      subtract: 'decrement',
      updateCount: 'setCount'
    })
  }
}
```

## 使用 mapStores

`mapStores()` 辅助函数让你访问整个 store：

```vue
<template>
  <div>
    <p>计数: {{ counterStore.count }}</p>
    <button @click="counterStore.increment()">增加</button>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    ...mapStores(useCounterStore, useUserStore)
    // 创建 counterStore 和 userStore 属性
  }
}
</script>
```

## 组合多个辅助函数

你可以在同一个组件中组合多个辅助函数：

```vue
<template>
  <div>
    <!-- 只读状态 -->
    <p>计数: {{ count }}</p>
    <p>双倍: {{ doubleCount }}</p>
    
    <!-- 可写状态 -->
    <input v-model="name" />
    
    <!-- 动作 -->
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    
    <!-- 直接 store 访问 -->
    <button @click="counterStore.setCount(0)">重置</button>
  </div>
</template>

<script>
import { mapState, mapWritableState, mapActions, mapStores } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount']),
    ...mapWritableState(useCounterStore, ['name']),
    ...mapStores(useCounterStore)
  },
  methods: {
    ...mapActions(useCounterStore, ['increment', 'decrement'])
  }
}
</script>
```

## 使用多个 Store

```vue
<script>
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    ...mapState(useUserStore, ['user', 'isLoggedIn']),
    ...mapState(useCartStore, ['items', 'total'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment']),
    ...mapActions(useUserStore, ['login', 'logout']),
    ...mapActions(useCartStore, ['addItem', 'removeItem'])
  }
}
</script>
```

## 高级模式

### 条件映射

你可以有条件地映射属性：

```js
export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    // 有条件地映射用户 store
    ...(this.showUserInfo ? mapState(useUserStore, ['user']) : {})
  }
}
```

### 自定义计算属性

将映射状态与自定义计算属性结合：

```js
export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    
    // 使用映射状态的自定义计算属性
    countMessage() {
      return `当前计数是 ${this.count}`
    },
    
    // 结合多个 store 的计算属性
    summary() {
      return {
        count: this.count,
        user: this.user,
        timestamp: Date.now()
      }
    }
  }
}
```

### 方法组合

将映射动作与自定义方法结合：

```js
export default {
  methods: {
    ...mapActions(useCounterStore, ['increment', 'setCount']),
    
    // 使用映射动作的自定义方法
    incrementBy(amount) {
      for (let i = 0; i < amount; i++) {
        this.increment()
      }
    },
    
    // 带验证的方法
    safeSetCount(value) {
      if (value >= 0 && value <= 100) {
        this.setCount(value)
      }
    }
  }
}
```

## TypeScript 支持

Pinia 的 Options API 辅助函数与 TypeScript 配合良好：

```ts
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default defineComponent({
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment', 'decrement'])
  }
})
```

## 最佳实践

### 1. 组织导入

```js
// 将 Pinia 导入分组
import { mapState, mapWritableState, mapActions, mapStores } from 'pinia'

// 将 store 导入分组
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'
```

### 2. 使用描述性名称

```js
export default {
  computed: {
    // 使用描述性名称以提高清晰度
    ...mapState(useCounterStore, {
      currentCount: 'count',
      counterName: 'name'
    })
  }
}
```

### 3. 分组相关映射

```js
export default {
  computed: {
    // Counter store 映射
    ...mapState(useCounterStore, ['count', 'doubleCount']),
    
    // User store 映射
    ...mapState(useUserStore, ['user', 'isLoggedIn'])
  },
  methods: {
    // Counter 动作
    ...mapActions(useCounterStore, ['increment', 'decrement']),
    
    // User 动作
    ...mapActions(useUserStore, ['login', 'logout'])
  }
}
```

### 4. 避免过度使用 mapStores

谨慎使用 `mapStores`，优先使用特定映射：

```js
// 推荐：特定映射
export default {
  computed: {
    ...mapState(useCounterStore, ['count']),
    ...mapActions(useCounterStore, ['increment'])
  }
}

// 仅在需要完整 store 访问时使用 mapStores
export default {
  computed: {
    ...mapStores(useCounterStore)
  },
  methods: {
    complexOperation() {
      // 当你需要调用多个 store 方法时
      this.counterStore.increment()
      this.counterStore.setCount(this.counterStore.count * 2)
    }
  }
}
```

## 从 Vuex 迁移

如果你正在从 Vuex 迁移，映射很简单：

```js
// Vuex
export default {
  computed: {
    ...mapState(['count']),
    ...mapGetters(['doubleCount'])
  },
  methods: {
    ...mapActions(['increment'])
  }
}

// Pinia
export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    ...mapActions(useCounterStore, ['increment'])
  }
}
```

## 相关链接

- [API 参考：mapState](../api/map-state.md)
- [API 参考：mapWritableState](../api/map-writable-state.md)
- [API 参考：mapActions](../api/map-actions.md)
- [API 参考：mapStores](../api/map-stores.md)
- [Composition API 指南](./composition-stores.md)
- [从 Vuex 迁移](./migration-from-vuex.md)