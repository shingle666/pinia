---
title: 插件开发
description: 学习如何为 Pinia 开发自定义插件。全面指导如何创建强大且可重用的 Pinia 插件。
head:
  - [meta, { name: description, content: "学习如何为 Pinia 开发自定义插件。全面指导如何创建强大且可重用的 Pinia 插件。" }]
  - [meta, { name: keywords, content: "Pinia 插件开发, Vue 插件, 状态管理插件, Pinia 扩展" }]
  - [meta, { property: "og:title", content: "插件开发 - Pinia" }]
  - [meta, { property: "og:description", content: "学习如何为 Pinia 开发自定义插件。全面指导如何创建强大且可重用的 Pinia 插件。" }]
---

# 插件开发

本指南将教你如何为 Pinia 开发自定义插件，从基础概念到高级模式。

## 什么是 Pinia 插件？

Pinia 插件是扩展 store 功能的函数。它们可以：

- 向 store 添加属性
- 向 store 添加新方法
- 包装现有方法
- 更改或扩展 store 选项
- 添加全局功能

## 基础插件结构

### 插件函数签名

```ts
type PiniaPlugin = (context: PiniaPluginContext) => 
  Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
```

### 插件上下文

```ts
interface PiniaPluginContext {
  pinia: Pinia          // Pinia 实例
  app: App              // Vue 应用实例
  store: Store          // 当前 store 实例
  options: StoreOptions // Store 定义选项
}
```

### 基础插件示例

```js
function myFirstPlugin({ store }) {
  // 向每个 store 添加属性
  return {
    hello: 'world'
  }
}

// 注册插件
const pinia = createPinia()
pinia.use(myFirstPlugin)

// 现在每个 store 都有 'hello' 属性
const store = useMyStore()
console.log(store.hello) // 'world'
```

## 开发环境设置

### 项目结构

```
my-pinia-plugin/
├── src/
│   ├── index.ts          # 主插件文件
│   ├── types.ts          # TypeScript 定义
│   └── utils.ts          # 工具函数
├── tests/
│   ├── plugin.test.ts    # 插件测试
│   └── setup.ts          # 测试设置
├── examples/
│   └── basic-usage.ts    # 使用示例
├── package.json
├── tsconfig.json
└── README.md
```

### Package.json 设置

```json
{
  "name": "pinia-my-plugin",
  "version": "1.0.0",
  "description": "一个自定义 Pinia 插件",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "rollup -c",
    "test": "vitest",
    "dev": "rollup -c -w"
  },
  "peerDependencies": {
    "pinia": "^2.0.0",
    "vue": "^3.0.0"
  },
  "devDependencies": {
    "@rollup/plugin-typescript": "^11.0.0",
    "pinia": "^2.0.0",
    "rollup": "^3.0.0",
    "typescript": "^4.9.0",
    "vitest": "^0.28.0",
    "vue": "^3.2.0"
  }
}
```

## 插件开发模式

### 1. 添加属性

```js
function addPropertiesPlugin() {
  return {
    // 添加响应式属性
    timestamp: ref(Date.now()),
    
    // 添加计算属性
    formattedTime: computed(() => {
      return new Date(timestamp.value).toLocaleString()
    }),
    
    // 添加方法
    updateTimestamp() {
      timestamp.value = Date.now()
    }
  }
}
```

### 2. 包装 Actions

```js
function actionWrapperPlugin({ store }) {
  // 存储原始 actions
  const originalActions = {}
  
  Object.keys(store).forEach(key => {
    if (typeof store[key] === 'function') {
      originalActions[key] = store[key]
      
      // 包装 action
      store[key] = function(...args) {
        console.log(`Action ${key} 被调用，参数:`, args)
        
        const result = originalActions[key].apply(this, args)
        
        console.log(`Action ${key} 完成，结果:`, result)
        
        return result
      }
    }
  })
}
```

### 3. 状态持久化

```js
function createPersistencePlugin(options = {}) {
  return function persistencePlugin({ store, options: storeOptions }) {
    // 检查此 store 是否启用持久化
    if (!storeOptions.persist) return
    
    const {
      key = store.$id,
      storage = localStorage,
      serializer = JSON,
      beforeRestore = (state) => state,
      afterRestore = (state) => state
    } = typeof storeOptions.persist === 'object' 
      ? storeOptions.persist 
      : {}
    
    // 从存储恢复状态
    try {
      const savedState = storage.getItem(key)
      if (savedState) {
        const parsed = serializer.parse(savedState)
        const restored = beforeRestore(parsed)
        store.$patch(restored)
        afterRestore(store.$state)
      }
    } catch (error) {
      console.error('恢复状态失败:', error)
    }
    
    // 状态变化时保存
    store.$subscribe((mutation, state) => {
      try {
        const serialized = serializer.stringify(state)
        storage.setItem(key, serialized)
      } catch (error) {
        console.error('持久化状态失败:', error)
      }
    })
  }
}
```

### 4. 验证插件

