---
title: TypeScript API 参考
description: Pinia TypeScript 支持的完整 API 参考文档。了解如何在 TypeScript 项目中使用 Pinia。
head:
  - [meta, { name: description, content: "Pinia TypeScript 支持的完整 API 参考文档。了解如何在 TypeScript 项目中使用 Pinia。" }]
  - [meta, { name: keywords, content: "Pinia TypeScript, TypeScript API, Vue TypeScript 状态管理, 类型安全" }]
  - [meta, { property: "og:title", content: "TypeScript API 参考 - Pinia" }]
  - [meta, { property: "og:description", content: "Pinia TypeScript 支持的完整 API 参考文档。了解如何在 TypeScript 项目中使用 Pinia。" }]
---

# TypeScript API 参考

本节提供了 Pinia TypeScript 支持的完整 API 参考文档。

## 核心类型定义

### Store 类型

#### Store<Id, S, G, A>

Store 的主要类型定义。

```ts
interface Store<
  Id extends string = string,
  S extends StateTree = StateTree,
  G extends _GettersTree<S> = _GettersTree<S>,
  A extends _ActionsTree = _ActionsTree
> {
  $id: Id
  $state: UnwrapRef<S>
  $patch(partialState: _DeepPartial<UnwrapRef<S>>): void
  $patch<F extends (state: UnwrapRef<S>) => any>(stateMutator: F): void
  $reset(): void
  $subscribe(
    callback: SubscriptionCallback<S>,
    options?: { detached?: boolean } & WatchOptions
  ): () => void
  $onAction(
    callback: ActionSubscriptionCallback<A>,
    detached?: boolean
  ): () => void
  $dispose(): void
}
```

#### 类型参数

- **Id**: `string` - Store 的唯一标识符类型
- **S**: `StateTree` - 状态树类型
- **G**: `_GettersTree<S>` - Getters 类型
- **A**: `_ActionsTree` - Actions 类型

### StateTree

状态树的基础类型。

```ts
type StateTree = Record<string | number | symbol, any>
```

### DefineStoreOptions

defineStore 选项的类型定义。

```ts
interface DefineStoreOptions<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A extends _ActionsTree
> {
  id?: Id
  state?: () => S
  getters?: G & ThisType<UnwrapRef<S> & _StoreWithGetters<G> & PiniaCustomProperties>
  actions?: A & ThisType<
    A & UnwrapRef<S> & _StoreWithState<Id, S> & _StoreWithGetters<G> & PiniaCustomProperties
  >
  hydrate?(storeState: UnwrapRef<S>, initialState: UnwrapRef<S>): void
}
```

## 组合式 API 类型

### DefineStoreOptionsInSetup

组合式 API 风格的 store 选项类型。

```ts
type DefineStoreOptionsInSetup<Id extends string, SS> = {
  id?: Id
} & (SS extends _ExtractStateFromSetupStore<infer S, infer A>
  ? _ExtractActionsFromSetupStore<SS> extends infer A
    ? _ExtractGettersFromSetupStore<SS> extends infer G
      ? Omit<DefineStoreOptions<Id, S, G, A>, 'id' | 'state' | 'getters' | 'actions'> & {
          actions?: _ActionsTree
        }
      : never
    : never
  : never)
```

### SetupStoreDefinition

组合式 API store 定义类型。

```ts
type SetupStoreDefinition<
  Id extends string,
  SS
> = SS extends () => infer R
  ? DefineStoreOptionsInSetup<Id, R> & {
      setup: SS
    }
  : never
```

## 工具类型

### StoreDefinition

Store 定义的类型。

```ts
type StoreDefinition<
  Id extends string = string,
  S extends StateTree = StateTree,
  G extends _GettersTree<S> = _GettersTree<S>,
  A extends _ActionsTree = _ActionsTree
> = {
  (pinia?: Pinia | null | undefined): Store<Id, S, G, A>
  $id: Id
}
```

### StoreGeneric

通用 Store 类型。

```ts
type StoreGeneric = Store<string, StateTree, _GettersTree<StateTree>, _ActionsTree>
```

### StoreToRefs

storeToRefs 返回类型。

```ts
type StoreToRefs<SS extends StoreGeneric> = {
  [K in keyof SS as SS[K] extends _Method ? never : K]: SS[K] extends ComputedRef<infer U>
    ? ComputedRef<U>
    : SS[K] extends Ref<infer U>
    ? Ref<U>
    : Ref<UnwrapRef<SS[K]>>
}
```

## 映射辅助函数类型

### MapStoresCustomization

mapStores 自定义类型。

```ts
interface MapStoresCustomization {
  suffix?: string
}
```

### MapStoresReturn

mapStores 返回类型。

