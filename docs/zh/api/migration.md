---
title: 迁移 API 参考
description: Pinia 迁移相关 API 的完整参考文档。了解从 Vuex 迁移到 Pinia 的工具和助手函数。
head:
  - [meta, { name: description, content: "Pinia 迁移相关 API 的完整参考文档。了解从 Vuex 迁移到 Pinia 的工具和助手函数。" }]
  - [meta, { name: keywords, content: "Pinia 迁移, Vuex 迁移, API 参考, Vue 状态管理" }]
  - [meta, { property: "og:title", content: "迁移 API 参考 - Pinia" }]
  - [meta, { property: "og:description", content: "Pinia 迁移相关 API 的完整参考文档。了解从 Vuex 迁移到 Pinia 的工具和助手函数。" }]
---

# 迁移 API 参考

本节提供了从 Vuex 迁移到 Pinia 时可用的 API 和工具函数的完整参考。

## 迁移助手

### createVuexStore()

创建一个与 Vuex 兼容的 store 包装器，帮助渐进式迁移。

```ts
function createVuexStore<S, G, A, M>(
  options: VuexStoreOptions<S, G, A, M>
): VuexCompatStore<S, G, A, M>
```

#### 参数

- **options**: `VuexStoreOptions<S, G, A, M>` - Vuex store 配置选项

#### 返回值

- **类型**: `VuexCompatStore<S, G, A, M>`
- **描述**: 兼容 Vuex API 的 store 实例

#### 示例

```js
import { createVuexStore } from 'pinia/migration'

const store = createVuexStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    }
  },
  getters: {
    doubleCount: state => state.count * 2
  }
})
```

### mapVuexState()

将 Vuex 状态映射到组件，与 Vuex 的 `mapState` 兼容。

```ts
function mapVuexState<S>(
  namespace?: string,
  states: string[] | Record<string, string | ((state: S) => any)>
): Record<string, ComputedRef>
```

#### 参数

- **namespace**: `string` (可选) - 模块命名空间
- **states**: `string[] | Record<string, string | Function>` - 要映射的状态

#### 返回值

- **类型**: `Record<string, ComputedRef>`
- **描述**: 映射的计算属性对象

#### 示例

```js
import { mapVuexState } from 'pinia/migration'

export default {
  computed: {
    // 数组语法
    ...mapVuexState(['count', 'user']),
    
    // 对象语法
    ...mapVuexState({
      localCount: 'count',
      localUser: 'user'
    }),
    
    // 带命名空间
    ...mapVuexState('counter', ['count'])
  }
}
```

### mapVuexGetters()

将 Vuex getters 映射到组件，与 Vuex 的 `mapGetters` 兼容。

```ts
function mapVuexGetters<G>(
  namespace?: string,
  getters: string[] | Record<string, string>
): Record<string, ComputedRef>
```

#### 参数

- **namespace**: `string` (可选) - 模块命名空间
- **getters**: `string[] | Record<string, string>` - 要映射的 getters

#### 返回值

- **类型**: `Record<string, ComputedRef>`
- **描述**: 映射的计算属性对象

#### 示例

```js
import { mapVuexGetters } from 'pinia/migration'

export default {
  computed: {
    // 数组语法
    ...mapVuexGetters(['doubleCount', 'isEven']),
    
    // 对象语法
    ...mapVuexGetters({
      localDouble: 'doubleCount'
    }),
    
    // 带命名空间
    ...mapVuexGetters('counter', ['doubleCount'])
  }
}
```

### mapVuexActions()

将 Vuex actions 映射到组件，与 Vuex 的 `mapActions` 兼容。

```ts
function mapVuexActions<A>(
  namespace?: string,
  actions: string[] | Record<string, string>
): Record<string, Function>
```

#### 参数

- **namespace**: `string` (可选) - 模块命名空间
- **actions**: `string[] | Record<string, string>` - 要映射的 actions

#### 返回值

- **类型**: `Record<string, Function>`
- **描述**: 映射的方法对象

#### 示例

