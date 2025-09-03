---
title: 插件 API 参考
description: Pinia 插件系统的完整 API 参考文档。了解如何开发和使用 Pinia 插件。
head:
  - [meta, { name: description, content: "Pinia 插件系统的完整 API 参考文档。了解如何开发和使用 Pinia 插件。" }]
  - [meta, { name: keywords, content: "Pinia 插件, 插件 API, Vue 状态管理插件, Pinia 扩展" }]
  - [meta, { property: "og:title", content: "插件 API 参考 - Pinia" }]
  - [meta, { property: "og:description", content: "Pinia 插件系统的完整 API 参考文档。了解如何开发和使用 Pinia 插件。" }]
---

# 插件 API 参考

本节提供了 Pinia 插件系统的完整 API 参考文档。

## 核心插件 API

### pinia.use()

注册插件到 Pinia 实例。

```ts
function use(plugin: PiniaPlugin): Pinia
```

#### 参数

- **plugin**: `PiniaPlugin` - 要注册的插件函数

#### 返回值

- **类型**: `Pinia`
- **描述**: Pinia 实例（支持链式调用）

#### 示例

```js
import { createPinia } from 'pinia'
import myPlugin from './my-plugin'

const pinia = createPinia()
pinia.use(myPlugin)

// 链式调用
pinia
  .use(plugin1)
  .use(plugin2)
  .use(plugin3)
```

## 插件类型定义

### PiniaPlugin

插件函数的类型定义。

```ts
type PiniaPlugin = (context: PiniaPluginContext) => 
  Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
```

#### 参数

- **context**: `PiniaPluginContext` - 插件上下文对象

#### 返回值

- **类型**: `Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void`
- **描述**: 要添加到 store 的属性，或 void

### PiniaPluginContext

插件上下文接口。

```ts
interface PiniaPluginContext<
  Id extends string = string,
  S extends StateTree = StateTree,
  G extends _GettersTree<S> = _GettersTree<S>,
  A extends _ActionsTree = _ActionsTree
> {
  pinia: Pinia
  app: App
  store: Store<Id, S, G, A>
  options: DefineStoreOptionsInPlugin<Id, S, G, A>
}
```

#### 属性

- **pinia**: `Pinia` - 当前 Pinia 实例
- **app**: `App` - Vue 应用实例
- **store**: `Store<Id, S, G, A>` - 当前 store 实例
- **options**: `DefineStoreOptionsInPlugin<Id, S, G, A>` - store 定义选项

## 插件上下文属性

### context.pinia

当前的 Pinia 实例。

```ts
const pinia: Pinia
```

#### 示例

```js
function myPlugin({ pinia }) {
  // 访问 Pinia 实例
  console.log('Pinia 实例:', pinia)
  
  // 访问全局状态
  console.log('全局状态:', pinia.state.value)
  
  // 访问所有 stores
  console.log('所有 stores:', pinia._s)
}
```

### context.app

Vue 应用实例。

```ts
const app: App
```

#### 示例

```js
function myPlugin({ app }) {
  // 访问 Vue 应用实例
  console.log('Vue 应用:', app)
  
  // 访问应用配置
  console.log('应用配置:', app.config)
  
  // 注册全局组件
  app.component('MyComponent', MyComponent)
}
```

### context.store

当前 store 实例。

```ts
const store: Store<Id, S, G, A>
```

#### 示例

```js
function myPlugin({ store }) {
  // 访问 store 属性
  console.log('Store ID:', store.$id)
  console.log('Store 状态:', store.$state)
  
  // 监听状态变化
  store.$subscribe((mutation, state) => {
    console.log('状态变化:', mutation, state)
  })
  
  // 监听 action 执行
  store.$onAction((action) => {
    console.log('Action 执行:', action)
  })
}
```

### context.options

store 定义选项。

```ts
const options: DefineStoreOptionsInPlugin<Id, S, G, A>
```

#### 示例

```js
function myPlugin({ options }) {
  // 访问 store 定义选项
  console.log('Store ID:', options.id)
  console.log('State 函数:', options.state)
  console.log('Getters:', options.getters)
  console.log('Actions:', options.actions)
  
  // 检查自定义选项
  if (options.persist) {
    console.log('启用持久化:', options.persist)
  }
}
```

## 插件返回值

### 添加属性到 Store

插件可以返回对象来添加属性到 store。

