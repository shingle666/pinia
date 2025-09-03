---
title: 状态序列化
description: Pinia 状态序列化和反序列化的 API 参考，包括 SSR 支持、状态持久化和数据传输。
head:
  - [meta, { name: description, content: "Pinia 状态序列化和反序列化的 API 参考，包括 SSR 支持、状态持久化和数据传输。" }]
  - [meta, { name: keywords, content: "Pinia 序列化, 状态持久化, SSR, 数据传输" }]
  - [meta, { property: "og:title", content: "状态序列化 - Pinia API" }]
  - [meta, { property: "og:description", content: "Pinia 状态序列化和反序列化的 API 参考，包括 SSR 支持、状态持久化和数据传输。" }]
---

# 状态序列化

本页面提供了 Pinia 状态序列化和反序列化功能的完整 API 参考。

## 核心序列化 API

### `$serialize()`

将 store 状态序列化为可传输的格式。

```ts
interface Store {
  $serialize(): SerializedState
}

type SerializedState = Record<string, any>
```

**示例：**

```ts
const useUserStore = defineStore('user', () => {
  const name = ref('John')
  const age = ref(30)
  const preferences = ref({ theme: 'dark' })
  
  return { name, age, preferences }
})

const store = useUserStore()

// 序列化整个 store 状态
const serialized = store.$serialize()
console.log(serialized)
// { name: 'John', age: 30, preferences: { theme: 'dark' } }
```

### `$hydrate()`

从序列化状态恢复 store 状态。

```ts
interface Store {
  $hydrate(state: SerializedState): void
}
```

**示例：**

```ts
const store = useUserStore()
const serializedState = {
  name: 'Jane',
  age: 25,
  preferences: { theme: 'light' }
}

// 恢复状态
store.$hydrate(serializedState)
console.log(store.name) // 'Jane'
```

### `$state`

直接访问和设置 store 的原始状态。

```ts
interface Store {
  $state: StateTree
}

type StateTree = Record<string | number | symbol, any>
```

**示例：**

```ts
const store = useUserStore()

// 获取当前状态
const currentState = store.$state

// 替换整个状态
store.$state = {
  name: 'Bob',
  age: 35,
  preferences: { theme: 'auto' }
}
```

## SSR 序列化

### `getActivePinia().state.value`

获取所有 store 的序列化状态。

```ts
function getSerializedState(): Record<string, StateTree> {
  const pinia = getActivePinia()
  return pinia?.state.value || {}
}
```

**服务端示例：**

```ts
// server.js
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'

export async function render(url: string) {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  
  // 渲染应用
  const html = await renderToString(app)
  
  // 序列化状态
  const state = JSON.stringify(pinia.state.value)
  
  return {
    html,
    state
  }
}
```

**客户端示例：**

```ts
// client.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

// 从服务端状态恢复
if (window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.use(pinia)
app.mount('#app')
```

### `createPinia()` 选项

配置 Pinia 实例的序列化行为。

```ts
interface PiniaOptions {
  /**
   * 自定义状态序列化器
   */
  serializer?: {
    serialize: (value: StateTree) => string
    deserialize: (value: string) => StateTree
  }
}
```

**示例：**

```ts
import { createPinia } from 'pinia'

const pinia = createPinia({
  serializer: {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  }
})
```

## 自定义序列化

### Store 级别序列化

为特定 store 自定义序列化逻辑。

```ts
const useUserStore = defineStore('user', () => {
  const name = ref('')
  const sensitiveData = ref('')
  const computedValue = computed(() => name.value.toUpperCase())
  
  // 自定义序列化：排除敏感数据和计算属性
  const $serialize = () => {
    return {
      name: name.value
      // 不包含 sensitiveData 和 computedValue
    }
  }
  
  // 自定义反序列化
  const $hydrate = (state: any) => {
    if (state.name !== undefined) {
      name.value = state.name
    }
  }
  
  return {
    name,
    sensitiveData,
    computedValue,
    $serialize,
    $hydrate
  }
})
```

### 类型安全序列化

使用 TypeScript 确保序列化类型安全。

```ts
interface UserState {
  name: string
  age: number
  preferences: {
    theme: 'light' | 'dark'
    language: string
  }
}

interface SerializedUserState {
  name: string
  age: number
  preferences: string // JSON 字符串
}

const useUserStore = defineStore('user', (): UserState & {
  $serialize(): SerializedUserState
  $hydrate(state: SerializedUserState): void
} => {
  const name = ref('')
  const age = ref(0)
  const preferences = ref({ theme: 'light' as const, language: 'en' })
  
  const $serialize = (): SerializedUserState => {
    return {
      name: name.value,
      age: age.value,
      preferences: JSON.stringify(preferences.value)
    }
  }
  
  const $hydrate = (state: SerializedUserState) => {
    name.value = state.name
    age.value = state.age
    preferences.value = JSON.parse(state.preferences)
  }
  
  return {
    name,
    age,
    preferences,
    $serialize,
    $hydrate
  }
})
```