```js
function createValidationPlugin() {
  return function validationPlugin({ store, options }) {
    // 如果定义了验证模式则添加
    if (!options.validation) return
    
    const { schema, onError = console.error } = options.validation
    
    // 验证初始状态
    validateState(store.$state, schema, onError)
    
    // 状态变化时验证
    store.$subscribe((mutation, state) => {
      validateState(state, schema, onError)
    })
    
    return {
      $validate() {
        return validateState(store.$state, schema, onError)
      }
    }
  }
}

function validateState(state, schema, onError) {
  try {
    // 简单验证示例
    for (const [key, validator] of Object.entries(schema)) {
      if (!validator(state[key])) {
        throw new Error(`${key} 验证失败`)
      }
    }
    return true
  } catch (error) {
    onError(error)
    return false
  }
}
```

### 5. 异步 Actions 插件

```js
function createAsyncActionsPlugin() {
  return function asyncActionsPlugin({ store }) {
    const loadingStates = reactive({})
    const errors = reactive({})
    
    // 包装异步 actions
    Object.keys(store).forEach(key => {
      const action = store[key]
      if (typeof action === 'function') {
        store[key] = async function(...args) {
          loadingStates[key] = true
          errors[key] = null
          
          try {
            const result = await action.apply(this, args)
            return result
          } catch (error) {
            errors[key] = error
            throw error
          } finally {
            loadingStates[key] = false
          }
        }
      }
    })
    
    return {
      $loading: readonly(loadingStates),
      $errors: readonly(errors),
      $isLoading: (actionName) => !!loadingStates[actionName],
      $getError: (actionName) => errors[actionName],
      $clearError: (actionName) => {
        errors[actionName] = null
      }
    }
  }
}
```

## 高级插件技术

### 插件组合

```js
function composePlugins(...plugins) {
  return function composedPlugin(context) {
    const results = plugins.map(plugin => plugin(context)).filter(Boolean)
    return Object.assign({}, ...results)
  }
}

// 使用
const myPlugin = composePlugins(
  persistencePlugin,
  validationPlugin,
  asyncActionsPlugin
)

pinia.use(myPlugin)
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

// 只应用于特定 stores
const userStorePlugin = createConditionalPlugin(
  ({ store }) => store.$id === 'user',
  userSpecificPlugin
)

// 只在开发环境应用
const devPlugin = createConditionalPlugin(
  () => process.env.NODE_ENV === 'development',
  debugPlugin
)
```

### 带选项的插件

```js
function createConfigurablePlugin(defaultOptions = {}) {
  return function configurablePlugin(userOptions = {}) {
    const options = { ...defaultOptions, ...userOptions }
    
    return function plugin({ store }) {
      // 使用合并的选项
      if (options.enableLogging) {
        store.$onAction(({ name, args }) => {
          console.log(`Action ${name} 被调用:`, args)
        })
      }
      
      if (options.enablePersistence) {
        // 添加持久化逻辑
      }
      
      return {
        $options: options
      }
    }
  }
}

// 使用
const myPlugin = createConfigurablePlugin({
  enableLogging: true,
  enablePersistence: false
})

pinia.use(myPlugin({
  enablePersistence: true // 覆盖默认值
}))
```

## TypeScript 支持

### 插件类型定义

```ts
// types.ts
import { PiniaPluginContext } from 'pinia'

export interface MyPluginOptions {
  enabled?: boolean
  prefix?: string
  storage?: Storage
}

export interface MyPluginProperties {
  $myMethod: () => void
  $myProperty: string
}

export type MyPlugin = (options?: MyPluginOptions) => 
  (context: PiniaPluginContext) => MyPluginProperties
```

### 模块声明

```ts
// 扩展 Pinia 类型
declare module 'pinia' {
  export interface PiniaCustomProperties {
    $myMethod: () => void
    $myProperty: string
  }
}
```

### 插件实现

```ts
// index.ts
import { PiniaPluginContext } from 'pinia'
import { MyPlugin, MyPluginOptions, MyPluginProperties } from './types'

export const createMyPlugin: MyPlugin = (options = {}) => {
  return ({ store }: PiniaPluginContext): MyPluginProperties => {
    return {
      $myMethod() {
        console.log('方法被调用')
      },
      $myProperty: options.prefix || 'default'
    }
  }
}

export * from './types'
```

## 测试插件

### 测试设置

```ts
// tests/setup.ts
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

beforeEach(() => {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  setActivePinia(pinia)
})
```

### 插件测试

```ts
// tests/plugin.test.ts
import { describe, it, expect } from 'vitest'
import { defineStore } from 'pinia'
import { createMyPlugin } from '../src'

describe('MyPlugin', () => {
  it('应该向 store 添加属性', () => {
    const pinia = createPinia()
    pinia.use(createMyPlugin())
    
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 })
    })
    
    const store = useTestStore()
    
    expect(store.$myMethod).toBeDefined()
    expect(store.$myProperty).toBe('default')
  })
  
  it('应该支持自定义选项', () => {
    const pinia = createPinia()
    pinia.use(createMyPlugin({ prefix: 'custom' }))
    
    const useTestStore = defineStore('test', {
      state: () => ({ count: 0 })
    })
    
    const store = useTestStore()
    
    expect(store.$myProperty).toBe('custom')
  })
})
```