```js
import { mapVuexActions } from 'pinia/migration'

export default {
  methods: {
    // 数组语法
    ...mapVuexActions(['increment', 'decrement']),
    
    // 对象语法
    ...mapVuexActions({
      add: 'increment'
    }),
    
    // 带命名空间
    ...mapVuexActions('counter', ['increment'])
  }
}
```

### mapVuexMutations()

将 Vuex mutations 映射到组件，与 Vuex 的 `mapMutations` 兼容。

```ts
function mapVuexMutations<M>(
  namespace?: string,
  mutations: string[] | Record<string, string>
): Record<string, Function>
```

#### 参数

- **namespace**: `string` (可选) - 模块命名空间
- **mutations**: `string[] | Record<string, string>` - 要映射的 mutations

#### 返回值

- **类型**: `Record<string, Function>`
- **描述**: 映射的方法对象

#### 示例

```js
import { mapVuexMutations } from 'pinia/migration'

export default {
  methods: {
    // 数组语法
    ...mapVuexMutations(['INCREMENT', 'DECREMENT']),
    
    // 对象语法
    ...mapVuexMutations({
      add: 'INCREMENT'
    }),
    
    // 带命名空间
    ...mapVuexMutations('counter', ['INCREMENT'])
  }
}
```

## 转换工具

### convertVuexModule()

将 Vuex 模块转换为 Pinia store 定义。

```ts
function convertVuexModule<S, G, A, M>(
  module: VuexModule<S, G, A, M>
): DefineStoreOptions<string, S, G, A>
```

#### 参数

- **module**: `VuexModule<S, G, A, M>` - Vuex 模块定义

#### 返回值

- **类型**: `DefineStoreOptions<string, S, G, A>`
- **描述**: Pinia store 定义选项

#### 示例

```js
import { convertVuexModule, defineStore } from 'pinia/migration'

// Vuex 模块
const vuexModule = {
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => commit('increment'), 1000)
    }
  },
  getters: {
    doubleCount: state => state.count * 2
  }
}

// 转换为 Pinia store
const piniaStoreOptions = convertVuexModule(vuexModule)
const useCounterStore = defineStore('counter', piniaStoreOptions)
```

### migrateVuexStore()

完整迁移 Vuex store 到 Pinia。

```ts
function migrateVuexStore(
  vuexStore: VuexStore,
  options?: MigrationOptions
): Pinia
```

#### 参数

- **vuexStore**: `VuexStore` - 现有的 Vuex store
- **options**: `MigrationOptions` (可选) - 迁移配置选项

#### 返回值

- **类型**: `Pinia`
- **描述**: 迁移后的 Pinia 实例

#### 示例

```js
import { migrateVuexStore } from 'pinia/migration'
import vuexStore from './store/vuex'

const pinia = migrateVuexStore(vuexStore, {
  preserveState: true,
  convertModules: true,
  generateStoreNames: true
})
```

## 兼容性助手

### createVuexCompatibility()

创建 Vuex 兼容层，允许在同一应用中使用 Vuex 和 Pinia。

```ts
function createVuexCompatibility(
  options: VuexCompatibilityOptions
): VuexCompatibilityLayer
```

#### 参数

- **options**: `VuexCompatibilityOptions` - 兼容性配置

#### 返回值

- **类型**: `VuexCompatibilityLayer`
- **描述**: Vuex 兼容层实例

#### 示例

```js
import { createVuexCompatibility } from 'pinia/migration'

const compatibility = createVuexCompatibility({
  vuexStore: existingVuexStore,
  pinia: piniaInstance,
  bridgeModules: ['user', 'cart']
})

// 在 Vue 应用中使用
app.use(compatibility)
```

### useVuexStore()

在 Composition API 中使用 Vuex store 的助手。

```ts
function useVuexStore<S = any>(
  namespace?: string
): VuexStoreComposition<S>
```

#### 参数

- **namespace**: `string` (可选) - 模块命名空间

#### 返回值

- **类型**: `VuexStoreComposition<S>`
- **描述**: Vuex store 的组合式 API 包装

#### 示例