## 持久化插件

### 基础持久化插件

创建自动持久化 store 状态的插件。

```ts
import type { PiniaPluginContext } from 'pinia'

interface PersistOptions {
  key?: string
  storage?: Storage
  paths?: string[]
  serializer?: {
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
}

function createPersistedState(options: PersistOptions = {}) {
  return (context: PiniaPluginContext) => {
    const { store, options: storeOptions } = context
    
    const {
      key = store.$id,
      storage = localStorage,
      paths,
      serializer = {
        serialize: JSON.stringify,
        deserialize: JSON.parse
      }
    } = options
    
    // 从存储恢复状态
    const savedState = storage.getItem(key)
    if (savedState) {
      try {
        const parsed = serializer.deserialize(savedState)
        store.$patch(parsed)
      } catch (error) {
        console.error('Failed to restore state:', error)
      }
    }
    
    // 监听状态变化并保存
    store.$subscribe((mutation, state) => {
      try {
        const toSave = paths
          ? paths.reduce((acc, path) => {
              acc[path] = state[path]
              return acc
            }, {} as any)
          : state
        
        storage.setItem(key, serializer.serialize(toSave))
      } catch (error) {
        console.error('Failed to persist state:', error)
      }
    })
  }
}

// 使用插件
const pinia = createPinia()
pinia.use(createPersistedState({
  storage: sessionStorage,
  serializer: {
    serialize: (value) => btoa(JSON.stringify(value)),
    deserialize: (value) => JSON.parse(atob(value))
  }
}))
```

### 选择性持久化

只持久化特定的 store 或状态。

```ts
const useUserStore = defineStore('user', () => {
  const name = ref('')
  const temporaryData = ref('')
  const preferences = ref({})
  
  return {
    name,
    temporaryData,
    preferences
  }
}, {
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['name', 'preferences'] // 只持久化这些字段
  }
})
```

## 数据传输序列化

### API 数据序列化

为 API 传输准备数据。

```ts
const useApiStore = defineStore('api', () => {
  const data = ref([])
  const metadata = ref({})
  
  // 为 API 传输序列化数据
  const serializeForApi = () => {
    return {
      data: data.value.map(item => ({
        id: item.id,
        name: item.name,
        // 排除客户端特定字段
        // 不包含 _internal, _computed 等
      })),
      metadata: {
        timestamp: Date.now(),
        version: metadata.value.version
      }
    }
  }
  
  // 从 API 响应反序列化
  const deserializeFromApi = (response: any) => {
    data.value = response.data.map((item: any) => ({
      ...item,
      _internal: generateInternalData(item)
    }))
    metadata.value = response.metadata
  }
  
  return {
    data,
    metadata,
    serializeForApi,
    deserializeFromApi
  }
})
```

### WebSocket 序列化

为 WebSocket 通信序列化状态。

```ts
const useRealtimeStore = defineStore('realtime', () => {
  const state = ref({})
  const socket = ref<WebSocket | null>(null)
  
  // 发送状态更新
  const sendStateUpdate = (partialState: any) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'state_update',
        payload: JSON.stringify(partialState),
        timestamp: Date.now()
      }
      socket.value.send(JSON.stringify(message))
    }
  }
  
  // 接收状态更新
  const handleStateUpdate = (message: string) => {
    try {
      const parsed = JSON.parse(message)
      if (parsed.type === 'state_update') {
        const newState = JSON.parse(parsed.payload)
        state.value = { ...state.value, ...newState }
      }
    } catch (error) {
      console.error('Failed to handle state update:', error)
    }
  }
  
  return {
    state,
    sendStateUpdate,
    handleStateUpdate
  }
})
```

## 高级序列化模式

### 增量序列化

只序列化变化的状态部分。

```ts
const useIncrementalStore = defineStore('incremental', () => {
  const state = ref({})
  const lastSnapshot = ref({})
  
  // 获取增量变化
  const getStateDiff = () => {
    const diff: any = {}
    
    for (const key in state.value) {
      if (state.value[key] !== lastSnapshot.value[key]) {
        diff[key] = state.value[key]
      }
    }
    
    return diff
  }
  
  // 应用增量变化
  const applyStateDiff = (diff: any) => {
    for (const key in diff) {
      state.value[key] = diff[key]
    }
    updateSnapshot()
  }
  
  // 更新快照
  const updateSnapshot = () => {
    lastSnapshot.value = JSON.parse(JSON.stringify(state.value))
  }
  
  return {
    state,
    getStateDiff,
    applyStateDiff,
    updateSnapshot
  }
})
```

