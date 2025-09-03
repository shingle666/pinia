---
title: 服务端渲染 (SSR) API
description: Pinia 服务端渲染 API 参考，包括状态序列化、水合、SSR 上下文管理等功能。
head:
  - [meta, { name: description, content: "Pinia 服务端渲染 API 参考，包括状态序列化、水合、SSR 上下文管理等功能。" }]
  - [meta, { name: keywords, content: "Pinia SSR, 服务端渲染, 状态序列化, 水合, SSR API" }]
  - [meta, { property: "og:title", content: "服务端渲染 (SSR) API - Pinia" }]
  - [meta, { property: "og:description", content: "Pinia 服务端渲染 API 参考，包括状态序列化、水合、SSR 上下文管理等功能。" }]
---

# 服务端渲染 (SSR) API

Pinia 为服务端渲染提供了完整的 API 支持，包括状态序列化、水合、SSR 上下文管理等功能。

## 核心 SSR API

### `createPinia()`

在 SSR 环境中创建 Pinia 实例。

```ts
import { createPinia } from 'pinia'

// 服务端
const pinia = createPinia()

// 客户端
const pinia = createPinia()
```

**类型定义：**

```ts
function createPinia(): Pinia

interface Pinia {
  install(app: App): void
  use(plugin: PiniaPlugin): Pinia
  state: Ref<Record<string, StateTree>>
  _p: Pinia['_plugins']
  _a: App | null
  _e: EffectScope
  _s: Map<string, StoreGeneric>
  _plugins: PiniaPlugin[]
}
```

### `getActivePinia()`

获取当前活动的 Pinia 实例。

```ts
import { getActivePinia } from 'pinia'

// 在 SSR 上下文中获取 Pinia 实例
const pinia = getActivePinia()
```

**类型定义：**

```ts
function getActivePinia(): Pinia | undefined
```

### `setActivePinia()`

设置活动的 Pinia 实例。

```ts
import { setActivePinia } from 'pinia'

// 在 SSR 上下文中设置 Pinia 实例
setActivePinia(pinia)
```

**类型定义：**

```ts
function setActivePinia(pinia: Pinia | undefined): Pinia | undefined
```

## 状态序列化

### `pinia.state.value`

获取所有 store 的状态用于序列化。

```ts
// 服务端 - 序列化状态
const state = pinia.state.value
const serializedState = JSON.stringify(state)

// 发送到客户端
const html = `
  <script>
    window.__PINIA_STATE__ = ${serializedState}
  </script>
`
```

**类型定义：**

```ts
interface Pinia {
  state: Ref<Record<string, StateTree>>
}

type StateTree = Record<string | number | symbol, any>
```

### 自定义序列化

```ts
// utils/ssr-serializer.ts
export function serializePiniaState(pinia: Pinia): string {
  const state = pinia.state.value
  
  // 自定义序列化逻辑
  const serializedState = Object.entries(state).reduce((acc, [key, value]) => {
    // 处理特殊类型（Date、RegExp 等）
    acc[key] = serializeValue(value)
    return acc
  }, {} as Record<string, any>)
  
  return JSON.stringify(serializedState)
}

function serializeValue(value: any): any {
  if (value instanceof Date) {
    return { __type: 'Date', value: value.toISOString() }
  }
  
  if (value instanceof RegExp) {
    return { __type: 'RegExp', source: value.source, flags: value.flags }
  }
  
  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }
  
  if (value && typeof value === 'object') {
    const serialized: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      serialized[k] = serializeValue(v)
    }
    return serialized
  }
  
  return value
}
```

## 状态水合

### 基本水合

```ts
// 客户端 - 水合状态
if (typeof window !== 'undefined' && window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}
```

### 自定义水合

