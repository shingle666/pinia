---
title: createPinia() - Pinia API
description: createPinia 函数的完整 API 参考。了解如何创建和配置 Pinia 实例。
keywords: Pinia, Vue.js, createPinia, API 参考, 配置
author: Pinia 团队
generator: VitePress
og:title: createPinia() - Pinia API
og:description: createPinia 函数的完整 API 参考。了解如何创建和配置 Pinia 实例。
og:image: /og-image.svg
og:url: https://allfun.net/zh/api/create-pinia
twitter:card: summary_large_image
twitter:title: createPinia() - Pinia API
twitter:description: createPinia 函数的完整 API 参考。了解如何创建和配置 Pinia 实例。
twitter:image: /og-image.svg
---

# createPinia()

创建一个可供应用程序使用的新 Pinia 实例。

## 签名

```ts
function createPinia(): Pinia
```

## 返回值

一个具有以下属性和方法的新 Pinia 实例：

- `install`: Vue 插件安装函数
- `use()`: 添加插件的方法
- `state`: 包含所有 store 状态的响应式对象
- 用于 store 管理的内部属性

## 基本用法

### Vue 3

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### Vue 2

```js
import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import App from './App.vue'

Vue.use(PiniaVuePlugin)

const pinia = createPinia()

new Vue({
  el: '#app',
  pinia,
  render: h => h(App)
})
```

## 配置

### 添加插件

可以添加插件来自定义 Pinia 行为：

```js
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const pinia = createPinia()

// 添加持久化插件
pinia.use(createPersistedState({
  storage: sessionStorage,
  key: id => `pinia-${id}`
}))

// 添加自定义插件
pinia.use(({ store }) => {
  store.$router = router
  store.$api = api
})
```

### 开发工具

```js
import { createPinia } from 'pinia'

const pinia = createPinia()

// 在开发环境启用开发工具
if (process.env.NODE_ENV === 'development') {
  pinia.use(({ store }) => {
    store._customProperties = new Set(['$router', '$api'])
  })
}
```

## 多个实例

你可以为应用程序的不同部分创建多个 Pinia 实例：

```js
import { createPinia } from 'pinia'

// 主应用程序 pinia
const mainPinia = createPinia()

// 具有不同插件的管理面板 pinia
const adminPinia = createPinia()
adminPinia.use(adminPlugin)

// 使用不同的实例
app.use(mainPinia)
adminApp.use(adminPinia)
```

## SSR（服务端渲染）

### 创建 SSR 兼容实例

```js
// server.js
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp({})
  const pinia = createPinia()
  
  app.use(pinia)
  
  return { app, pinia }
}
```

### 状态序列化

```js
// server.js
import { renderToString } from '@vue/server-renderer'

const { app, pinia } = createApp()

// 渲染应用
const html = await renderToString(app)

// 序列化状态
const state = JSON.stringify(pinia.state.value)

// 发送到客户端
const fullHtml = `
  <div id="app">${html}</div>
  <script>
    window.__PINIA_STATE__ = ${state}
  </script>
`
```

### 客户端水合

```js
// client.js
import { createApp } from './main'

const { app, pinia } = createApp()

// 从服务器状态水合
if (typeof window !== 'undefined' && window.__PINIA_STATE__) {
  pinia.state.value = window.__PINIA_STATE__
}

app.mount('#app')
```

## 测试

### 测试设置

```js
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it } from 'vitest'

describe('Store 测试', () => {
  beforeEach(() => {
    // 为每个测试创建新的 pinia 实例
    const pinia = createPinia()
    setActivePinia(pinia)
  })
  
  it('应该工作', () => {
    const store = useMyStore()
    expect(store.count).toBe(0)
  })
})
```

### 模拟插件

```js
import { createPinia } from 'pinia'
import { vi } from 'vitest'

function createTestPinia() {
  const pinia = createPinia()
  
  // 模拟外部依赖
  pinia.use(() => ({
    $api: {
      get: vi.fn(),
      post: vi.fn()
    },
    $router: {
      push: vi.fn(),
      replace: vi.fn()
    }
  }))
  
  return pinia
}
```

## 高级配置

### 自定义状态序列化

```js
import { createPinia } from 'pinia'
import { ref } from 'vue'

function createCustomPinia() {
  const pinia = createPinia()
  
  // 复杂类型的自定义序列化
  pinia.use(({ store }) => {
    store.$serialize = () => {
      const state = { ...store.$state }
      // 自定义序列化逻辑
      if (state.date instanceof Date) {
        state.date = state.date.toISOString()
      }
      return state
    }
    
    store.$deserialize = (data) => {
      // 自定义反序列化逻辑
      if (typeof data.date === 'string') {
        data.date = new Date(data.date)
      }
      store.$patch(data)
    }
  })
  
  return pinia
}
```

### 性能监控

```js
import { createPinia } from 'pinia'

function createMonitoredPinia() {
  const pinia = createPinia()
  
  pinia.use(({ store }) => {
    // 监控 action 性能
    store.$onAction(({ name, after, onError }) => {
      const start = Date.now()
      
      after(() => {
        const duration = Date.now() - start
        console.log(`Action ${name} 耗时 ${duration}ms`)
      })
      
      onError((error) => {
        console.error(`Action ${name} 失败:`, error)
      })
    })
    
    // 监控状态变化
    store.$subscribe((mutation, state) => {
      console.log('状态变化:', mutation.type, mutation.payload)
    })
  })
  
  return pinia
}
```