```js
function addPropertiesPlugin() {
  return {
    // 添加响应式属性
    hello: ref('world'),
    
    // 添加计算属性
    doubled: computed(() => store.count * 2),
    
    // 添加方法
    reset() {
      store.$reset()
    },
    
    // 添加异步方法
    async fetchData() {
      const data = await api.getData()
      store.data = data
    }
  }
}
```

### 添加状态属性

```js
function addStatePlugin({ store }) {
  return {
    // 添加到状态
    $state: {
      createdAt: new Date(),
      version: '1.0.0'
    }
  }
}
```

## 常用插件模式

### 日志插件

```js
function createLoggerPlugin(options = {}) {
  return function loggerPlugin({ store }) {
    const { logActions = true, logMutations = true } = options
    
    if (logActions) {
      store.$onAction(({ name, args, after, onError }) => {
        console.log(`🚀 Action "${name}" 开始执行`, args)
        
        after((result) => {
          console.log(`✅ Action "${name}" 执行完成`, result)
        })
        
        onError((error) => {
          console.error(`❌ Action "${name}" 执行失败`, error)
        })
      })
    }
    
    if (logMutations) {
      store.$subscribe((mutation, state) => {
        console.log(`🔄 状态变化:`, mutation)
        console.log(`📊 新状态:`, state)
      })
    }
  }
}

// 使用
pinia.use(createLoggerPlugin({
  logActions: true,
  logMutations: false
}))
```

### 持久化插件

```js
function createPersistedStatePlugin(options = {}) {
  return function persistedStatePlugin({ store, options: storeOptions }) {
    // 检查是否启用持久化
    if (!storeOptions.persist) return
    
    const {
      key = store.$id,
      storage = localStorage,
      paths = null
    } = typeof storeOptions.persist === 'object' 
      ? storeOptions.persist 
      : {}
    
    // 恢复状态
    const savedState = storage.getItem(key)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (paths) {
          // 只恢复指定路径
          paths.forEach(path => {
            if (parsed[path] !== undefined) {
              store.$state[path] = parsed[path]
            }
          })
        } else {
          // 恢复整个状态
          store.$patch(parsed)
        }
      } catch (error) {
        console.error('恢复状态失败:', error)
      }
    }
    
    // 监听状态变化并保存
    store.$subscribe((mutation, state) => {
      try {
        const toSave = paths 
          ? paths.reduce((acc, path) => {
              acc[path] = state[path]
              return acc
            }, {})
          : state
        
        storage.setItem(key, JSON.stringify(toSave))
      } catch (error) {
        console.error('保存状态失败:', error)
      }
    })
  }
}

// 使用
pinia.use(createPersistedStatePlugin())
```

### 重置插件

```js
function resetPlugin({ store }) {
  const initialState = JSON.parse(JSON.stringify(store.$state))
  
  return {
    $reset() {
      store.$patch(initialState)
    }
  }
}

// 使用
pinia.use(resetPlugin)
```

### 调试插件

```js
function createDebugPlugin(options = {}) {
  return function debugPlugin({ store }) {
    if (process.env.NODE_ENV !== 'development') return
    
    const { 
      logLevel = 'info',
      enableTimeTravel = true,
      maxHistorySize = 50 
    } = options
    
    // 历史记录
    const history = []
    
    // 记录状态变化
    store.$subscribe((mutation, state) => {
      const entry = {
        timestamp: Date.now(),
        mutation,
        state: JSON.parse(JSON.stringify(state))
      }
      
      history.push(entry)
      
      // 限制历史记录大小
      if (history.length > maxHistorySize) {
        history.shift()
      }
      
      if (logLevel === 'verbose') {
        console.log('🔍 调试信息:', entry)
      }
    })
    
    return {
      // 时间旅行
      $timeTravel: enableTimeTravel ? (index) => {
        if (history[index]) {
          store.$patch(history[index].state)
        }
      } : undefined,
      
      // 获取历史记录
      $getHistory: () => [...history],
      
      // 清除历史记录
      $clearHistory: () => {
        history.length = 0
      }
    }
  }
}

// 使用
pinia.use(createDebugPlugin({
  logLevel: 'verbose',
  enableTimeTravel: true
}))
```

## 高级插件功能

### 插件间通信

