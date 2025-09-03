---
title: 高级 TypeScript 模式
description: 掌握高级 TypeScript 模式和技术，构建具有复杂类型需求的精密 Pinia 应用程序。
head:
  - [meta, { name: description, content: "掌握高级 TypeScript 模式和技术，构建具有复杂类型需求的精密 Pinia 应用程序。" }]
  - [meta, { name: keywords, content: "Pinia TypeScript, 高级 TypeScript, 类型模式, 泛型类型, 条件类型" }]
  - [meta, { property: "og:title", content: "高级 TypeScript 模式 - Pinia" }]
  - [meta, { property: "og:description", content: "掌握高级 TypeScript 模式和技术，构建具有复杂类型需求的精密 Pinia 应用程序。" }]
---

# 高级 TypeScript 模式

本指南探讨了用于构建具有复杂类型需求的精密 Pinia 应用程序的高级 TypeScript 模式和技术。

## 泛型 Store 模式

### 泛型基础 Store

```ts
// types/base-store.ts
export interface BaseEntity {
  id: string | number
  createdAt: Date
  updatedAt: Date
}

export interface BaseState<T extends BaseEntity> {
  items: T[]
  selectedItem: T | null
  loading: boolean
  error: string | null
  filters: Record<string, unknown>
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface BaseActions<T extends BaseEntity> {
  fetchItems(params?: Record<string, unknown>): Promise<T[]>
  fetchItem(id: T['id']): Promise<T>
  createItem(data: Omit<T, keyof BaseEntity>): Promise<T>
  updateItem(id: T['id'], data: Partial<Omit<T, keyof BaseEntity>>): Promise<T>
  deleteItem(id: T['id']): Promise<void>
  setSelectedItem(item: T | null): void
  setFilters(filters: Record<string, unknown>): void
  clearError(): void
}

export interface BaseGetters<T extends BaseEntity> {
  filteredItems: T[]
  itemById: (id: T['id']) => T | undefined
  hasItems: boolean
  isLoading: boolean
  hasError: boolean
}
```

### 泛型 Store 工厂

```ts
// utils/store-factory.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { BaseEntity, BaseState, BaseActions, BaseGetters } from '@/types/base-store'

export interface StoreConfig<T extends BaseEntity> {
  name: string
  api: {
    getAll: (params?: Record<string, unknown>) => Promise<T[]>
    getById: (id: T['id']) => Promise<T>
    create: (data: Omit<T, keyof BaseEntity>) => Promise<T>
    update: (id: T['id'], data: Partial<Omit<T, keyof BaseEntity>>) => Promise<T>
    delete: (id: T['id']) => Promise<void>
  }
  defaultFilters?: Record<string, unknown>
  filterFunction?: (items: T[], filters: Record<string, unknown>) => T[]
}

export function createBaseStore<T extends BaseEntity>(
  config: StoreConfig<T>
) {
  return defineStore(config.name, () => {
    // 状态
    const state = reactive<BaseState<T>>({
      items: [],
      selectedItem: null,
      loading: false,
      error: null,
      filters: config.defaultFilters || {},
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      }
    })

    // Getters
    const filteredItems = computed((): T[] => {
      if (config.filterFunction) {
        return config.filterFunction(state.items, state.filters)
      }
      return state.items
    })

    const itemById = computed(() => {
      return (id: T['id']): T | undefined => {
        return state.items.find(item => item.id === id)
      }
    })

    const hasItems = computed((): boolean => {
      return state.items.length > 0
    })

    const isLoading = computed((): boolean => {
      return state.loading
    })

    const hasError = computed((): boolean => {
      return state.error !== null
    })

    // Actions
    async function fetchItems(params?: Record<string, unknown>): Promise<T[]> {
      state.loading = true
      state.error = null

      try {
        const items = await config.api.getAll(params)
        state.items = items
        return items
      } catch (error) {
        state.error = (error as Error).message
        throw error
      } finally {
        state.loading = false
      }
    }

    async function fetchItem(id: T['id']): Promise<T> {
      state.loading = true
      state.error = null

      try {
        const item = await config.api.getById(id)
        
        // 如果项目存在，则更新列表中的项目
        const index = state.items.findIndex(existing => existing.id === id)
        if (index !== -1) {
          state.items[index] = item
        } else {
          state.items.push(item)
        }
        
        return item
      } catch (error) {
        state.error = (error as Error).message
        throw error
      } finally {
        state.loading = false
      }
    }

    async function createItem(
      data: Omit<T, keyof BaseEntity>
    ): Promise<T> {
      state.loading = true
      state.error = null

      try {
        const item = await config.api.create(data)
        state.items.push(item)
        return item
      } catch (error) {
        state.error = (error as Error).message
        throw error
      } finally {
        state.loading = false
      }
    }

    async function updateItem(
      id: T['id'], 
      data: Partial<Omit<T, keyof BaseEntity>>
    ): Promise<T> {
      state.loading = true
      state.error = null

      try {
        const item = await config.api.update(id, data)
        
        const index = state.items.findIndex(existing => existing.id === id)
        if (index !== -1) {
          state.items[index] = item
        }
        
        if (state.selectedItem?.id === id) {
          state.selectedItem = item
        }
        
        return item
      } catch (error) {
        state.error = (error as Error).message
        throw error
      } finally {
        state.loading = false
      }
    }

    async function deleteItem(id: T['id']): Promise<void> {
      state.loading = true
      state.error = null

      try {
        await config.api.delete(id)
        
        state.items = state.items.filter(item => item.id !== id)
        
        if (state.selectedItem?.id === id) {
          state.selectedItem = null
        }
      } catch (error) {
        state.error = (error as Error).message
        throw error
      } finally {
        state.loading = false
      }
    }

    function setSelectedItem(item: T | null): void {
      state.selectedItem = item
    }

    function setFilters(filters: Record<string, unknown>): void {
      state.filters = { ...state.filters, ...filters }
    }

    function clearError(): void {
      state.error = null
    }

    return {
      // 状态
      ...toRefs(state),
      
      // Getters
      filteredItems,
      itemById,
      hasItems,
      isLoading,
      hasError,
      
      // Actions
      fetchItems,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
      setSelectedItem,
      setFilters,
      clearError
    }
  })
}
```

