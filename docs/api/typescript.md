---
title: TypeScript API Reference
description: Complete API reference for Pinia TypeScript support. Learn how to use Pinia in TypeScript projects.
head:
  - [meta, { name: description, content: "Complete API reference for Pinia TypeScript support. Learn how to use Pinia in TypeScript projects." }]
  - [meta, { name: keywords, content: "Pinia TypeScript, TypeScript API, Vue TypeScript state management, type safety" }]
  - [meta, { property: "og:title", content: "TypeScript API Reference - Pinia" }]
  - [meta, { property: "og:description", content: "Complete API reference for Pinia TypeScript support. Learn how to use Pinia in TypeScript projects." }]
---

# TypeScript API Reference

This section provides a complete API reference for Pinia TypeScript support.

## Core Type Definitions

### Store Types

#### Store<Id, S, G, A>

Main type definition for stores.

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

#### Type Parameters

- **Id**: `string` - Unique identifier type for the store
- **S**: `StateTree` - State tree type
- **G**: `_GettersTree<S>` - Getters type
- **A**: `_ActionsTree` - Actions type

### StateTree

Base type for state trees.

```ts
type StateTree = Record<string | number | symbol, any>
```

### DefineStoreOptions

Type definition for defineStore options.

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

## Composition API Types

### DefineStoreOptionsInSetup

Store options type for Composition API style.

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

Composition API store definition type.

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

## Utility Types

### StoreDefinition

Type for store definitions.

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

Generic store type.

```ts
type StoreGeneric = Store<string, StateTree, _GettersTree<StateTree>, _ActionsTree>
```

### StoreToRefs

Return type for storeToRefs.

```ts
type StoreToRefs<SS extends StoreGeneric> = {
  [K in keyof SS as SS[K] extends _Method ? never : K]: SS[K] extends ComputedRef<infer U>
    ? ComputedRef<U>
    : SS[K] extends Ref<infer U>
    ? Ref<U>
    : Ref<UnwrapRef<SS[K]>>
}
```

## Mapping Helper Types

### MapStoresCustomization

Customization type for mapStores.

```ts
interface MapStoresCustomization {
  suffix?: string
}
```

### MapStoresReturn

Return type for mapStores.

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

Return type for mapState.

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

Return type for mapWritableState.

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

Return type for mapActions.

```ts
type MapActionsReturn<
  A extends _ActionsTree,
  Keys extends keyof A
> = {
  [K in Keys]: A[K]
}
```

## Plugin Types

### PiniaPlugin

Plugin function type.

```ts
type PiniaPlugin = (context: PiniaPluginContext) => 
  Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void
```

### PiniaPluginContext

Plugin context type.

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

Custom properties interface (extensible).

```ts
interface PiniaCustomProperties {}
```

### PiniaCustomStateProperties

Custom state properties interface (extensible).

```ts
interface PiniaCustomStateProperties {}
```

## Subscription Types

### SubscriptionCallback

State subscription callback type.

```ts
type SubscriptionCallback<S> = (
  mutation: MutationType,
  state: UnwrapRef<S>
) => void
```

### MutationType

Mutation type.

```ts
interface MutationType<S = StateTree> {
  type: 'direct' | 'patch object' | 'patch function'
  storeId: string
  payload?: any
  events?: DebuggerEvent[]
}
```

### ActionSubscriptionCallback

Action subscription callback type.

```ts
type ActionSubscriptionCallback<A extends _ActionsTree> = (
  context: ActionContext<A>
) => void
```

### ActionContext

Action context type.

```ts
interface ActionContext<A extends _ActionsTree> {
  name: string
  store: Store
  args: Parameters<A[keyof A]>
  after: (callback: (result: any) => void) => void
  onError: (callback: (error: Error) => void) => void
}
```

## Practical Type Examples

### Basic Store Types

```ts
// Define state type
interface UserState {
  id: number | null
  name: string
  email: string
  preferences: {
    theme: 'light' | 'dark'
    language: string
  }
}

// Define getters type
interface UserGetters {
  fullName: (state: UserState) => string
  isLoggedIn: (state: UserState) => boolean
  themeClass: (state: UserState) => string
}

// Define actions type
interface UserActions {
  login(credentials: { email: string; password: string }): Promise<void>
  logout(): void
  updateProfile(data: Partial<UserState>): Promise<void>
  setTheme(theme: 'light' | 'dark'): void
}

// Store type
type UserStore = Store<'user', UserState, UserGetters, UserActions>
```

### Composition API Store Types

```ts
// Composition API store return type
interface UserSetupReturn {
  // State
  id: Ref<number | null>
  name: Ref<string>
  email: Ref<string>
  preferences: Ref<{
    theme: 'light' | 'dark'
    language: string
  }>
  
  // Computed
  fullName: ComputedRef<string>
  isLoggedIn: ComputedRef<boolean>
  themeClass: ComputedRef<string>
  
  // Methods
  login(credentials: { email: string; password: string }): Promise<void>
  logout(): void
  updateProfile(data: Partial<UserState>): Promise<void>
  setTheme(theme: 'light' | 'dark'): void
}

// Store definition type
type UserSetupStore = () => UserSetupReturn
```