```ts
// utils/ssr-hydrator.ts
export function hydratePiniaState(pinia: Pinia, serializedState: string): void {
  try {
    const state = JSON.parse(serializedState)
    const hydratedState = deserializeState(state)
    pinia.state.value = hydratedState
  } catch (error) {
    console.error('Failed to hydrate Pinia state:', error)
  }
}

function deserializeState(state: Record<string, any>): Record<string, any> {
  const deserialized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(state)) {
    deserialized[key] = deserializeValue(value)
  }
  
  return deserialized
}

function deserializeValue(value: any): any {
  if (value && typeof value === 'object' && value.__type) {
    switch (value.__type) {
      case 'Date':
        return new Date(value.value)
      case 'RegExp':
        return new RegExp(value.source, value.flags)
    }
  }
  
  if (Array.isArray(value)) {
    return value.map(deserializeValue)
  }
  
  if (value && typeof value === 'object') {
    const deserialized: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      deserialized[k] = deserializeValue(v)
    }
    return deserialized
  }
  
  return value
}
```

## SSR 插件

### SSR 上下文插件

```ts
// plugins/ssr-context.ts
import type { PiniaPlugin } from 'pinia'

export interface SSRContext {
  req?: any
  res?: any
  url?: string
  [key: string]: any
}

export function createSSRContextPlugin(context: SSRContext): PiniaPlugin {
  return ({ store }) => {
    // 为每个 store 添加 SSR 上下文
    store.$ssrContext = context
    
    // 添加 SSR 相关方法
    store.$isServer = typeof window === 'undefined'
    store.$isClient = typeof window !== 'undefined'
    
    // 服务端专用方法
    if (store.$isServer) {
      store.$serverPrefetch = async () => {
        // 服务端预取逻辑
        if (typeof store.serverPrefetch === 'function') {
          await store.serverPrefetch(context)
        }
      }
    }
  }
}

// 扩展 store 类型
declare module 'pinia' {
  export interface Store {
    $ssrContext?: SSRContext
    $isServer: boolean
    $isClient: boolean
    $serverPrefetch?: () => Promise<void>
    serverPrefetch?: (context: SSRContext) => Promise<void>
  }
}
```

### 使用 SSR 插件

```ts
// 服务端
import { createSSRContextPlugin } from './plugins/ssr-context'

const ssrContext = {
  req,
  res,
  url: req.url
}

pinia.use(createSSRContextPlugin(ssrContext))
```

## Store SSR 方法

### `serverPrefetch`

在服务端预取数据的方法。

```ts
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  
  async function fetchUser(id: string) {
    loading.value = true
    try {
      const userData = await api.getUser(id)
      user.value = userData
    } finally {
      loading.value = false
    }
  }
  
  // SSR 预取方法
  async function serverPrefetch(context: SSRContext) {
    const userId = context.req?.params?.id
    if (userId) {
      await fetchUser(userId)
    }
  }
  
  return {
    user,
    loading,
    fetchUser,
    serverPrefetch
  }
})
```

### `$reset` 在 SSR 中的使用

```ts
// 在服务端渲染每个请求前重置 store
export function resetStoresForSSR(pinia: Pinia) {
  pinia._s.forEach(store => {
    if (typeof store.$reset === 'function') {
      store.$reset()
    }
  })
}
```

## 框架集成

### Nuxt.js 集成

```ts
// plugins/pinia.client.ts
import { createPinia } from 'pinia'

export default defineNuxtPlugin(({ $pinia }) => {
  // 客户端水合
  if (process.client && window.__PINIA_STATE__) {
    $pinia.state.value = window.__PINIA_STATE__
  }
})

// plugins/pinia.server.ts
export default defineNuxtPlugin(async (nuxtApp) => {
  const pinia = createPinia()
  nuxtApp.vueApp.use(pinia)
  
  // 服务端预取
  nuxtApp.hook('app:rendered', () => {
    // 序列化状态
    nuxtApp.ssrContext!.payload.pinia = pinia.state.value
  })
})
```

### Vite SSR 集成

```ts
// server.ts
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'

export async function render(url: string) {
  const app = createSSRApp(App)
  const pinia = createPinia()
  
  app.use(pinia)
  
  // 预取数据
  await prefetchStoreData(pinia, url)
  
  // 渲染应用
  const html = await renderToString(app)
  
  // 序列化状态
  const state = JSON.stringify(pinia.state.value)
  
  return {
    html,
    state
  }
}

async function prefetchStoreData(pinia: Pinia, url: string) {
  // 根据路由预取相关 store 数据
  const stores = Array.from(pinia._s.values())
  
  for (const store of stores) {
    if (typeof store.$serverPrefetch === 'function') {
      await store.$serverPrefetch()
    }
  }
}
```