### 使用泛型 Store

```ts
// stores/product.ts
import { createBaseStore } from '@/utils/store-factory'
import { productApi } from '@/api/product'
import type { Product } from '@/types'

export interface Product extends BaseEntity {
  name: string
  description: string
  price: number
  category: string
  inStock: boolean
  tags: string[]
}

export const useProductStore = createBaseStore<Product>({
  name: 'product',
  api: productApi,
  defaultFilters: {
    category: '',
    inStock: undefined,
    priceRange: [0, 1000]
  },
  filterFunction: (products, filters) => {
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) {
        return false
      }
      
      if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
        return false
      }
      
      if (filters.priceRange) {
        const [min, max] = filters.priceRange as [number, number]
        if (product.price < min || product.price > max) {
          return false
        }
      }
      
      return true
    })
  }
})
```

## 条件类型和映射类型

### 高级 Store 类型工具

```ts
// types/store-utilities.ts
import type { Store } from 'pinia'

// 从 store 中提取状态类型
export type StoreState<T> = T extends Store<string, infer S, any, any> ? S : never

// 从 store 中提取 getters 类型
export type StoreGetters<T> = T extends Store<string, any, infer G, any> ? G : never

// 从 store 中提取 actions 类型
export type StoreActions<T> = T extends Store<string, any, any, infer A> ? A : never

// 创建 store 状态的只读版本
export type ReadonlyStoreState<T> = {
  readonly [K in keyof StoreState<T>]: StoreState<T>[K]
}

// 从 store 中提取异步 actions
export type AsyncActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? T[K] : never
}

// 从 store 中提取同步 actions
export type SyncActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? never : T[K]
}

// 创建使某些属性可选的类型
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 创建使某些属性必需的类型
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// 深度只读类型
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 深度可选类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
```

### 条件 Store 组合

```ts
// composables/useConditionalStore.ts
import { computed } from 'vue'
import type { Store } from 'pinia'

// 基于用户权限的条件 store hook
export function useConditionalStore<
  TStore extends Store,
  TCondition extends boolean
>(
  storeFactory: () => TStore,
  condition: TCondition
): TCondition extends true ? TStore : null {
  if (condition) {
    return storeFactory() as any
  }
  return null as any
}

// 使用示例
export function useAdminStore() {
  const userStore = useUserStore()
  
  return useConditionalStore(
    () => useAdminPanelStore(),
    userStore.isAdmin
  )
}
```