### Plugin Type Extensions

```ts
// Extend Pinia custom properties
declare module 'pinia' {
  export interface PiniaCustomProperties {
    // Add router
    $router: Router
    
    // Add API client
    $api: ApiClient
    
    // Add utility methods
    $utils: {
      formatDate(date: Date): string
      debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T
    }
    
    // Add reset method
    $reset(): void
  }
  
  export interface PiniaCustomStateProperties {
    // Add creation time
    createdAt: Date
    
    // Add version info
    version: string
    
    // Add metadata
    metadata: Record<string, any>
  }
}
```

### Strictly Typed Store Definition

```ts
// Use generic constraints to ensure type safety
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

// Usage example
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
      // Implement login logic
    },
    
    logout() {
      // Implement logout logic
    },
    
    async updateProfile(data) {
      // Implement update logic
    },
    
    setTheme(theme) {
      this.preferences.theme = theme
    }
  } satisfies UserActions
})
```

## Advanced Type Patterns

### Conditional Types

```ts
// Extract different types based on conditions
type ExtractStoreState<T> = T extends Store<any, infer S, any, any> ? S : never
type ExtractStoreGetters<T> = T extends Store<any, any, infer G, any> ? G : never
type ExtractStoreActions<T> = T extends Store<any, any, any, infer A> ? A : never

// Usage example
type UserStoreState = ExtractStoreState<UserStore> // UserState
type UserStoreGetters = ExtractStoreGetters<UserStore> // UserGetters
type UserStoreActions = ExtractStoreActions<UserStore> // UserActions
```

### Mapped Types

```ts
// Convert all properties to optional
type PartialStore<T extends StoreGeneric> = {
  [K in keyof T]?: T[K]
}

// Convert all methods to async
type AsyncActions<T extends _ActionsTree> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<R>
    : T[K]
}

// Extract readonly properties
type ReadonlyState<T extends StateTree> = {
  readonly [K in keyof T]: T[K]
}
```

### Utility Type Composition

```ts
// Create type-safe store factory
function createStoreFactory<
  Stores extends Record<string, StoreDefinition>
>(stores: Stores) {
  return {
    // Get all stores
    getStores(): Stores {
      return stores
    },
    
    // Get specific store
    getStore<K extends keyof Stores>(key: K): Stores[K] {
      return stores[key]
    },
    
    // Type-safe mapStores
    mapStores<K extends keyof Stores>(
      keys: K[]
    ): MapStoresReturn<Pick<Stores, K>> {
      return mapStores(...keys.map(key => stores[key])) as any
    }
  }
}

// Usage example
const storeFactory = createStoreFactory({
  user: useUserStore,
  cart: useCartStore,
  products: useProductsStore
})

// Type-safe access
const userStore = storeFactory.getStore('user') // Type is UserStore
const mappedStores = storeFactory.mapStores(['user', 'cart']) // Type safe
```

## Type Checking and Validation

### Compile-time Type Checking

```ts
// Ensure store conforms to specific interface
interface StoreContract<T extends StateTree> {
  $id: string
  $state: T
  $reset(): void
}

// Type constraint function
function validateStore<T extends StateTree>(
  store: StoreContract<T>
): asserts store is Store<string, T, any, any> {
  if (!store.$id || typeof store.$reset !== 'function') {
    throw new Error('Invalid store structure')
  }
}

// Usage example
const store = useUserStore()
validateStore(store) // Compile-time and runtime validation
```

### Runtime Type Checking

```ts
// Create type guards
function isValidState<T extends StateTree>(
  state: unknown,
  schema: (state: unknown) => state is T
): state is T {
  return schema(state)
}

// State validation function
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

// Usage example
const store = useUserStore()
if (isValidState(store.$state, validateUserState)) {
  // state is now UserState type
  console.log(store.$state.name) // Type safe
}
```

## Best Practices

### 1. Type Definition Organization

```ts
// types/stores.ts
export interface UserState {
  // State definition
}

export interface UserGetters {
  // Getters definition
}

export interface UserActions {
  // Actions definition
}

export type UserStore = Store<'user', UserState, UserGetters, UserActions>
```

### 2. Strict Type Mode

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

### 3. Type Exports

```ts
// stores/user.ts
export const useUserStore = defineStore('user', {
  // store definition
})

// Export types
export type UserStoreType = ReturnType<typeof useUserStore>
export type UserStateType = UserStoreType['$state']
```

## Related Links

- [TypeScript Guide](../guide/typescript.md)
- [Type Safety Best Practices](../cookbook/typescript-best-practices.md)
- [Advanced TypeScript Patterns](../cookbook/advanced-typescript.md)