```js
// 事件总线插件
function createEventBusPlugin() {
  const eventBus = new EventTarget()
  
  return function eventBusPlugin({ store }) {
    return {
      $emit(event, data) {
        eventBus.dispatchEvent(new CustomEvent(event, { detail: data }))
      },
      
      $on(event, handler) {
        eventBus.addEventListener(event, handler)
        return () => eventBus.removeEventListener(event, handler)
      },
      
      $off(event, handler) {
        eventBus.removeEventListener(event, handler)
      }
    }
  }
}

// 使用
pinia.use(createEventBusPlugin())

// 在 store 中使用
const store = useMyStore()
store.$emit('user-updated', { id: 1, name: 'John' })
store.$on('user-updated', (event) => {
  console.log('用户更新:', event.detail)
})
```

### 条件插件

```js
function createConditionalPlugin(condition, plugin) {
  return function conditionalPlugin(context) {
    if (condition(context)) {
      return plugin(context)
    }
  }
}

// 只在开发环境使用的插件
const devOnlyPlugin = createConditionalPlugin(
  () => process.env.NODE_ENV === 'development',
  debugPlugin
)

pinia.use(devOnlyPlugin)

// 只对特定 store 使用的插件
const userStoreOnlyPlugin = createConditionalPlugin(
  ({ store }) => store.$id === 'user',
  userSpecificPlugin
)

pinia.use(userStoreOnlyPlugin)
```

### 插件组合

```js
function composePlugins(...plugins) {
  return function composedPlugin(context) {
    const results = plugins.map(plugin => plugin(context)).filter(Boolean)
    
    // 合并所有插件返回的属性
    return Object.assign({}, ...results)
  }
}

// 组合多个插件
const combinedPlugin = composePlugins(
  loggerPlugin,
  persistedStatePlugin,
  resetPlugin
)

pinia.use(combinedPlugin)
```

## TypeScript 支持

### 插件类型定义

```ts
import { PiniaPluginContext, Store } from 'pinia'

// 定义插件选项类型
interface MyPluginOptions {
  enabled?: boolean
  prefix?: string
}

// 定义插件添加的属性类型
interface MyPluginProperties {
  $myMethod: () => void
  $myProperty: string
}

// 插件函数类型
type MyPlugin = (options?: MyPluginOptions) => 
  (context: PiniaPluginContext) => MyPluginProperties

// 实现插件
const createMyPlugin: MyPlugin = (options = {}) => {
  return ({ store }) => {
    return {
      $myMethod() {
        console.log('My method called')
      },
      $myProperty: options.prefix || 'default'
    }
  }
}
```

### 扩展 Store 类型

```ts
// 声明模块扩展
declare module 'pinia' {
  export interface PiniaCustomProperties {
    $myMethod: () => void
    $myProperty: string
  }
  
  export interface PiniaCustomStateProperties {
    createdAt: Date
  }
}

// 现在 TypeScript 知道这些属性存在
const store = useMyStore()
store.$myMethod() // ✅ 类型安全
store.$myProperty // ✅ 类型安全
```

## 插件最佳实践

### 1. 命名约定

```js
// 使用 $ 前缀避免与用户属性冲突
function myPlugin() {
  return {
    $myMethod() {}, // ✅ 好的
    myMethod() {},  // ❌ 可能冲突
  }
}
```

### 2. 错误处理

```js
function safePlugin({ store }) {
  try {
    // 插件逻辑
    return {
      $safeMethod() {
        try {
          // 方法实现
        } catch (error) {
          console.error('插件方法执行失败:', error)
        }
      }
    }
  } catch (error) {
    console.error('插件初始化失败:', error)
    return {}
  }
}
```

### 3. 性能考虑

```js
function performantPlugin({ store }) {
  // 避免在每次状态变化时执行昂贵操作
  const debouncedSave = debounce(() => {
    // 昂贵的保存操作
  }, 1000)
  
  store.$subscribe(() => {
    debouncedSave()
  })
}
```

### 4. 清理资源

```js
function resourcePlugin({ store }) {
  const interval = setInterval(() => {
    // 定期任务
  }, 5000)
  
  // 在 store 销毁时清理
  store.$dispose(() => {
    clearInterval(interval)
  })
}
```

## 相关链接

- [插件指南](../guide/plugins.md)
- [插件开发教程](../cookbook/plugin-development.md)
- [官方插件列表](../ecosystem/plugins.md)