## 高级插件模式

### 泛型插件工厂

```ts
// plugins/plugin-factory.ts
import type { PiniaPlugin, Store } from 'pinia'

export interface PluginConfig<TOptions = Record<string, unknown>> {
  name: string
  options?: TOptions
  storeFilter?: (storeId: string) => boolean
  install: (store: Store, options?: TOptions) => void
}

export function createPlugin<TOptions = Record<string, unknown>>(
  config: PluginConfig<TOptions>
): PiniaPlugin {
  return ({ store, options: piniaOptions }) => {
    // 如果提供了 store 过滤器，则应用它
    if (config.storeFilter && !config.storeFilter(store.$id)) {
      return
    }

    // 合并插件选项和全局选项
    const mergedOptions = {
      ...config.options,
      ...piniaOptions?.[config.name]
    } as TOptions

    // 安装插件
    config.install(store, mergedOptions)
  }
}
```

### 类型安全的泛型插件

```ts
// plugins/validation-plugin.ts
import { createPlugin } from './plugin-factory'
import type { Store } from 'pinia'

export interface ValidationRule<T = any> {
  field: string
  validator: (value: T) => boolean | string
  message?: string
}

export interface ValidationOptions {
  rules: ValidationRule[]
  validateOnChange?: boolean
  validateOnAction?: boolean
}

export interface ValidationState {
  errors: Record<string, string[]>
  isValid: boolean
}

// 扩展 store 类型以包含验证
declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    validation?: ValidationOptions
  }
}

export const validationPlugin = createPlugin<ValidationOptions>({
  name: 'validation',
  options: {
    rules: [],
    validateOnChange: true,
    validateOnAction: false
  },
  install(store: Store, options) {
    // 添加验证状态
    const validationState: ValidationState = {
      errors: {},
      isValid: true
    }

    // 将验证状态添加到 store
    store.$state.validation = validationState

    // 添加验证方法
    store.validate = function<T extends keyof typeof store.$state>(
      field?: T
    ): boolean {
      if (field) {
        return validateField(field as string, store.$state[field])
      }
      return validateAll()
    }

    store.getFieldErrors = function<T extends keyof typeof store.$state>(
      field: T
    ): string[] {
      return validationState.errors[field as string] || []
    }

    store.clearErrors = function<T extends keyof typeof store.$state>(
      field?: T
    ): void {
      if (field) {
        delete validationState.errors[field as string]
      } else {
        validationState.errors = {}
      }
      updateValidationState()
    }

    function validateField(fieldName: string, value: any): boolean {
      const fieldRules = options?.rules.filter(rule => rule.field === fieldName) || []
      const errors: string[] = []

      for (const rule of fieldRules) {
        const result = rule.validator(value)
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : rule.message || '验证失败')
        }
      }

      if (errors.length > 0) {
        validationState.errors[fieldName] = errors
      } else {
        delete validationState.errors[fieldName]
      }

      updateValidationState()
      return errors.length === 0
    }

    function validateAll(): boolean {
      let isValid = true
      
      for (const rule of options?.rules || []) {
        const fieldValue = store.$state[rule.field]
        if (!validateField(rule.field, fieldValue)) {
          isValid = false
        }
      }
      
      return isValid
    }

    function updateValidationState(): void {
      validationState.isValid = Object.keys(validationState.errors).length === 0
    }

    // 如果启用，监听状态变化
    if (options?.validateOnChange) {
      store.$subscribe((mutation) => {
        if (mutation.type === 'direct') {
          const fieldName = mutation.events?.key as string
          if (fieldName && fieldName !== 'validation') {
            validateField(fieldName, mutation.events?.newValue)
          }
        }
      })
    }

    // 如果启用，验证 actions
    if (options?.validateOnAction) {
      store.$onAction(({ after }) => {
        after(() => {
          validateAll()
        })
      })
    }
  }
})

// 验证方法的类型扩展
declare module 'pinia' {
  export interface Store {
    validate<T extends keyof this['$state']>(field?: T): boolean
    getFieldErrors<T extends keyof this['$state']>(field: T): string[]
    clearErrors<T extends keyof this['$state']>(field?: T): void
  }
}
```