```ts
type MapStoresReturn<
  Stores extends Record<string, StoreDefinition>,
  Suffix extends string = 'Store'
> = {
  [Id in keyof Stores as `${Id & string}${Suffix}`]: () => Stores[Id] extends StoreDefinition<
    infer Id,
    infer S,
    infer G,
    infer A
  >
    ? Store<Id, S, G, A>
    : never
}
```

### MapStateReturn

mapState 返回类型。

```ts
type MapStateReturn<
  S extends StateTree,
  G extends _GettersTree<S>,
  Keys extends keyof (S & G)
> = {
  [K in Keys]: () => (S & G)[K]
}
```

### MapWritableStateReturn

mapWritableState 返回类型。

```ts
type MapWritableStateReturn<
  S extends StateTree,
  Keys extends keyof S
> = {
  [K in Keys]: {
    get(): S[K]
    set(value: S[K]): void
  }
}
```

### MapActionsReturn

mapActions 返回类型。

```ts
type MapActionsReturn<
  A extends _ActionsTree,
  Keys extends keyof A
> = {
  [K in Keys]: A[K]
}
```

## 插件类型

### PiniaPlugin

插件函数类型。

```ts
type PiniaPlugin = (context: PiniaPluginContext) => 
  Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
```

### PiniaPluginContext

插件上下文类型。

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

### PiniaCustomProperties

自定义属性接口（可扩展）。

```ts
interface PiniaCustomProperties {}
```

### PiniaCustomStateProperties

自定义状态属性接口（可扩展）。

```ts
interface PiniaCustomStateProperties {}
```

## 订阅类型

### SubscriptionCallback

状态订阅回调类型。

```ts
type SubscriptionCallback<S> = (
  mutation: MutationType,
  state: UnwrapRef<S>
) => void
```

### MutationType

变更类型。

```ts
interface MutationType<S = StateTree> {
  type: 'direct' | 'patch object' | 'patch function'
  storeId: string
  payload?: any
  events?: DebuggerEvent[]
}
```

### ActionSubscriptionCallback

Action 订阅回调类型。

```ts
type ActionSubscriptionCallback<A extends _ActionsTree> = (
  context: ActionContext<A>
) => void
```

### ActionContext

Action 上下文类型。

```ts
interface ActionContext<A extends _ActionsTree> {
  name: string
  store: Store
  args: Parameters<A[keyof A]>
  after: (callback: (result: any) => void) => void
  onError: (callback: (error: Error) => void) => void
}
```

## 实用类型示例

### 基础 Store 类型

```ts
// 定义状态类型
interface UserState {
  id: number | null
  name: string
  email: string
  preferences: {
    theme: 'light' | 'dark'
    language: string
  }
}

// 定义 getters 类型
interface UserGetters {
  fullName: (state: UserState) => string
  isLoggedIn: (state: UserState) => boolean
  themeClass: (state: UserState) => string
}

// 定义 actions 类型
interface UserActions {
  login(credentials: { email: string; password: string }): Promise<void>
  logout(): void
  updateProfile(data: Partial<UserState>): Promise<void>
  setTheme(theme: 'light' | 'dark'): void
}

// Store 类型
type UserStore = Store<'user', UserState, UserGetters, UserActions>
```

### 组合式 API Store 类型

```ts
// 组合式 API store 返回类型
interface UserSetupReturn {
  // 状态
  id: Ref<number | null>
  name: Ref<string>
  email: Ref<string>
  preferences: Ref<{
    theme: 'light' | 'dark'
    language: string
  }>
  
  // 计算属性
  fullName: ComputedRef<string>
  isLoggedIn: ComputedRef<boolean>
  themeClass: ComputedRef<string>
  
  // 方法
  login(credentials: { email: string; password: string }): Promise<void>
  logout(): void
  updateProfile(data: Partial<UserState>): Promise<void>
  setTheme(theme: 'light' | 'dark'): void
}

// Store 定义类型
type UserSetupStore = () => UserSetupReturn
```

### 插件类型扩展

```ts
// 扩展 Pinia 自定义属性
declare module 'pinia' {
  export interface PiniaCustomProperties {
    // 添加路由器
    $router: Router
    
    // 添加 API 客户端
    $api: ApiClient
    
    // 添加工具方法
    $utils: {
      formatDate(date: Date): string
      debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T
    }
    
    // 添加重置方法
    $reset(): void
  }
  
  export interface PiniaCustomStateProperties {
    // 添加创建时间
    createdAt: Date
    
    // 添加版本信息
    version: string
    
    // 添加元数据
    metadata: Record<string, any>
  }
}
```

### 严格类型的 Store 定义

