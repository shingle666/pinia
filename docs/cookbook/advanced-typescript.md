---
title: Advanced TypeScript Patterns
description: Master advanced TypeScript patterns and techniques for building sophisticated Pinia applications with complex type requirements.
head:
  - [meta, { name: description, content: "Master advanced TypeScript patterns and techniques for building sophisticated Pinia applications with complex type requirements." }]
  - [meta, { name: keywords, content: "Pinia TypeScript, Advanced TypeScript, Type Patterns, Generic Types, Conditional Types" }]
  - [meta, { property: "og:title", content: "Advanced TypeScript Patterns - Pinia" }]
  - [meta, { property: "og:description", content: "Master advanced TypeScript patterns and techniques for building sophisticated Pinia applications with complex type requirements." }]
---

# Advanced TypeScript Patterns

This guide explores advanced TypeScript patterns and techniques for building sophisticated Pinia applications with complex type requirements.

## Generic Store Patterns

### Generic Base Store

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

### Generic Store Factory

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
    // State
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
        
        // Update item in the list if it exists
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
      // State
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

### Using the Generic Store

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

## Conditional Types and Mapped Types

### Advanced Store Type Utilities

```ts
// types/store-utilities.ts
import type { Store } from 'pinia'

// Extract state type from store
export type StoreState<T> = T extends Store<string, infer S, any, any> ? S : never

// Extract getters type from store
export type StoreGetters<T> = T extends Store<string, any, infer G, any> ? G : never

// Extract actions type from store
export type StoreActions<T> = T extends Store<string, any, any, infer A> ? A : never

// Create a readonly version of store state
export type ReadonlyStoreState<T> = {
  readonly [K in keyof StoreState<T>]: StoreState<T>[K]
}

// Extract async actions from store
export type AsyncActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? T[K] : never
}

// Extract sync actions from store
export type SyncActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? never : T[K]
}

// Create a type that makes certain properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Create a type that makes certain properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// Deep readonly type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
```

### Conditional Store Composition

```ts
// composables/useConditionalStore.ts
import { computed } from 'vue'
import type { Store } from 'pinia'

// Conditional store hook based on user permissions
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

// Usage example
export function useAdminStore() {
  const userStore = useUserStore()
  
  return useConditionalStore(
    () => useAdminPanelStore(),
    userStore.isAdmin
  )
}
```

## Advanced Plugin Patterns

### Generic Plugin Factory

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
    // Apply store filter if provided
    if (config.storeFilter && !config.storeFilter(store.$id)) {
      return
    }

    // Merge plugin options with global options
    const mergedOptions = {
      ...config.options,
      ...piniaOptions?.[config.name]
    } as TOptions

    // Install the plugin
    config.install(store, mergedOptions)
  }
}
```

### Type-Safe Plugin with Generics

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

// Extend store type to include validation
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
    // Add validation state
    const validationState: ValidationState = {
      errors: {},
      isValid: true
    }

    // Add validation state to store
    store.$state.validation = validationState

    // Add validation methods
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
          errors.push(typeof result === 'string' ? result : rule.message || 'Validation failed')
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

    // Watch for state changes if enabled
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

    // Validate actions if enabled
    if (options?.validateOnAction) {
      store.$onAction(({ after }) => {
        after(() => {
          validateAll()
        })
      })
    }
  }
})

// Type augmentation for validation methods
declare module 'pinia' {
  export interface Store {
    validate<T extends keyof this['$state']>(field?: T): boolean
    getFieldErrors<T extends keyof this['$state']>(field: T): string[]
    clearErrors<T extends keyof this['$state']>(field?: T): void
  }
}
```

## Advanced Type Inference

### Smart Store Composition

```ts
// composables/useSmartStore.ts
import type { Store } from 'pinia'

// Infer store type from store factory
type InferStore<T> = T extends () => infer R ? R : never

// Create a composable that automatically infers store types
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

// Usage
const { user, product, order } = useSmartStore({
  user: useUserStore,
  product: useProductStore,
  order: useOrderStore
})

// All stores are properly typed!
```

### Dynamic Store Registry

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
      console.warn(`Store '${name}' not found in registry`)
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

// Type-safe store getter
export function getRegisteredStore<T extends Store>(
  name: string
): T | null {
  return storeRegistry.get<T>(name)
}
```

## Complex State Management Patterns

### State Machine Integration

```ts
// stores/state-machine-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Define state machine states
type OrderState = 
  | 'idle'
  | 'creating'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'error'