## 高级类型推断

### 智能 Store 组合

```ts
// composables/useSmartStore.ts
import type { Store } from 'pinia'

// 从 store 工厂推断 store 类型
type InferStore<T> = T extends () => infer R ? R : never

// 创建自动推断 store 类型的 composable
export function useSmartStore<
  TStores extends Record<string, () => Store>
>(
  stores: TStores
): {
  [K in keyof TStores]: InferStore<TStores[K]>
} {
  const result = {} as any
  
  for (const [key, storeFactory] of Object.entries(stores)) {
    result[key] = storeFactory()
  }
  
  return result
}

// 使用方法
const { user, product, order } = useSmartStore({
  user: useUserStore,
  product: useProductStore,
  order: useOrderStore
})

// 所有 stores 都有正确的类型！
```

### 动态 Store 注册表

```ts
// utils/store-registry.ts
import type { Store } from 'pinia'

interface StoreRegistry {
  [key: string]: () => Store
}

class DynamicStoreRegistry {
  private stores: StoreRegistry = {}
  private instances: Map<string, Store> = new Map()

  register<T extends Store>(
    name: string, 
    storeFactory: () => T
  ): void {
    this.stores[name] = storeFactory
  }

  get<T extends Store>(name: string): T | null {
    if (!this.stores[name]) {
      console.warn(`Store '${name}' 在注册表中未找到`)
      return null
    }

    if (!this.instances.has(name)) {
      this.instances.set(name, this.stores[name]())
    }

    return this.instances.get(name) as T
  }

  has(name: string): boolean {
    return name in this.stores
  }

  list(): string[] {
    return Object.keys(this.stores)
  }

  clear(): void {
    this.stores = {}
    this.instances.clear()
  }
}

export const storeRegistry = new DynamicStoreRegistry()

// 类型安全的 store getter
export function getRegisteredStore<T extends Store>(
  name: string
): T | null {
  return storeRegistry.get<T>(name)
}
```

## 复杂状态管理模式

### 状态机集成