```ts
// 使用泛型约束确保类型安全
function defineTypedStore<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A extends _ActionsTree
>(
  id: Id,
  options: DefineStoreOptions<Id, S, G, A>
): StoreDefinition<Id, S, G, A> {
  return defineStore(id, options)
}

// 使用示例
const useUserStore = defineTypedStore('user', {
  state: (): UserState => ({
    id: null,
    name: '',
    email: '',
    preferences: {
      theme: 'light',
      language: 'en'
    }
  }),
  
  getters: {
    fullName: (state): string => `${state.name}`,
    isLoggedIn: (state): boolean => state.id !== null,
    themeClass: (state): string => `theme-${state.preferences.theme}`
  } satisfies UserGetters,
  
  actions: {
    async login(credentials) {
      // 实现登录逻辑
    },
    
    logout() {
      // 实现登出逻辑
    },
    
    async updateProfile(data) {
      // 实现更新逻辑
    },
    
    setTheme(theme) {
      this.preferences.theme = theme
    }
  } satisfies UserActions
})
```

## 高级类型模式

### 条件类型

```ts
// 根据条件提取不同类型
type ExtractStoreState<T> = T extends Store<any, infer S, any, any> ? S : never
type ExtractStoreGetters<T> = T extends Store<any, any, infer G, any> ? G : never
type ExtractStoreActions<T> = T extends Store<any, any, any, infer A> ? A : never

// 使用示例
type UserStoreState = ExtractStoreState<UserStore> // UserState
type UserStoreGetters = ExtractStoreGetters<UserStore> // UserGetters
type UserStoreActions = ExtractStoreActions<UserStore> // UserActions
```

### 映射类型

```ts
// 将所有属性转换为可选
type PartialStore<T extends StoreGeneric> = {
  [K in keyof T]?: T[K]
}

// 将所有方法转换为异步
type AsyncActions<T extends _ActionsTree> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<R>
    : T[K]
}

// 提取只读属性
type ReadonlyState<T extends StateTree> = {
  readonly [K in keyof T]: T[K]
}
```

### 工具类型组合

```ts
// 创建类型安全的 store 工厂
function createStoreFactory<
  Stores extends Record<string, StoreDefinition>
>(stores: Stores) {
  return {
    // 获取所有 store
    getStores(): Stores {
      return stores
    },
    
    // 获取特定 store
    getStore<K extends keyof Stores>(key: K): Stores[K] {
      return stores[key]
    },
    
    // 类型安全的 mapStores
    mapStores<K extends keyof Stores>(
      keys: K[]
    ): MapStoresReturn<Pick<Stores, K>> {
      return mapStores(...keys.map(key => stores[key])) as any
    }
  }
}

// 使用示例
const storeFactory = createStoreFactory({
  user: useUserStore,
  cart: useCartStore,
  products: useProductsStore
})

// 类型安全的访问
const userStore = storeFactory.getStore('user') // 类型为 UserStore
const mappedStores = storeFactory.mapStores(['user', 'cart']) // 类型安全
```

## 类型检查和验证

### 编译时类型检查

```ts
// 确保 store 符合特定接口
interface StoreContract<T extends StateTree> {
  $id: string
  $state: T
  $reset(): void
}

// 类型约束函数
function validateStore<T extends StateTree>(
  store: StoreContract<T>
): asserts store is Store<string, T, any, any> {
  if (!store.$id || typeof store.$reset !== 'function') {
    throw new Error('Invalid store structure')
  }
}

// 使用示例
const store = useUserStore()
validateStore(store) // 编译时和运行时验证
```

### 运行时类型检查

```ts
// 创建类型守卫
function isValidState<T extends StateTree>(
  state: unknown,
  schema: (state: unknown) => state is T
): state is T {
  return schema(state)
}

// 状态验证函数
function validateUserState(state: unknown): state is UserState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'id' in state &&
    'name' in state &&
    'email' in state &&
    'preferences' in state
  )
}

// 使用示例
const store = useUserStore()
if (isValidState(store.$state, validateUserState)) {
  // state 现在是 UserState 类型
  console.log(store.$state.name) // 类型安全
}
```

## 最佳实践

### 1. 类型定义组织

```ts
// types/stores.ts
export interface UserState {
  // 状态定义
}

export interface UserGetters {
  // getters 定义
}

export interface UserActions {
  // actions 定义
}

export type UserStore = Store<'user', UserState, UserGetters, UserActions>
```

### 2. 严格类型模式

```ts
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 3. 类型导出

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  // store 定义
})

// 导出类型
export type UserStoreType = ReturnType<typeof useUserStore>
export type UserStateType = UserStoreType['$state']
```

## 相关链接

- [TypeScript 指南](../guide/typescript.md)
- [类型安全最佳实践](../cookbook/typescript-best-practices.md)
- [高级 TypeScript 模式](../cookbook/advanced-typescript.md)