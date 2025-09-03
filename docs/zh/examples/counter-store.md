---
title: 计数器 Store 示例
description: 一个简单的计数器示例，演示 Pinia 基本的状态管理、操作和计算属性。
head:
  - [meta, { name: description, content: "一个简单的计数器示例，演示 Pinia 基本的状态管理、操作和计算属性。" }]
  - [meta, { name: keywords, content: "Pinia 计数器示例, Vue 状态管理, 基础 store" }]
---

# 计数器 Store 示例

这个示例通过一个简单的计数器 store 演示了 Pinia 的基础知识。它涵盖了状态定义、操作、计算属性和组件集成。

## 概述

计数器示例是状态管理的 "Hello World"。它展示了如何：

- 定义具有响应式状态的 store
- 创建修改状态的操作
- 使用计算属性（getters）
- 将 store 与 Vue 组件集成
- 处理 Options API 和 Composition API 的使用

## 功能特性

- ✅ 基础状态管理
- ✅ 递增/递减操作
- ✅ 重置功能
- ✅ 计算属性（getters）
- ✅ 组件集成
- ✅ TypeScript 支持
- ✅ DevTools 集成

## Store 定义

### Composition API 风格

```ts
// stores/counter.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // 状态
  const count = ref(0)
  const name = ref('计数器')
  
  // 计算属性
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  const isPositive = computed(() => count.value > 0)
  
  // 操作
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  const incrementBy = (amount: number) => {
    count.value += amount
  }
  
  const reset = () => {
    count.value = 0
  }
  
  const setName = (newName: string) => {
    name.value = newName
  }
  
  return {
    // 状态
    count: readonly(count),
    name: readonly(name),
    
    // 计算属性
    doubleCount,
    isEven,
    isPositive,
    
    // 操作
    increment,
    decrement,
    incrementBy,
    reset,
    setName
  }
})
```

### Options API 风格

```ts
// stores/counter-options.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: '计数器'
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0,
    isPositive: (state) => state.count > 0
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    },
    
    incrementBy(amount: number) {
      this.count += amount
    },
    
    reset() {
      this.count = 0
    },
    
    setName(newName: string) {
      this.name = newName
    }
  }
})
```

## 组件使用

### Composition API 组件

```vue
<!-- components/CounterComposition.vue -->
<template>
  <div class="counter">
    <h2>{{ store.name }}</h2>
    
    <div class="counter-display">
      <span class="count">{{ store.count }}</span>
      <span class="double">双倍: {{ store.doubleCount }}</span>
    </div>
    
    <div class="counter-info">
      <span :class="{ active: store.isEven }">偶数</span>
      <span :class="{ active: store.isPositive }">正数</span>
    </div>
    
    <div class="counter-controls">
      <button @click="store.decrement">-</button>
      <button @click="store.increment">+</button>
      <button @click="store.incrementBy(5)">+5</button>
      <button @click="store.reset">重置</button>
    </div>
    
    <div class="name-input">
      <input 
        v-model="nameInput" 
        @keyup.enter="updateName"
        placeholder="输入计数器名称"
      >
      <button @click="updateName">更新名称</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCounterStore } from '../stores/counter'

const store = useCounterStore()
const nameInput = ref('')

const updateName = () => {
  if (nameInput.value.trim()) {
    store.setName(nameInput.value.trim())
    nameInput.value = ''
  }
}
</script>

<style scoped>
.counter {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.counter-display {
  margin: 1rem 0;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #3b82f6;
  display: block;
}

.double {
  font-size: 1.2rem;
  color: #6b7280;
  margin-top: 0.5rem;
  display: block;
}

.counter-info {
  margin: 1rem 0;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.counter-info span {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  transition: all 0.2s;
}

.counter-info span.active {
  background: #10b981;
  color: white;
}

.counter-controls {
  margin: 1rem 0;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.counter-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.counter-controls button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.name-input {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.name-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.name-input button {
  padding: 0.5rem 1rem;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
}
</style>
```

### Options API 组件

```vue
<!-- components/CounterOptions.vue -->
<template>
  <div class="counter">
    <h2>{{ name }}</h2>
    
    <div class="counter-display">
      <span class="count">{{ count }}</span>
      <span class="double">双倍: {{ doubleCount }}</span>
    </div>
    
    <div class="counter-info">
      <span :class="{ active: isEven }">偶数</span>
      <span :class="{ active: isPositive }">正数</span>
    </div>
    
    <div class="counter-controls">
      <button @click="decrement">-</button>
      <button @click="increment">+</button>
      <button @click="incrementBy(5)">+5</button>
      <button @click="reset">重置</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '../stores/counter'

export default defineComponent({
  name: 'CounterOptions',
  
  computed: {
    ...mapState(useCounterStore, [
      'count',
      'name',
      'doubleCount',
      'isEven',
      'isPositive'
    ])
  },
  
  methods: {
    ...mapActions(useCounterStore, [
      'increment',
      'decrement',
      'incrementBy',
      'reset'
    ])
  }
})
</script>
```

## 高级用法

### 使用监听器

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useCounterStore } from '../stores/counter'

const store = useCounterStore()

// 监听计数变化
watch(
  () => store.count,
  (newCount, oldCount) => {
    console.log(`计数从 ${oldCount} 变为 ${newCount}`)
    
    // 里程碑通知
    if (newCount % 10 === 0 && newCount !== 0) {
      alert(`达到里程碑: ${newCount}!`)
    }
  }
)