```ts
// stores/state-machine-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义状态机状态
type OrderState = 
  | 'idle'
  | 'creating'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'error'

// 定义状态机事件
type OrderEvent = 
  | { type: 'CREATE' }
  | { type: 'SUBMIT' }
  | { type: 'PROCESS' }
  | { type: 'SHIP' }
  | { type: 'DELIVER' }
  | { type: 'CANCEL' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

// 定义状态转换
const orderTransitions: Record<OrderState, Partial<Record<OrderEvent['type'], OrderState>>> = {
  idle: { CREATE: 'creating' },
  creating: { SUBMIT: 'pending', CANCEL: 'cancelled', ERROR: 'error' },
  pending: { PROCESS: 'processing', CANCEL: 'cancelled' },
  processing: { SHIP: 'shipped', CANCEL: 'cancelled', ERROR: 'error' },
  shipped: { DELIVER: 'delivered' },
  delivered: {},
  cancelled: { RESET: 'idle' },
  error: { RESET: 'idle' }
}

export const useOrderStateMachineStore = defineStore('orderStateMachine', () => {
  const currentState = ref<OrderState>('idle')
  const error = ref<string | null>(null)
  const history = ref<OrderState[]>(['idle'])

  // 计算属性
  const canTransition = computed(() => {
    return (event: OrderEvent['type']): boolean => {
      return event in (orderTransitions[currentState.value] || {})
    }
  })

  const availableTransitions = computed((): OrderEvent['type'][] => {
    return Object.keys(orderTransitions[currentState.value] || {}) as OrderEvent['type'][]
  })

  const isInState = computed(() => {
    return (state: OrderState): boolean => {
      return currentState.value === state
    }
  })

  const canCreate = computed(() => canTransition.value('CREATE'))
  const canSubmit = computed(() => canTransition.value('SUBMIT'))
  const canProcess = computed(() => canTransition.value('PROCESS'))
  const canShip = computed(() => canTransition.value('SHIP'))
  const canDeliver = computed(() => canTransition.value('DELIVER'))
  const canCancel = computed(() => canTransition.value('CANCEL'))
  const canReset = computed(() => canTransition.value('RESET'))

  // Actions
  function transition(event: OrderEvent): boolean {
    const transitions = orderTransitions[currentState.value]
    const nextState = transitions?.[event.type]

    if (!nextState) {
      console.warn(`无效转换: ${event.type} 从 ${currentState.value}`)
      return false
    }

    const previousState = currentState.value
    currentState.value = nextState
    history.value.push(nextState)

    // 处理错误事件
    if (event.type === 'ERROR') {
      error.value = event.error
    } else if (event.type === 'RESET') {
      error.value = null
    }

    console.log(`状态转换: ${previousState} -> ${nextState}`)
    return true
  }

  function create(): boolean {
    return transition({ type: 'CREATE' })
  }

  function submit(): boolean {
    return transition({ type: 'SUBMIT' })
  }

  function process(): boolean {
    return transition({ type: 'PROCESS' })
  }

  function ship(): boolean {
    return transition({ type: 'SHIP' })
  }

  function deliver(): boolean {
    return transition({ type: 'DELIVER' })
  }

  function cancel(): boolean {
    return transition({ type: 'CANCEL' })
  }

  function setError(errorMessage: string): boolean {
    return transition({ type: 'ERROR', error: errorMessage })
  }

  function reset(): boolean {
    const result = transition({ type: 'RESET' })
    if (result) {
      history.value = ['idle']
    }
    return result
  }

  function goToPreviousState(): boolean {
    if (history.value.length <= 1) {
      return false
    }

    history.value.pop() // 移除当前状态
    const previousState = history.value[history.value.length - 1]
    currentState.value = previousState
    return true
  }

  return {
    // 状态
    currentState: readonly(currentState),
    error: readonly(error),
    history: readonly(history),
    
    // Getters
    canTransition,
    availableTransitions,
    isInState,
    canCreate,
    canSubmit,
    canProcess,
    canShip,
    canDeliver,
    canCancel,
    canReset,
    
    // Actions
    transition,
    create,
    submit,
    process,
    ship,
    deliver,
    cancel,
    setError,
    reset,
    goToPreviousState
  }
})
```

### 事件溯源模式