```js
import { useVuexStore } from 'pinia/migration'

export default {
  setup() {
    const store = useVuexStore()
    const counterStore = useVuexStore('counter')
    
    return {
      count: computed(() => store.state.count),
      increment: () => store.dispatch('increment')
    }
  }
}
```

## 状态迁移

### migrateState()

迁移 Vuex 状态到 Pinia stores。

```ts
function migrateState(
  vuexState: any,
  storeMapping: Record<string, string>
): void
```

#### 参数

- **vuexState**: `any` - Vuex 状态对象
- **storeMapping**: `Record<string, string>` - 状态到 store 的映射

#### 示例

```js
import { migrateState } from 'pinia/migration'

// 从 localStorage 或服务器获取的 Vuex 状态
const vuexState = {
  counter: { count: 5 },
  user: { name: 'John', email: 'john@example.com' }
}

// 迁移到对应的 Pinia stores
migrateState(vuexState, {
  'counter': 'counter',
  'user': 'user'
})
```

### preserveVuexState()

保留 Vuex 状态并在 Pinia 中重建。

```ts
function preserveVuexState(
  vuexStore: VuexStore,
  piniaStores: Record<string, Store>
): void
```

#### 参数

- **vuexStore**: `VuexStore` - 源 Vuex store
- **piniaStores**: `Record<string, Store>` - 目标 Pinia stores

#### 示例

```js
import { preserveVuexState } from 'pinia/migration'

const piniaStores = {
  counter: useCounterStore(),
  user: useUserStore()
}

preserveVuexState(vuexStore, piniaStores)
```

## 类型定义

### VuexStoreOptions

```ts
interface VuexStoreOptions<S, G, A, M> {
  state?: S | (() => S)
  getters?: G
  actions?: A
  mutations?: M
  modules?: Record<string, VuexModule>
  plugins?: VuexPlugin[]
  strict?: boolean
  devtools?: boolean
}
```

### MigrationOptions

```ts
interface MigrationOptions {
  preserveState?: boolean
  convertModules?: boolean
  generateStoreNames?: boolean
  namePrefix?: string
  excludeModules?: string[]
  customConverters?: Record<string, ModuleConverter>
}
```

### VuexCompatibilityOptions

```ts
interface VuexCompatibilityOptions {
  vuexStore: VuexStore
  pinia: Pinia
  bridgeModules?: string[]
  syncState?: boolean
  enableDevtools?: boolean
}
```

## 迁移策略

### 渐进式迁移

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuexCompatibility } from 'pinia/migration'
import vuexStore from './store'

const app = createApp(App)
const pinia = createPinia()

// 创建兼容层
const compatibility = createVuexCompatibility({
  vuexStore,
  pinia,
  bridgeModules: ['user'] // 只桥接部分模块
})

app.use(compatibility)
app.mount('#app')
```

### 完整迁移

```js
import { migrateVuexStore } from 'pinia/migration'
import vuexStore from './store'

// 完整迁移
const pinia = migrateVuexStore(vuexStore, {
  preserveState: true,
  convertModules: true
})

app.use(pinia)
```

## 最佳实践

### 1. 逐步迁移

```js
// 第一步：设置兼容层
const compatibility = createVuexCompatibility({
  vuexStore,
  pinia,
  bridgeModules: ['newModule'] // 只桥接新模块
})

// 第二步：逐个转换模块
const useNewModuleStore = defineStore('newModule', 
  convertVuexModule(vuexModules.newModule)
)

// 第三步：更新组件使用
// 从 mapState 迁移到 store 直接使用
```

### 2. 状态保持

```js
// 迁移前保存状态
const savedState = vuexStore.state

// 迁移后恢复状态
migrateState(savedState, storeMapping)
```

### 3. 测试兼容性

```js
// 测试迁移后的功能
function testMigration() {
  const vuexResult = vuexStore.getters.someGetter
  const piniaResult = useSomeStore().someGetter
  
  console.assert(vuexResult === piniaResult, '迁移结果不一致')
}
```

## 相关链接

- [迁移指南](../migration.md)
- [Vuex 兼容性](../guide/vuex-compatibility.md)
- [测试迁移](../guide/testing-migration.md)