### 集成测试

```ts
// tests/integration.test.ts
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMyPlugin } from '../src'
import TestComponent from './TestComponent.vue'

it('应该在 Vue 组件中工作', () => {
  const pinia = createPinia()
  pinia.use(createMyPlugin())
  
  const wrapper = mount(TestComponent, {
    global: {
      plugins: [pinia]
    }
  })
  
  // 测试组件与插件的行为
  expect(wrapper.text()).toContain('插件已加载')
})
```

## 发布你的插件

### 构建配置

```js
// rollup.config.js
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named'
    },
    {
      file: 'dist/index.esm.js',
      format: 'es'
    }
  ],
  plugins: [typescript()],
  external: ['pinia', 'vue']
}
```

### 文档

```markdown
# My Pinia Plugin

## 安装

```bash
npm install pinia-my-plugin
```

## 使用

```js
import { createPinia } from 'pinia'
import { createMyPlugin } from 'pinia-my-plugin'

const pinia = createPinia()
pinia.use(createMyPlugin({
  // 选项
}))
```

## API

### 选项

- `enabled` (boolean): 启用/禁用插件
- `prefix` (string): 属性前缀

### 添加的属性

- `$myMethod()`: 自定义方法
- `$myProperty`: 自定义属性
```

### 发布检查清单

- [ ] 测试通过
- [ ] 包含 TypeScript 定义
- [ ] 文档完整
- [ ] 提供示例
- [ ] 指定对等依赖
- [ ] 生成构建产物
- [ ] 版本号更新
- [ ] 更新日志

## 最佳实践

### 1. 命名约定

```js
// 插件属性使用 $ 前缀
return {
  $myMethod() {},     // ✅ 好的
  myMethod() {},      // ❌ 可能与用户代码冲突
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
          console.error('插件方法失败:', error)
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
  // 防抖昂贵操作
  const debouncedSave = debounce(() => {
    // 昂贵操作
  }, 1000)
  
  store.$subscribe(() => {
    debouncedSave()
  })
  
  // 使用 WeakMap 存储特定于 store 的数据
  const storeData = new WeakMap()
  storeData.set(store, { /* 数据 */ })
}
```

### 4. 内存管理

```js
function memoryAwarePlugin({ store }) {
  const cleanup = []
  
  // 设置订阅
  const unsubscribe = store.$subscribe(() => {})
  cleanup.push(unsubscribe)
  
  const interval = setInterval(() => {}, 1000)
  cleanup.push(() => clearInterval(interval))
  
  // store 销毁时清理
  store.$dispose(() => {
    cleanup.forEach(fn => fn())
  })
}
```

### 5. 向后兼容性

```js
function compatiblePlugin({ store, options }) {
  // 检查 Pinia 版本
  const piniaVersion = store.$pinia.version || '2.0.0'
  
  if (semver.gte(piniaVersion, '2.1.0')) {
    // 使用新功能
  } else {
    // 旧版本回退
  }
}
```

## 常见模式

### 插件注册表

```js
class PluginRegistry {
  constructor() {
    this.plugins = new Map()
  }
  
  register(name, plugin) {
    this.plugins.set(name, plugin)
  }
  
  get(name) {
    return this.plugins.get(name)
  }
  
  createComposed(...names) {
    const plugins = names.map(name => this.get(name))
    return composePlugins(...plugins)
  }
}

const registry = new PluginRegistry()
registry.register('persistence', persistencePlugin)
registry.register('validation', validationPlugin)

const myPlugin = registry.createComposed('persistence', 'validation')
```

### 插件中间件

```js
function createMiddleware() {
  const middlewares = []
  
  return {
    use(middleware) {
      middlewares.push(middleware)
    },
    
    createPlugin() {
      return function middlewarePlugin(context) {
        let result = {}
        
        for (const middleware of middlewares) {
          const middlewareResult = middleware(context, result)
          if (middlewareResult) {
            result = { ...result, ...middlewareResult }
          }
        }
        
        return result
      }
    }
  }
}
```

## 故障排除

### 常见问题

1. **插件不工作**: 检查插件是否在 store 创建前注册
2. **TypeScript 错误**: 确保包含模块声明
3. **性能问题**: 使用防抖并避免在订阅中进行昂贵操作
4. **内存泄漏**: 始终清理订阅和定时器

### 调试

```js
function debugPlugin({ store }) {
  console.log('插件应用于 store:', store.$id)
  console.log('Store 状态:', store.$state)
  console.log('Store 选项:', store.$options)
  
  return {
    $debug: {
      store,
      state: store.$state,
      options: store.$options
    }
  }
}
```

## 相关资源

- [插件 API 参考](../api/plugins.md)
- [官方插件](../ecosystem/plugins.md)
- [TypeScript 指南](../guide/typescript.md)