```ts
// stores/event-sourced-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义事件类型
interface BaseEvent {
  id: string
  type: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface UserCreatedEvent extends BaseEvent {
  type: 'USER_CREATED'
  payload: {
    userId: string
    name: string
    email: string
  }
}

interface UserUpdatedEvent extends BaseEvent {
  type: 'USER_UPDATED'
  payload: {
    userId: string
    changes: Record<string, unknown>
  }
}

interface UserDeletedEvent extends BaseEvent {
  type: 'USER_DELETED'
  payload: {
    userId: string
  }
}

type UserEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent

// 定义聚合状态
interface UserAggregate {
  id: string
  name: string
  email: string
  isDeleted: boolean
  version: number
}

export const useEventSourcedUserStore = defineStore('eventSourcedUser', () => {
  const events = ref<UserEvent[]>([])
  const snapshots = ref<Map<string, UserAggregate>>(new Map())

  // 从事件计算状态
  const users = computed((): Map<string, UserAggregate> => {
    const userMap = new Map<string, UserAggregate>()

    for (const event of events.value) {
      switch (event.type) {
        case 'USER_CREATED':
          userMap.set(event.payload.userId, {
            id: event.payload.userId,
            name: event.payload.name,
            email: event.payload.email,
            isDeleted: false,
            version: 1
          })
          break

        case 'USER_UPDATED':
          const existingUser = userMap.get(event.payload.userId)
          if (existingUser && !existingUser.isDeleted) {
            userMap.set(event.payload.userId, {
              ...existingUser,
              ...event.payload.changes,
              version: existingUser.version + 1
            })
          }
          break

        case 'USER_DELETED':
          const userToDelete = userMap.get(event.payload.userId)
          if (userToDelete) {
            userMap.set(event.payload.userId, {
              ...userToDelete,
              isDeleted: true,
              version: userToDelete.version + 1
            })
          }
          break
      }
    }

    return userMap
  })

  const activeUsers = computed((): UserAggregate[] => {
    return Array.from(users.value.values()).filter(user => !user.isDeleted)
  })

  // 事件创建助手
  function createEvent<T extends UserEvent>(
    type: T['type'],
    payload: T['payload'],
    metadata?: Record<string, unknown>
  ): T {
    return {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: new Date(),
      metadata
    } as T
  }

  // 命令（生成事件）
  function createUser(
    userId: string,
    name: string,
    email: string,
    metadata?: Record<string, unknown>
  ): void {
    const event = createEvent<UserCreatedEvent>(
      'USER_CREATED',
      { userId, name, email },
      metadata
    )
    
    events.value.push(event)
  }

  function updateUser(
    userId: string,
    changes: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    const user = users.value.get(userId)
    if (!user || user.isDeleted) {
      throw new Error(`用户 ${userId} 未找到或已删除`)
    }

    const event = createEvent<UserUpdatedEvent>(
      'USER_UPDATED',
      { userId, changes },
      metadata
    )
    
    events.value.push(event)
  }

  function deleteUser(
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    const user = users.value.get(userId)
    if (!user || user.isDeleted) {
      throw new Error(`用户 ${userId} 未找到或已删除`)
    }

    const event = createEvent<UserDeletedEvent>(
      'USER_DELETED',
      { userId },
      metadata
    )
    
    events.value.push(event)
  }

  // 查询助手
  function getUserById(userId: string): UserAggregate | undefined {
    return users.value.get(userId)
  }

  function getUserEvents(userId: string): UserEvent[] {
    return events.value.filter(event => 
      'userId' in event.payload && event.payload.userId === userId
    )
  }

  function getEventsByType<T extends UserEvent['type']>(
    type: T
  ): Extract<UserEvent, { type: T }>[] {
    return events.value.filter(event => event.type === type) as Extract<UserEvent, { type: T }>[]
  }

  // 快照管理
  function createSnapshot(): void {
    snapshots.value = new Map(users.value)
  }

  function restoreFromSnapshot(): void {
    if (snapshots.value.size === 0) {
      throw new Error('没有可用的快照')
    }
    
    // 清除事件并从快照重建
    events.value = []
    
    for (const user of snapshots.value.values()) {
      if (!user.isDeleted) {
        createUser(user.id, user.name, user.email, { fromSnapshot: true })
      }
    }
  }

  // 从特定点重放事件
  function replayFrom(eventId: string): void {
    const eventIndex = events.value.findIndex(event => event.id === eventId)
    if (eventIndex === -1) {
      throw new Error(`事件 ${eventId} 未找到`)
    }
    
    // 保留到指定点的事件
    events.value = events.value.slice(0, eventIndex + 1)
  }

  return {
    // 状态
    events: readonly(events),
    users,
    activeUsers,
    
    // 命令
    createUser,
    updateUser,
    deleteUser,
    
    // 查询
    getUserById,
    getUserEvents,
    getEventsByType,
    
    // 快照管理
    createSnapshot,
    restoreFromSnapshot,
    replayFrom
  }
})
```

## 性能优化模式

### 类型安全的懒加载

```ts
// composables/useLazyStore.ts
import { ref, computed, type Ref } from 'vue'
import type { Store } from 'pinia'

interface LazyStoreState<T> {
  store: T | null
  loading: boolean
  error: Error | null
}

export function useLazyStore<T extends Store>(
  storeFactory: () => Promise<{ default: () => T }>
): {
  store: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  load: () => Promise<T>
  isLoaded: Ref<boolean>
} {
  const state = ref<LazyStoreState<T>>({
    store: null,
    loading: false,
    error: null
  })

  const isLoaded = computed(() => state.value.store !== null)

  async function load(): Promise<T> {
    if (state.value.store) {
      return state.value.store
    }

    if (state.value.loading) {
      // 等待现有加载完成
      return new Promise((resolve, reject) => {
        const checkLoaded = () => {
          if (state.value.store) {
            resolve(state.value.store)
          } else if (state.value.error) {
            reject(state.value.error)
          } else {
            setTimeout(checkLoaded, 10)
          }
        }
        checkLoaded()
      })
    }

    state.value.loading = true
    state.value.error = null

    try {
      const module = await storeFactory()
      const store = module.default()
      state.value.store = store
      return store
    } catch (error) {
      state.value.error = error as Error
      throw error
    } finally {
      state.value.loading = false
    }
  }

  return {
    store: computed(() => state.value.store),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    load,
    isLoaded
  }
}

// 使用方法
const { store: adminStore, load: loadAdminStore, isLoaded } = useLazyStore(
  () => import('@/stores/admin')
)

// 需要时加载
if (userIsAdmin && !isLoaded.value) {
  await loadAdminStore()
}
```