// 监听名称变化
watch(
  () => store.name,
  (newName) => {
    document.title = `${newName} - 计数器应用`
  },
  { immediate: true }
)
</script>
```

### 持久化存储

```ts
// stores/counter-persistent.ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // 从 localStorage 加载初始状态
  const savedCount = localStorage.getItem('counter-count')
  const savedName = localStorage.getItem('counter-name')
  
  const count = ref(savedCount ? parseInt(savedCount) : 0)
  const name = ref(savedName || '计数器')
  
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  const isPositive = computed(() => count.value > 0)
  
  const increment = () => {
    count.value++
    saveToStorage()
  }
  
  const decrement = () => {
    count.value--
    saveToStorage()
  }
  
  const incrementBy = (amount: number) => {
    count.value += amount
    saveToStorage()
  }
  
  const reset = () => {
    count.value = 0
    saveToStorage()
  }
  
  const setName = (newName: string) => {
    name.value = newName
    saveToStorage()
  }
  
  const saveToStorage = () => {
    localStorage.setItem('counter-count', count.value.toString())
    localStorage.setItem('counter-name', name.value)
  }
  
  return {
    count: readonly(count),
    name: readonly(name),
    doubleCount,
    isEven,
    isPositive,
    increment,
    decrement,
    incrementBy,
    reset,
    setName
  }
})
```

## 测试

### 单元测试

```ts
// tests/counter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../stores/counter'

describe('计数器 Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('使用默认值初始化', () => {
    const store = useCounterStore()
    
    expect(store.count).toBe(0)
    expect(store.name).toBe('计数器')
    expect(store.doubleCount).toBe(0)
    expect(store.isEven).toBe(true)
    expect(store.isPositive).toBe(false)
  })
  
  it('递增计数', () => {
    const store = useCounterStore()
    
    store.increment()
    expect(store.count).toBe(1)
    expect(store.doubleCount).toBe(2)
    expect(store.isEven).toBe(false)
    expect(store.isPositive).toBe(true)
  })
  
  it('递减计数', () => {
    const store = useCounterStore()
    
    store.decrement()
    expect(store.count).toBe(-1)
    expect(store.doubleCount).toBe(-2)
    expect(store.isEven).toBe(false)
    expect(store.isPositive).toBe(false)
  })
  
  it('按指定数量递增', () => {
    const store = useCounterStore()
    
    store.incrementBy(5)
    expect(store.count).toBe(5)
    expect(store.doubleCount).toBe(10)
  })
  
  it('重置计数', () => {
    const store = useCounterStore()
    
    store.incrementBy(10)
    store.reset()
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
  })
  
  it('更新名称', () => {
    const store = useCounterStore()
    
    store.setName('我的计数器')
    expect(store.name).toBe('我的计数器')
  })
})
```

### 组件测试

```ts
// tests/CounterComponent.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CounterComposition from '../components/CounterComposition.vue'
import { useCounterStore } from '../stores/counter'

describe('CounterComposition', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('渲染初始状态的计数器', () => {
    const wrapper = mount(CounterComposition)
    
    expect(wrapper.find('.count').text()).toBe('0')
    expect(wrapper.find('h2').text()).toBe('计数器')
    expect(wrapper.find('.double').text()).toBe('双倍: 0')
  })
  
  it('点击 + 按钮时递增', async () => {
    const wrapper = mount(CounterComposition)
    const store = useCounterStore()
    
    await wrapper.find('button:nth-child(2)').trigger('click')
    
    expect(store.count).toBe(1)
    expect(wrapper.find('.count').text()).toBe('1')
  })
  
  it('点击 - 按钮时递减', async () => {
    const wrapper = mount(CounterComposition)
    const store = useCounterStore()
    
    await wrapper.find('button:nth-child(1)').trigger('click')
    
    expect(store.count).toBe(-1)
    expect(wrapper.find('.count').text()).toBe('-1')
  })
  
  it('点击重置按钮时重置', async () => {
    const wrapper = mount(CounterComposition)
    const store = useCounterStore()
    
    // 先递增
    store.incrementBy(5)
    await wrapper.vm.$nextTick()
    
    // 然后重置
    await wrapper.find('button:nth-child(4)').trigger('click')
    
    expect(store.count).toBe(0)
    expect(wrapper.find('.count').text()).toBe('0')
  })
})
```

## 核心概念

### 1. 状态响应性
Pinia 使用 Vue 的响应性系统自动使状态变为响应式。状态的任何变化都会触发组件重新渲染。

### 2. 计算属性作为 Getters
Getters 是缓存的计算属性，当其依赖项发生变化时会自动更新。

### 3. 状态变更的操作
操作是可以修改状态的方法，可以是同步或异步的。

### 4. Store 组合
Store 可以在不同组件间组合和重用，无需属性传递。

### 5. TypeScript 集成
Pinia 提供出色的 TypeScript 支持，具有自动类型推断。

## 最佳实践

1. **使用描述性名称** 为 store、状态和操作命名
2. **保持操作简单** 专注于单一职责
3. **使用 getters** 处理计算值而不是在组件中计算
4. **优先使用只读状态** 暴露以防止直接变更
5. **独立测试 store** 与组件分离
6. **使用 TypeScript** 获得更好的开发体验

## 相关链接

- [定义 Store](../guide/defining-stores.md)
- [状态](../guide/state.md)
- [Getters](../guide/getters.md)
- [Actions](../guide/actions.md)
- [测试](../guide/testing.md)