## TypeScript

### 自定义属性类型

```ts
import 'pinia'
import type { Router } from 'vue-router'
import type { AxiosInstance } from 'axios'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    $router: Router
    $api: AxiosInstance
  }
}

// 现在 TypeScript 知道自定义属性
const pinia = createPinia()
pinia.use(({ store }) => {
  store.$router = router // ✅ 有类型
  store.$api = api       // ✅ 有类型
})
```

### 通用 Pinia 工厂

```ts
interface PiniaConfig {
  plugins?: PiniaPlugin[]
  devtools?: boolean
}

function createConfiguredPinia(config: PiniaConfig = {}): Pinia {
  const pinia = createPinia()
  
  // 添加插件
  config.plugins?.forEach(plugin => {
    pinia.use(plugin)
  })
  
  // 配置开发工具
  if (config.devtools && process.env.NODE_ENV === 'development') {
    pinia.use(devtoolsPlugin)
  }
  
  return pinia
}
```

## 错误处理

### 全局错误处理器

```js
import { createPinia } from 'pinia'

function createRobustPinia() {
  const pinia = createPinia()
  
  pinia.use(({ store }) => {
    // 全局错误处理
    store.$onAction(({ name, onError }) => {
      onError((error) => {
        console.error(`Store action ${name} 失败:`, error)
        
        // 报告给错误跟踪服务
        errorTracker.captureException(error, {
          tags: {
            store: store.$id,
            action: name
          }
        })
      })
    })
  })
  
  return pinia
}
```

### 回退状态

```js
import { createPinia } from 'pinia'

function createFallbackPinia() {
  const pinia = createPinia()
  
  pinia.use(({ store, options }) => {
    // 添加回退状态
    store.$fallback = () => {
      if (typeof options.state === 'function') {
        store.$patch(options.state())
      }
    }
    
    // 关键错误时自动回退
    store.$onAction(({ name, onError }) => {
      onError((error) => {
        if (error.critical) {
          store.$fallback()
        }
      })
    })
  })
  
  return pinia
}
```

## 最佳实践

### 1. 每个应用一个实例

```js
// ✅ 好 - 每个应用一个实例
const pinia = createPinia()
app.use(pinia)

// ❌ 避免 - 无理由的多个实例
const pinia1 = createPinia()
const pinia2 = createPinia()
```

### 2. 使用前配置

```js
// ✅ 好 - 使用前配置
const pinia = createPinia()
pinia.use(persistencePlugin)
pinia.use(routerPlugin)
app.use(pinia)

// ❌ 避免 - 安装后添加插件
app.use(pinia)
pinia.use(latePlugin) // 可能不会影响现有 store
```

### 3. 环境特定配置

```js
// ✅ 好 - 环境感知设置
const pinia = createPinia()

if (process.env.NODE_ENV === 'development') {
  pinia.use(loggerPlugin)
  pinia.use(devtoolsPlugin)
}

if (process.env.NODE_ENV === 'production') {
  pinia.use(analyticsPlugin)
  pinia.use(errorReportingPlugin)
}
```

### 4. 插件顺序很重要

```js
// ✅ 好 - 逻辑插件顺序
const pinia = createPinia()
pinia.use(routerPlugin)      // 基础功能
pinia.use(persistencePlugin) // 依赖状态
pinia.use(loggerPlugin)      // 应该最后添加以完整记录
```

## 常见模式

### 工厂模式

```js
function createAppPinia() {
  const pinia = createPinia()
  
  // 标准插件
  pinia.use(routerPlugin)
  pinia.use(persistencePlugin)
  
  // 环境特定
  if (import.meta.env.DEV) {
    pinia.use(loggerPlugin)
  }
  
  return pinia
}

// 用法
const pinia = createAppPinia()
app.use(pinia)
```

### 懒加载插件

```js
async function createAsyncPinia() {
  const pinia = createPinia()
  
  // 动态加载插件
  if (shouldUsePersistence) {
    const { createPersistedState } = await import('pinia-plugin-persistedstate')
    pinia.use(createPersistedState())
  }
  
  return pinia
}
```

## 生命周期

### 安装

1. `createPinia()` 创建新实例
2. `app.use(pinia)` 安装插件
3. Pinia 设置全局属性并提供实例

### Store 创建

1. `defineStore()` 注册 store 定义
2. 首次调用 `useStore()` 创建 store 实例
3. 插件应用到新 store
4. Store 添加到 Pinia 实例

### 清理

1. 应用卸载时，Pinia 清理所有 store
2. Effect scope 被销毁
3. 订阅被移除

## 另请参阅

- [Pinia 实例](./pinia-instance) - Pinia 实例 API
- [插件指南](../guide/plugins) - 创建插件
- [SSR 指南](../guide/ssr) - 服务端渲染
- [测试指南](../guide/testing) - 使用 Pinia 进行测试