### 压缩序列化

压缩大型状态以减少传输大小。

```ts
import { compress, decompress } from 'lz-string'

const useCompressedStore = defineStore('compressed', () => {
  const largeData = ref([])
  
  // 压缩序列化
  const serializeCompressed = () => {
    const json = JSON.stringify(largeData.value)
    return compress(json)
  }
  
  // 解压反序列化
  const deserializeCompressed = (compressed: string) => {
    try {
      const json = decompress(compressed)
      if (json) {
        largeData.value = JSON.parse(json)
      }
    } catch (error) {
      console.error('Failed to decompress state:', error)
    }
  }
  
  return {
    largeData,
    serializeCompressed,
    deserializeCompressed
  }
})
```

## 错误处理

### 序列化错误处理

处理序列化过程中的错误。

```ts
const useSafeSerializationStore = defineStore('safeSerialize', () => {
  const state = ref({})
  
  const safeSerialize = () => {
    try {
      return JSON.stringify(state.value, (key, value) => {
        // 处理循环引用
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]'
          }
          seen.add(value)
        }
        
        // 处理函数
        if (typeof value === 'function') {
          return '[Function]'
        }
        
        // 处理 undefined
        if (value === undefined) {
          return '[Undefined]'
        }
        
        return value
      })
    } catch (error) {
      console.error('Serialization failed:', error)
      return '{}'
    }
  }
  
  const safeDeserialize = (json: string) => {
    try {
      return JSON.parse(json)
    } catch (error) {
      console.error('Deserialization failed:', error)
      return {}
    }
  }
  
  return {
    state,
    safeSerialize,
    safeDeserialize
  }
})
```

## 性能优化

### 延迟序列化

延迟序列化以提高性能。

```ts
import { debounce } from 'lodash-es'

const useDeferredSerializationStore = defineStore('deferredSerialize', () => {
  const state = ref({})
  const serializedCache = ref('')
  const isDirty = ref(false)
  
  // 延迟序列化
  const deferredSerialize = debounce(() => {
    if (isDirty.value) {
      serializedCache.value = JSON.stringify(state.value)
      isDirty.value = false
    }
  }, 1000)
  
  // 标记为脏数据
  const markDirty = () => {
    isDirty.value = true
    deferredSerialize()
  }
  
  // 监听状态变化
  watch(state, markDirty, { deep: true })
  
  return {
    state,
    serializedCache,
    markDirty
  }
})
```

## 测试

### 序列化测试

测试状态序列化和反序列化。

```ts
// serialization.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('状态序列化', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('应该正确序列化 store 状态', () => {
    const store = useUserStore()
    store.name = 'John'
    store.age = 30
    
    const serialized = store.$serialize()
    
    expect(serialized).toEqual({
      name: 'John',
      age: 30
    })
  })
  
  it('应该正确反序列化状态', () => {
    const store = useUserStore()
    const state = {
      name: 'Jane',
      age: 25
    }
    
    store.$hydrate(state)
    
    expect(store.name).toBe('Jane')
    expect(store.age).toBe(25)
  })
  
  it('应该处理序列化错误', () => {
    const store = useUserStore()
    
    // 创建循环引用
    const circular: any = { name: 'test' }
    circular.self = circular
    
    expect(() => {
      JSON.stringify(circular)
    }).toThrow()
    
    // 使用安全序列化
    const safe = store.safeSerialize()
    expect(safe).toBeDefined()
  })
})
```

## 最佳实践

### 序列化指南

1. **选择性序列化**：只序列化必要的状态
2. **类型安全**：使用 TypeScript 确保序列化类型安全
3. **错误处理**：始终处理序列化/反序列化错误
4. **性能优化**：对大型状态使用延迟或增量序列化
5. **安全性**：不序列化敏感数据
6. **版本控制**：为序列化数据添加版本信息

### 常见陷阱

- ❌ 序列化函数和计算属性
- ❌ 忽略循环引用
- ❌ 序列化敏感数据
- ❌ 不处理序列化错误
- ❌ 序列化过大的状态

## 相关链接

- [SSR 指南](./ssr.md)
- [插件开发](../cookbook/plugin-development.md)
- [性能优化](../guide/performance.md)
- [测试指南](../guide/testing.md)