### 记忆化计算属性

```ts
// utils/memoized-computed.ts
import { computed, ref, type ComputedRef } from 'vue'

interface MemoizedComputedOptions {
  maxSize?: number
  ttl?: number // 生存时间（毫秒）
}

export function memoizedComputed<T, TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => T,
  options: MemoizedComputedOptions = {}
): (...args: TArgs) => ComputedRef<T> {
  const { maxSize = 100, ttl = 5 * 60 * 1000 } = options // 默认 5 分钟 TTL
  
  const cache = new Map<string, { value: ComputedRef<T>; timestamp: number }>()
  
  return (...args: TArgs): ComputedRef<T> => {
    const key = JSON.stringify(args)
    const now = Date.now()
    
    // 检查是否有有效的缓存结果
    const cached = cache.get(key)
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value
    }
    
    // 创建新的计算属性
    const computedValue = computed(() => fn(...args))
    
    // 存储在缓存中
    cache.set(key, { value: computedValue, timestamp: now })
    
    // 如果缓存太大，清理旧条目
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // 移除最旧的条目
      const toRemove = entries.slice(0, cache.size - maxSize)
      toRemove.forEach(([key]) => cache.delete(key))
    }
    
    return computedValue
  }
}

// 在 store 中使用
export const useOptimizedStore = defineStore('optimized', () => {
  const items = ref<Item[]>([])
  
  // 记忆化昂贵计算
  const getItemsByCategory = memoizedComputed(
    (category: string) => {
      return items.value.filter(item => item.category === category)
    },
    { maxSize: 50, ttl: 2 * 60 * 1000 } // 2 分钟 TTL
  )
  
  return {
    items,
    getItemsByCategory
  }
})
```

## 测试高级模式

### 泛型 Store 测试工具

```ts
// tests/utils/store-test-utils.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach } from 'vitest'
import type { Store } from 'pinia'

// 泛型 store 测试设置
export function setupStoreTest<T extends Store>(
  storeFactory: () => T
): {
  store: T
  resetStore: () => void
} {
  let store: T
  
  beforeEach(() => {
    setActivePinia(createPinia())
    store = storeFactory()
  })
  
  const resetStore = () => {
    store.$reset()
  }
  
  return {
    get store() { return store },
    resetStore
  }
}

// 类型安全的模拟 API 响应
export function createMockApi<T extends Record<string, (...args: any[]) => any>>(
  api: T
): {
  [K in keyof T]: ReturnType<typeof vi.fn> & T[K]
} {
  const mockApi = {} as any
  
  for (const [key, fn] of Object.entries(api)) {
    mockApi[key] = vi.fn(fn)
  }
  
  return mockApi
}
```

## 最佳实践总结

### 1. 类型安全
- 为可重用的 store 模式使用泛型类型
- 为复杂场景利用条件类型
- 实现适当的类型守卫和断言
- 使用映射类型进行转换

### 2. 性能
- 为昂贵的计算实现记忆化
- 为非关键 stores 使用懒加载
- 在适当的地方使用浅层 refs 优化
- 策略性地缓存计算属性

### 3. 可维护性
- 创建可重用的 store 工厂
- 在 stores 中使用一致的模式
- 实现适当的错误处理
- 记录复杂的类型关系

### 4. 测试
- 创建泛型测试工具
- 正确模拟外部依赖
- 测试成功和错误场景
- 使用类型安全的模拟方法

## 相关资源

- [TypeScript 最佳实践](./typescript-best-practices.md)
- [TypeScript API 参考](../api/typescript.md)
- [插件开发](./plugin-development.md)
- [性能指南](../guide/performance.md)