### Next.js 集成

```ts
// pages/_app.tsx
import { createPinia } from 'pinia'
import type { AppProps } from 'next/app'

interface MyAppProps extends AppProps {
  piniaState?: any
}

function MyApp({ Component, pageProps, piniaState }: MyAppProps) {
  const pinia = createPinia()
  
  // 水合状态
  if (piniaState) {
    pinia.state.value = piniaState
  }
  
  return (
    <PiniaProvider pinia={pinia}>
      <Component {...pageProps} />
    </PiniaProvider>
  )
}

MyApp.getInitialProps = async (appContext) => {
  const pinia = createPinia()
  
  // 服务端预取
  if (appContext.ctx.req) {
    await prefetchData(pinia, appContext.ctx)
  }
  
  return {
    piniaState: pinia.state.value
  }
}
```

## 高级 SSR 模式

### 流式渲染

```ts
// utils/streaming-ssr.ts
import { renderToNodeStream } from 'vue/server-renderer'

export async function renderStream(app: App, pinia: Pinia) {
  // 开始流式渲染
  const stream = renderToNodeStream(app)
  
  // 在流结束时注入状态
  stream.on('end', () => {
    const state = JSON.stringify(pinia.state.value)
    stream.push(`
      <script>
        window.__PINIA_STATE__ = ${state}
      </script>
    `)
  })
  
  return stream
}
```

### 增量静态再生 (ISR)

```ts
// utils/isr-cache.ts
interface CacheEntry {
  html: string
  state: string
  timestamp: number
  ttl: number
}

class ISRCache {
  private cache = new Map<string, CacheEntry>()
  
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry
  }
  
  set(key: string, html: string, state: string, ttl: number = 60000) {
    this.cache.set(key, {
      html,
      state,
      timestamp: Date.now(),
      ttl
    })
  }
}

export const isrCache = new ISRCache()
```

## 性能优化

### 选择性水合

```ts
// utils/selective-hydration.ts
export function createSelectiveHydration(storeIds: string[]) {
  return {
    serialize(pinia: Pinia): string {
      const state: Record<string, any> = {}
      
      for (const storeId of storeIds) {
        if (pinia.state.value[storeId]) {
          state[storeId] = pinia.state.value[storeId]
        }
      }
      
      return JSON.stringify(state)
    },
    
    hydrate(pinia: Pinia, serializedState: string): void {
      const state = JSON.parse(serializedState)
      
      for (const [storeId, storeState] of Object.entries(state)) {
        if (storeIds.includes(storeId)) {
          pinia.state.value[storeId] = storeState
        }
      }
    }
  }
}

// 使用
const hydration = createSelectiveHydration(['user', 'cart'])

// 服务端
const state = hydration.serialize(pinia)

// 客户端
hydration.hydrate(pinia, state)
```

### 懒加载 Store

```ts
// utils/lazy-store-ssr.ts
export function createLazyStoreSSR<T>(
  storeFactory: () => T,
  shouldPrefetch: (context: SSRContext) => boolean = () => true
) {
  let store: T | null = null
  
  return {
    async getStore(context?: SSRContext): Promise<T> {
      if (store) return store
      
      // 服务端：根据条件决定是否预取
      if (typeof window === 'undefined' && context) {
        if (!shouldPrefetch(context)) {
          return null as any
        }
      }
      
      store = storeFactory()
      return store
    },
    
    reset() {
      store = null
    }
  }
}
```

## 调试和监控

### SSR 调试工具