// Define state machine events
type OrderEvent = 
  | { type: 'CREATE' }
  | { type: 'SUBMIT' }
  | { type: 'PROCESS' }
  | { type: 'SHIP' }
  | { type: 'DELIVER' }
  | { type: 'CANCEL' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

// Define state transitions
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

  // Computed properties
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
      console.warn(`Invalid transition: ${event.type} from ${currentState.value}`)
      return false
    }

    const previousState = currentState.value
    currentState.value = nextState
    history.value.push(nextState)

    // Handle error events
    if (event.type === 'ERROR') {
      error.value = event.error
    } else if (event.type === 'RESET') {
      error.value = null
    }

    console.log(`State transition: ${previousState} -> ${nextState}`)
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

    history.value.pop() // Remove current state
    const previousState = history.value[history.value.length - 1]
    currentState.value = previousState
    return true
  }

  return {
    // State
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

### Event Sourcing Pattern

```ts
// stores/event-sourced-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Define event types
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

// Define aggregate state
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

  // Computed state from events
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

  // Event creation helpers
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

  // Commands (generate events)
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
      throw new Error(`User ${userId} not found or deleted`)
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
      throw new Error(`User ${userId} not found or already deleted`)
    }

    const event = createEvent<UserDeletedEvent>(
      'USER_DELETED',
      { userId },
      metadata
    )
    
    events.value.push(event)
  }

  // Query helpers
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

  // Snapshot management
  function createSnapshot(): void {
    snapshots.value = new Map(users.value)
  }

  function restoreFromSnapshot(): void {
    if (snapshots.value.size === 0) {
      throw new Error('No snapshot available')
    }
    
    // Clear events and rebuild from snapshot
    events.value = []
    
    for (const user of snapshots.value.values()) {
      if (!user.isDeleted) {
        createUser(user.id, user.name, user.email, { fromSnapshot: true })
      }
    }
  }

  // Replay events from a specific point
  function replayFrom(eventId: string): void {
    const eventIndex = events.value.findIndex(event => event.id === eventId)
    if (eventIndex === -1) {
      throw new Error(`Event ${eventId} not found`)
    }
    
    // Keep events up to the specified point
    events.value = events.value.slice(0, eventIndex + 1)
  }

  return {
    // State
    events: readonly(events),
    users,
    activeUsers,
    
    // Commands
    createUser,
    updateUser,
    deleteUser,
    
    // Queries
    getUserById,
    getUserEvents,
    getEventsByType,
    
    // Snapshot management
    createSnapshot,
    restoreFromSnapshot,
    replayFrom
  }
})
```

## Performance Optimization Patterns

### Lazy Loading with Type Safety

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
      // Wait for existing load to complete
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

// Usage
const { store: adminStore, load: loadAdminStore, isLoaded } = useLazyStore(
  () => import('@/stores/admin')
)

// Load when needed
if (userIsAdmin && !isLoaded.value) {
  await loadAdminStore()
}
```

### Memoized Computed Properties

```ts
// utils/memoized-computed.ts
import { computed, ref, type ComputedRef } from 'vue'

interface MemoizedComputedOptions {
  maxSize?: number
  ttl?: number // Time to live in milliseconds
}

export function memoizedComputed<T, TArgs extends readonly unknown[]>(
  fn: (...args: TArgs) => T,
  options: MemoizedComputedOptions = {}
): (...args: TArgs) => ComputedRef<T> {
  const { maxSize = 100, ttl = 5 * 60 * 1000 } = options // 5 minutes default TTL
  
  const cache = new Map<string, { value: ComputedRef<T>; timestamp: number }>()
  
  return (...args: TArgs): ComputedRef<T> => {
    const key = JSON.stringify(args)
    const now = Date.now()
    
    // Check if we have a valid cached result
    const cached = cache.get(key)
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value
    }
    
    // Create new computed property
    const computedValue = computed(() => fn(...args))
    
    // Store in cache
    cache.set(key, { value: computedValue, timestamp: now })
    
    // Clean up old entries if cache is too large
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      // Remove oldest entries
      const toRemove = entries.slice(0, cache.size - maxSize)
      toRemove.forEach(([key]) => cache.delete(key))
    }
    
    return computedValue
  }
}

// Usage in store
export const useOptimizedStore = defineStore('optimized', () => {
  const items = ref<Item[]>([])
  
  // Memoized expensive computation
  const getItemsByCategory = memoizedComputed(
    (category: string) => {
      return items.value.filter(item => item.category === category)
    },
    { maxSize: 50, ttl: 2 * 60 * 1000 } // 2 minutes TTL
  )
  
  return {
    items,
    getItemsByCategory
  }
})
```

## Testing Advanced Patterns

### Generic Store Testing Utilities

```ts
// tests/utils/store-test-utils.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach } from 'vitest'
import type { Store } from 'pinia'

// Generic store test setup
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

// Mock API responses with type safety
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

## Best Practices Summary

### 1. Type Safety
- Use generic types for reusable store patterns
- Leverage conditional types for complex scenarios
- Implement proper type guards and assertions
- Use mapped types for transformations

### 2. Performance
- Implement memoization for expensive computations
- Use lazy loading for non-critical stores
- Optimize with shallow refs where appropriate
- Cache computed properties strategically

### 3. Maintainability
- Create reusable store factories
- Use consistent patterns across stores
- Implement proper error handling
- Document complex type relationships

### 4. Testing
- Create generic testing utilities
- Mock external dependencies properly
- Test both success and error scenarios
- Use type-safe mocking approaches

## Related Resources

- [TypeScript Best Practices](./typescript-best-practices.md)
- [TypeScript API Reference](../api/typescript.md)
- [Plugin Development](./plugin-development.md)
- [Performance Guide](../guide/performance.md)