```ts
// utils/ssr-debug.ts
export function createSSRDebugger(enabled: boolean = process.env.NODE_ENV === 'development') {
  if (!enabled) {
    return {
      logSerialization: () => {},
      logHydration: () => {},
      logPrefetch: () => {}
    }
  }
  
  return {
    logSerialization(pinia: Pinia) {
      console.log('[SSR] Serializing state:', {
        stores: Object.keys(pinia.state.value),
        stateSize: JSON.stringify(pinia.state.value).length
      })
    },
    
    logHydration(state: any) {
      console.log('[SSR] Hydrating state:', {
        stores: Object.keys(state),
        stateSize: JSON.stringify(state).length
      })
    },
    
    logPrefetch(storeId: string, duration: number) {
      console.log(`[SSR] Prefetched store "${storeId}" in ${duration}ms`)
    }
  }
}
```

### 性能监控

```ts
// plugins/ssr-performance.ts
export function createSSRPerformancePlugin(): PiniaPlugin {
  return ({ store }) => {
    if (typeof window === 'undefined') {
      // 服务端性能监控
      const originalServerPrefetch = store.serverPrefetch
      
      if (originalServerPrefetch) {
        store.serverPrefetch = async function(context: SSRContext) {
          const start = Date.now()
          
          try {
            await originalServerPrefetch.call(this, context)
          } finally {
            const duration = Date.now() - start
            console.log(`[SSR Performance] Store "${store.$id}" prefetch: ${duration}ms`)
          }
        }
      }
    }
  }
}
```

## 错误处理

### SSR 错误边界

```ts
// utils/ssr-error-boundary.ts
export function createSSRErrorBoundary() {
  return {
    async safeSerialize(pinia: Pinia): Promise<string> {
      try {
        return JSON.stringify(pinia.state.value)
      } catch (error) {
        console.error('[SSR] Serialization error:', error)
        return '{}'
      }
    },
    
    safeHydrate(pinia: Pinia, serializedState: string): void {
      try {
        const state = JSON.parse(serializedState)
        pinia.state.value = state
      } catch (error) {
        console.error('[SSR] Hydration error:', error)
        // 继续使用默认状态
      }
    },
    
    async safePrefetch(store: any, context: SSRContext): Promise<void> {
      try {
        if (typeof store.$serverPrefetch === 'function') {
          await store.$serverPrefetch()
        }
      } catch (error) {
        console.error(`[SSR] Prefetch error for store "${store.$id}":`, error)
        // 继续渲染，不阻塞其他 store
      }
    }
  }
}
```

## 最佳实践

### 1. 状态管理

```ts
// ✅ 好的做法
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  
  // 明确区分服务端和客户端逻辑
  async function fetchUser(id: string) {
    if (typeof window === 'undefined') {
      // 服务端逻辑
      user.value = await serverApi.getUser(id)
    } else {
      // 客户端逻辑
      user.value = await clientApi.getUser(id)
    }
  }
  
  return { user, fetchUser }
})
```

### 2. 数据预取

```ts
// ✅ 条件性预取
async function serverPrefetch(context: SSRContext) {
  // 只在需要时预取
  if (context.url.includes('/user/')) {
    const userId = extractUserIdFromUrl(context.url)
    await fetchUser(userId)
  }
}
```

### 3. 错误处理

```ts
// ✅ 优雅降级
async function serverPrefetch(context: SSRContext) {
  try {
    await fetchCriticalData()
  } catch (error) {
    // 记录错误但不阻塞渲染
    console.error('Failed to fetch critical data:', error)
  }
  
  try {
    await fetchOptionalData()
  } catch (error) {
    // 可选数据失败不影响页面渲染
    console.warn('Failed to fetch optional data:', error)
  }
}
```

## 常见问题

### Q: 如何处理客户端和服务端的 API 差异？

**A**: 使用环境检测和适配器模式：

```ts
const api = typeof window === 'undefined' ? serverApi : clientApi
```

### Q: 如何避免水合不匹配？

**A**: 确保服务端和客户端使用相同的数据和逻辑：

```ts
// 使用统一的数据格式化函数
const formattedData = formatData(rawData)
```

### Q: 如何优化 SSR 性能？

**A**: 
- 选择性预取数据
- 使用缓存策略
- 实现增量静态再生
- 优化序列化/反序列化

## 相关链接

- [SSR 指南](../guide/ssr.md)
- [Nuxt.js 集成](../integrations/nuxt.md)
- [性能优化](../guide/performance.md)
- [插件开发](../cookbook/plugin-development.md)